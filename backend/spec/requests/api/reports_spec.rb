require "rails_helper"

RSpec.describe "Api::Reports", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:driver_user) { create(:user, :driver) }
  let(:customer) { create(:customer) }

  def deliver_order!(**attrs)
    order = create(:order, customer: customer, **attrs)
    order.transition_to!("assigned")
    order.transition_to!("picked_up")
    order.transition_to!("in_transit")
    order.transition_to!("near_destination")
    order.transition_to!("delivered")
    order
  end

  describe "GET /api/reports/deliveries" do
    it "requires authentication" do
      get "/api/reports/deliveries"

      expect(response).to have_http_status(:unauthorized)
    end

    it "forbids a driver" do
      get "/api/reports/deliveries", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end

    it "groups deliveries by day within the range" do
      deliver_order!(total_price: 40)
      create(:order, customer: customer, status: "cancelled")

      get "/api/reports/deliveries", params: { from: Time.zone.today.iso8601, to: Time.zone.today.iso8601 },
                                      headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["rows"].size).to eq(1)
      expect(body["rows"].first["total"]).to eq(2)
      expect(body["rows"].first["delivered"]).to eq(1)
      expect(body["rows"].first["cancelled"]).to eq(1)
      expect(body["rows"].first["revenue"]).to eq(40.0)
    end

    it "exports as CSV" do
      deliver_order!(total_price: 40)

      get "/api/reports/deliveries", params: { export: "csv" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/csv")
      expect(response.body).to start_with("date,total,delivered,failed,cancelled,revenue")
    end

    it "exports as PDF" do
      deliver_order!(total_price: 40)

      get "/api/reports/deliveries", params: { export: "pdf" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("application/pdf")
      expect(response.body).to start_with("%PDF")
    end

    it "rejects an invalid date" do
      get "/api/reports/deliveries", params: { from: "not-a-date" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "GET /api/reports/drivers" do
    it "ranks drivers by completed deliveries" do
      busy_driver = create(:driver)
      quiet_driver = create(:driver)
      deliver_order!(driver: busy_driver, total_price: 30)
      deliver_order!(driver: busy_driver, total_price: 30)
      deliver_order!(driver: quiet_driver, total_price: 10)

      get "/api/reports/drivers", headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["rows"].first["driver_id"]).to eq(busy_driver.id)
      expect(body["rows"].first["deliveries_completed"]).to eq(2)
    end
  end

  describe "GET /api/reports/performance" do
    it "summarizes overall performance" do
      deliver_order!(total_price: 40)
      create(:order, customer: customer, status: "failed")

      get "/api/reports/performance", headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["total_orders"]).to eq(2)
      expect(body["delivered"]).to eq(1)
      expect(body["failed"]).to eq(1)
    end
  end

  describe "GET /api/reports/customers" do
    it "ranks customers by revenue and excludes customers with no orders" do
      big_spender = create(:customer)
      quiet_customer = create(:customer)
      create(:customer) # no orders at all
      deliver_order!(customer: big_spender, total_price: 100)
      deliver_order!(customer: quiet_customer, total_price: 10)

      get "/api/reports/customers", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      customer_ids = body["rows"].map { |row| row["customer_id"] }
      expect(customer_ids).to contain_exactly(big_spender.id, quiet_customer.id)
      expect(body["rows"].first["customer_id"]).to eq(big_spender.id)
      expect(body["rows"].first["revenue"]).to eq(100.0)
    end

    it "forbids a driver" do
      get "/api/reports/customers", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/reports/monthly" do
    it "groups deliveries by month within the range" do
      deliver_order!(total_price: 40)
      create(:order, customer: customer, status: "cancelled")

      this_month = Time.zone.today.strftime("%Y-%m")
      get "/api/reports/monthly", params: { from: Time.zone.today.iso8601, to: Time.zone.today.iso8601 },
                                   headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      row = body["rows"].find { |r| r["month"] == this_month }
      expect(row["total"]).to eq(2)
      expect(row["delivered"]).to eq(1)
      expect(row["cancelled"]).to eq(1)
      expect(row["revenue"]).to eq(40.0)
    end

    it "defaults to the last 12 months and exports as CSV" do
      deliver_order!(total_price: 40)

      get "/api/reports/monthly", params: { export: "csv" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/csv")
      expect(response.body).to start_with("month,total,delivered,failed,cancelled,revenue")
      expect(response.body.lines.size).to eq(13) # header + 12 months
    end
  end
end
