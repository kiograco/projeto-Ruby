require "rails_helper"

RSpec.describe "Api::Dashboard", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:driver_user) { create(:user, :driver) }
  let(:customer) { create(:customer) }

  describe "GET /api/dashboard/overview" do
    it "requires authentication" do
      get "/api/dashboard/overview"

      expect(response).to have_http_status(:unauthorized)
    end

    it "forbids a driver" do
      get "/api/dashboard/overview", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end

    it "computes the metrics for admin" do
      online_driver = create(:driver, status: "available")
      create(:driver, status: "offline")

      create(:order, customer: customer, status: "pending")
      create(:order, customer: customer, status: "assigned")

      delivered = create(:order, customer: customer, total_price: 100)
      delivered.update!(created_at: 2.hours.ago)
      delivered.transition_to!("assigned")
      delivered.transition_to!("picked_up")
      delivered.transition_to!("in_transit")
      delivered.transition_to!("near_destination")
      delivered.transition_to!("delivered")

      get "/api/dashboard/overview", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["online_drivers"]).to eq(1)
      expect(body["active_drivers"]).to eq(2)
      expect(body["pending_deliveries"]).to eq(2)
      expect(body["completed_deliveries"]).to eq(1)
      expect(body["revenue_today"]).to eq(100.0)
      expect(body["average_delivery_time_minutes"]).to be > 0
      expect(online_driver).to be_present
    end
  end

  describe "GET /api/dashboard/realtime" do
    it "lists online drivers with their current order" do
      driver = create(:driver, status: "available", current_latitude: -23.5, current_longitude: -46.6)
      order = create(:order, customer: customer, driver: driver, status: "assigned")
      create(:driver, status: "offline")

      get "/api/dashboard/realtime", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["drivers"].size).to eq(1)
      expect(body["drivers"].first["current_order_id"]).to eq(order.id)
    end
  end
end
