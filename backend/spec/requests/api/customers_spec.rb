require "rails_helper"

RSpec.describe "Api::Customers", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:dispatcher) { create(:user, :dispatcher) }
  let(:driver) { create(:user, :driver) }

  describe "GET /api/customers" do
    it "requires authentication" do
      get "/api/customers"

      expect(response).to have_http_status(:unauthorized)
    end

    it "lists customers for an admin" do
      create_list(:customer, 3)

      get "/api/customers", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["customers"].size).to eq(3)
      expect(body["meta"]).to include("page" => 1, "count" => 3)
    end

    it "allows a dispatcher to list customers" do
      create(:customer)

      get "/api/customers", headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:ok)
    end

    it "forbids a driver from listing customers" do
      get "/api/customers", headers: auth_headers(driver)

      expect(response).to have_http_status(:forbidden)
    end

    it "paginates results" do
      create_list(:customer, 3)

      get "/api/customers", params: { page: 1, limit: 2 }, headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["customers"].size).to eq(2)
      expect(body["meta"]["pages"]).to eq(2)
    end

    it "filters by search term" do
      create(:customer, name: "Ana Silva")
      create(:customer, name: "Someone Else")

      get "/api/customers", params: { q: "Ana" }, headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["customers"].size).to eq(1)
      expect(body["customers"].first["name"]).to eq("Ana Silva")
    end
  end

  describe "GET /api/customers/:id" do
    it "returns the customer for an admin" do
      customer = create(:customer)

      get "/api/customers/#{customer.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["id"]).to eq(customer.id)
    end

    it "returns 404 for an unknown customer" do
      get "/api/customers/999999", headers: auth_headers(admin)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/customers" do
    let(:valid_params) { { name: "Ana Silva", phone: "+55 11 99999-0000", email: "ana@example.com", document: "111.222.333-44" } }

    it "creates a customer as admin" do
      post "/api/customers", params: valid_params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      expect(Customer.find_by(email: "ana@example.com")).to be_present
    end

    it "forbids a dispatcher from creating a customer" do
      post "/api/customers", params: valid_params, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "returns validation errors" do
      post "/api/customers", params: valid_params.merge(email: "not-an-email"), headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to be_present
    end
  end

  describe "PUT /api/customers/:id" do
    it "updates a customer as admin" do
      customer = create(:customer)

      put "/api/customers/#{customer.id}", params: { name: "Updated Name" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(customer.reload.name).to eq("Updated Name")
    end

    it "forbids a dispatcher from updating a customer" do
      customer = create(:customer)

      put "/api/customers/#{customer.id}", params: { name: "Updated Name" }, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "returns validation errors" do
      customer = create(:customer)

      put "/api/customers/#{customer.id}", params: { email: "not-an-email" }, headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /api/customers/:id" do
    it "deletes a customer as admin" do
      customer = create(:customer)

      delete "/api/customers/#{customer.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:no_content)
      expect(Customer.find_by(id: customer.id)).to be_nil
    end

    it "forbids a dispatcher from deleting a customer" do
      customer = create(:customer)

      delete "/api/customers/#{customer.id}", headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
