require "rails_helper"

RSpec.describe "Api::Orders", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:dispatcher) { create(:user, :dispatcher) }
  let(:customer_user) { create(:user, :customer) }
  let(:customer) { create(:customer) }

  let(:address_params) do
    { street: "Rua A", number: "10", neighborhood: "Centro", city: "SP", state: "SP", zip_code: "01000-000" }
  end

  let(:valid_params) do
    {
      customer_id: customer.id,
      total_price: 75,
      pickup_address_attributes: address_params,
      delivery_address_attributes: address_params.merge(street: "Rua B")
    }
  end

  describe "POST /api/orders" do
    it "creates an order with nested addresses as admin" do
      post "/api/orders", params: valid_params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("pending")
      expect(body["pickup_address"]["street"]).to eq("Rua A")
      expect(Order.last.created_by).to eq(admin)
    end

    it "allows a customer-role user to create an order" do
      post "/api/orders", params: valid_params, headers: auth_headers(customer_user)

      expect(response).to have_http_status(:created)
    end

    it "forbids a driver from creating an order" do
      driver_user = create(:driver).user

      post "/api/orders", params: valid_params, headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end

    it "computes total_price from nested order items when omitted" do
      params = valid_params.except(:total_price).merge(
        order_items_attributes: [ { description: "Box", quantity: 3, unit_price: 10 } ]
      )

      post "/api/orders", params: params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["total_price"]).to eq(30.0)
    end
  end

  describe "GET /api/orders" do
    it "lets admin see all orders" do
      create_list(:order, 2, customer: customer)

      get "/api/orders", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["orders"].size).to eq(2)
    end

    it "scopes drivers to their own assigned orders" do
      driver = create(:driver)
      assigned_order = create(:order, customer: customer, driver: driver)
      create(:order, customer: customer)

      get "/api/orders", headers: auth_headers(driver.user)

      body = JSON.parse(response.body)
      expect(body["orders"].size).to eq(1)
      expect(body["orders"].first["id"]).to eq(assigned_order.id)
    end

    it "filters by status" do
      pending_order = create(:order, customer: customer)
      cancelled_order = create(:order, customer: customer)
      cancelled_order.transition_to!("cancelled")

      get "/api/orders", params: { status: "cancelled" }, headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["orders"].map { |o| o["id"] }).to contain_exactly(cancelled_order.id)
      expect(body["orders"].map { |o| o["id"] }).not_to include(pending_order.id)
    end
  end

  describe "PATCH /api/orders/:id" do
    it "assigns a driver as dispatcher" do
      order = create(:order, customer: customer)
      driver = create(:driver)

      patch "/api/orders/#{order.id}", params: { driver_id: driver.id }, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:ok)
      expect(order.reload.driver).to eq(driver)
    end

    it "transitions status through the allowed flow" do
      order = create(:order, customer: customer)

      patch "/api/orders/#{order.id}", params: { status: "assigned" }, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:ok)
      expect(order.reload.status).to eq("assigned")
    end

    it "rejects an invalid status transition" do
      order = create(:order, customer: customer)

      patch "/api/orders/#{order.id}", params: { status: "delivered" }, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "lets the assigned driver update status but not reassign the driver" do
      driver = create(:driver)
      other_driver = create(:driver)
      order = create(:order, customer: customer, driver: driver, status: "assigned")

      patch "/api/orders/#{order.id}",
            params: { status: "picked_up", driver_id: other_driver.id },
            headers: auth_headers(driver.user)

      expect(response).to have_http_status(:ok)
      order.reload
      expect(order.status).to eq("picked_up")
      expect(order.driver).to eq(driver)
    end

    it "forbids an unrelated driver from updating the order" do
      driver = create(:driver)
      order = create(:order, customer: customer)

      patch "/api/orders/#{order.id}", params: { status: "assigned" }, headers: auth_headers(driver.user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/orders/:id" do
    it "allows admin to delete an order" do
      order = create(:order, customer: customer)

      delete "/api/orders/#{order.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:no_content)
    end

    it "forbids a dispatcher from deleting an order" do
      order = create(:order, customer: customer)

      delete "/api/orders/#{order.id}", headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
