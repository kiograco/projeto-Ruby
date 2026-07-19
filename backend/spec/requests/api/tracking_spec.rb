require "rails_helper"

RSpec.describe "Api::Tracking", type: :request do
  include ActionCable::TestHelper

  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:customer) { create(:customer) }

  describe "POST /api/tracking/location" do
    it "records a point, updates the driver's position, and broadcasts it" do
      driver = create(:driver)
      order = create(:order, customer: customer, driver: driver, status: "assigned")

      expect {
        post "/api/tracking/location",
             params: { order_id: order.id, latitude: -23.5, longitude: -46.6, speed: 35 },
             headers: auth_headers(driver.user)
      }.to have_broadcasted_to(order).from_channel(DeliveryTrackingChannel)

      expect(response).to have_http_status(:created)
      expect(driver.reload.current_latitude.to_f).to eq(-23.5)
      expect(order.tracking_points.count).to eq(1)
    end

    it "forbids a driver from reporting location for an order they are not assigned to" do
      driver = create(:driver)
      order = create(:order, customer: customer)

      post "/api/tracking/location",
           params: { order_id: order.id, latitude: -23.5, longitude: -46.6 },
           headers: auth_headers(driver.user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids a non-driver from reporting location" do
      driver = create(:driver)
      order = create(:order, customer: customer, driver: driver)

      post "/api/tracking/location",
           params: { order_id: order.id, latitude: -23.5, longitude: -46.6 },
           headers: auth_headers(admin)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/tracking/:order_id" do
    it "returns the latest point for admin" do
      driver = create(:driver)
      order = create(:order, customer: customer, driver: driver)
      create(:tracking_point, order: order, driver: driver, recorded_at: 1.minute.ago)
      latest = create(:tracking_point, order: order, driver: driver, recorded_at: Time.current)

      get "/api/tracking/#{order.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["point"]["id"]).to eq(latest.id)
    end

    it "forbids an unrelated driver" do
      order = create(:order, customer: customer)
      other_driver = create(:driver)

      get "/api/tracking/#{order.id}", headers: auth_headers(other_driver.user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/tracking/history/:order_id" do
    it "returns points ordered by recorded_at" do
      driver = create(:driver)
      order = create(:order, customer: customer, driver: driver)
      older = create(:tracking_point, order: order, driver: driver, recorded_at: 2.minutes.ago)
      newer = create(:tracking_point, order: order, driver: driver, recorded_at: 1.minute.ago)

      get "/api/tracking/history/#{order.id}", headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["points"].map { |p| p["id"] }).to eq([ older.id, newer.id ])
    end
  end
end
