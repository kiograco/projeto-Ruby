require "rails_helper"

RSpec.describe "Api::Vehicles", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:dispatcher) { create(:user, :dispatcher) }
  let(:driver_user) { create(:user, :driver) }

  describe "GET /api/vehicles" do
    it "requires authentication" do
      get "/api/vehicles"

      expect(response).to have_http_status(:unauthorized)
    end

    it "lists vehicles for an admin" do
      create_list(:vehicle, 2)

      get "/api/vehicles", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["vehicles"].size).to eq(2)
    end

    it "forbids a driver from listing vehicles" do
      get "/api/vehicles", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/vehicles/:id" do
    it "returns the vehicle for an admin" do
      vehicle = create(:vehicle)

      get "/api/vehicles/#{vehicle.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["id"]).to eq(vehicle.id)
    end

    it "forbids a driver" do
      vehicle = create(:vehicle)

      get "/api/vehicles/#{vehicle.id}", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/vehicles" do
    let(:valid_params) { { plate: "ABC-1234", model: "Sprinter", year: 2023, vehicle_type: "van", capacity: 1000 } }

    it "creates a vehicle as admin" do
      post "/api/vehicles", params: valid_params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
    end

    it "forbids a dispatcher from creating a vehicle" do
      post "/api/vehicles", params: valid_params, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "returns validation errors" do
      post "/api/vehicles", params: valid_params.merge(vehicle_type: "spaceship"), headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PUT /api/vehicles/:id" do
    it "updates a vehicle as admin" do
      vehicle = create(:vehicle)

      put "/api/vehicles/#{vehicle.id}", params: { model: "Updated Model" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(vehicle.reload.model).to eq("Updated Model")
    end

    it "returns validation errors" do
      vehicle = create(:vehicle)

      put "/api/vehicles/#{vehicle.id}", params: { vehicle_type: "spaceship" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /api/vehicles/:id" do
    it "deletes a vehicle as admin" do
      vehicle = create(:vehicle)

      delete "/api/vehicles/#{vehicle.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:no_content)
    end
  end
end
