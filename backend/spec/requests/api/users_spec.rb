require "rails_helper"

RSpec.describe "Api::Users", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:dispatcher) { create(:user, :dispatcher) }
  let(:driver_user) { create(:user, :driver) }

  describe "GET /api/users" do
    it "requires authentication" do
      get "/api/users"

      expect(response).to have_http_status(:unauthorized)
    end

    it "lists users for admin" do
      create(:user, :dispatcher)

      get "/api/users", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["users"].size).to eq(2)
    end

    it "allows a dispatcher to list users" do
      get "/api/users", headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:ok)
    end

    it "forbids a driver from listing users" do
      get "/api/users", headers: auth_headers(driver_user)

      expect(response).to have_http_status(:forbidden)
    end

    it "filters by search term" do
      create(:user, :dispatcher, name: "Jane Ops", email: "jane@example.com")

      get "/api/users", params: { q: "Jane" }, headers: auth_headers(admin)

      body = JSON.parse(response.body)
      expect(body["users"].map { |u| u["name"] }).to contain_exactly("Jane Ops")
    end
  end

  describe "GET /api/users/:id" do
    it "returns the user for admin" do
      user = create(:user, :dispatcher)

      get "/api/users/#{user.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["id"]).to eq(user.id)
    end
  end

  describe "POST /api/users" do
    let(:valid_params) do
      { name: "Jane Ops", email: "jane@example.com", password: "secret123", role: "dispatcher" }
    end

    it "creates a user as admin" do
      post "/api/users", params: valid_params, headers: auth_headers(admin)

      expect(response).to have_http_status(:created)
      expect(User.find_by(email: "jane@example.com").role.name).to eq("dispatcher")
    end

    it "logs an audit entry stamped with the acting admin" do
      post "/api/users", params: valid_params, headers: auth_headers(admin)

      user = User.find_by(email: "jane@example.com")
      log = AuditLog.for_resource(user).sole
      expect(log.action).to eq("user_created")
      expect(log.user).to eq(admin)
      expect(log.after_state["role"]).to eq("dispatcher")
    end

    it "forbids a dispatcher from creating a user" do
      post "/api/users", params: valid_params, headers: auth_headers(dispatcher)

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects an invalid role" do
      post "/api/users", params: valid_params.merge(role: "superuser"), headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns validation errors" do
      post "/api/users", params: valid_params.merge(email: "not-an-email"), headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PUT /api/users/:id" do
    it "updates name, role, and active as admin" do
      user = create(:user, :dispatcher)

      put "/api/users/#{user.id}", params: { name: "Updated", role: "admin", active: false },
                                    headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      user.reload
      expect(user.name).to eq("Updated")
      expect(user.role.name).to eq("admin")
      expect(user.active).to be false
    end

    it "does not require a password" do
      user = create(:user, :dispatcher)
      original_digest = user.password_digest

      put "/api/users/#{user.id}", params: { name: "Updated" }, headers: auth_headers(admin)

      expect(user.reload.password_digest).to eq(original_digest)
    end

    it "logs an audit entry with before/after name" do
      user = create(:user, :dispatcher, name: "Original")

      put "/api/users/#{user.id}", params: { name: "Updated" }, headers: auth_headers(admin)

      log = AuditLog.for_resource(user).find_by(action: "user_updated")
      expect(log.before_state["name"]).to eq("Original")
      expect(log.after_state["name"]).to eq("Updated")
    end
  end

  describe "DELETE /api/users/:id" do
    it "deactivates rather than deletes" do
      user = create(:user, :dispatcher)

      delete "/api/users/#{user.id}", headers: auth_headers(admin)

      expect(response).to have_http_status(:no_content)
      expect(User.find(user.id).active).to be false
    end

    it "logs an audit entry for the deactivation" do
      user = create(:user, :dispatcher)

      delete "/api/users/#{user.id}", headers: auth_headers(admin)

      log = AuditLog.for_resource(user).find_by(action: "user_deactivated")
      expect(log.before_state["active"]).to be true
      expect(log.after_state["active"]).to be false
    end
  end
end
