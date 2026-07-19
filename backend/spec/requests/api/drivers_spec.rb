require "rails_helper"

RSpec.describe "Api::Drivers", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:dispatcher) { create(:user, :dispatcher) }

  describe "GET /api/drivers" do
    it "requires authentication" do
      get "/api/drivers"

      expect(response).to have_http_status(:unauthorized)
    end

    it "lists drivers for an admin" do
      create(:driver)

      get "/api/drivers", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["drivers"].size).to eq(1)
    end

    it "allows a driver to see only their own record" do
      driver = create(:driver)
      create(:driver)

      get "/api/drivers", headers: auth_headers(driver.user)

      body = JSON.parse(response.body)
      expect(body["drivers"].size).to eq(1)
      expect(body["drivers"].first["id"]).to eq(driver.id)
    end
  end

  describe "GET /api/drivers/:id" do
    it "allows a driver to view their own record" do
      driver = create(:driver)

      get "/api/drivers/#{driver.id}", headers: auth_headers(driver.user)

      expect(response).to have_http_status(:ok)
    end

    it "forbids a driver from viewing another driver's record" do
      driver = create(:driver)
      other_driver = create(:driver)

      get "/api/drivers/#{other_driver.id}", headers: auth_headers(driver.user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/drivers" do
    let(:valid_params) do
      { name: "João Motorista", email: "joao@example.com", password: "secret123", license_number: "LIC-999" }
    end

    it "creates a driver (and its user) as admin" do
      post "/api/drivers", params: valid_params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      driver = Driver.last
      expect(driver.license_number).to eq("LIC-999")
      expect(driver.user.email).to eq("joao@example.com")
      expect(driver.user.role.name).to eq(Role::DRIVER)
    end

    it "forbids a dispatcher from creating a driver" do
      post "/api/drivers", params: valid_params, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "rolls back the user when the driver is invalid" do
      create(:driver, license_number: "LIC-999")
      headers = auth_headers(admin)

      expect {
        post "/api/drivers", params: valid_params, headers: headers
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PUT /api/drivers/:id" do
    it "updates status and vehicle as admin" do
      driver = create(:driver)
      vehicle = create(:vehicle)

      put "/api/drivers/#{driver.id}", params: { status: "available", vehicle_id: vehicle.id }, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(driver.reload.status).to eq("available")
      expect(driver.vehicle).to eq(vehicle)
    end

    it "returns validation errors" do
      driver = create(:driver)
      other_driver = create(:driver)

      put "/api/drivers/#{driver.id}", params: { license_number: other_driver.license_number },
                                        headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /api/drivers/:id" do
    it "deletes a driver as admin" do
      driver = create(:driver)

      delete "/api/drivers/#{driver.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/drivers/:id/documents" do
    let(:file) { fixture_file_upload("driver_license.pdf", "application/pdf") }

    it "attaches a document as admin" do
      driver = create(:driver)

      post "/api/drivers/#{driver.id}/documents", params: { file: file }, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      expect(driver.documents.reload).to be_one
      body = JSON.parse(response.body)
      expect(body["documents"].first["filename"]).to eq("driver_license.pdf")
    end

    it "forbids a dispatcher from uploading a driver document" do
      driver = create(:driver)

      post "/api/drivers/#{driver.id}/documents", params: { file: file }, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects a request with no file" do
      driver = create(:driver)

      post "/api/drivers/#{driver.id}/documents", headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /api/drivers/:id/documents/:document_id" do
    it "removes the attached document as admin" do
      driver = create(:driver)
      driver.documents.attach(fixture_file_upload("driver_license.pdf", "application/pdf"))
      document_id = driver.documents.first.id

      delete "/api/drivers/#{driver.id}/documents/#{document_id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(driver.documents.reload).to be_empty
    end
  end
end
