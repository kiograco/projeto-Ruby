require "rails_helper"

RSpec.describe "Api::Auth", type: :request do
  describe "POST /api/auth/login" do
    it "returns tokens for valid credentials" do
      user = create(:user, email: "driver@example.com", password: "secret123")

      post "/api/auth/login", params: { email: "driver@example.com", password: "secret123" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["access_token"]).to be_present
      expect(body["refresh_token"]).to be_present
      expect(body["user"]["email"]).to eq(user.email)
    end

    it "is case-insensitive on email" do
      create(:user, email: "driver@example.com", password: "secret123")

      post "/api/auth/login", params: { email: "DRIVER@example.com", password: "secret123" }

      expect(response).to have_http_status(:ok)
    end

    it "rejects an invalid password" do
      create(:user, email: "driver@example.com", password: "secret123")

      post "/api/auth/login", params: { email: "driver@example.com", password: "wrong" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an unknown email" do
      post "/api/auth/login", params: { email: "nobody@example.com", password: "secret123" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an inactive user" do
      create(:user, email: "driver@example.com", password: "secret123", active: false)

      post "/api/auth/login", params: { email: "driver@example.com", password: "secret123" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "locks the account after too many failed attempts" do
      create(:user, email: "driver@example.com", password: "secret123")

      User::MAX_FAILED_ATTEMPTS.times do
        post "/api/auth/login", params: { email: "driver@example.com", password: "wrong" }
      end

      post "/api/auth/login", params: { email: "driver@example.com", password: "secret123" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/auth/refresh" do
    it "rotates the refresh token and issues a new access token" do
      user = create(:user)
      raw_refresh_token, old_record = RefreshToken.issue_for(user)

      post "/api/auth/refresh", params: { refresh_token: raw_refresh_token }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["refresh_token"]).not_to eq(raw_refresh_token)
      expect(old_record.reload).to be_revoked
    end

    it "rejects a revoked refresh token" do
      user = create(:user)
      raw_refresh_token, record = RefreshToken.issue_for(user)
      record.revoke!

      post "/api/auth/refresh", params: { refresh_token: raw_refresh_token }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an unknown refresh token" do
      post "/api/auth/refresh", params: { refresh_token: "bogus" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/auth/logout" do
    it "revokes the refresh token" do
      user = create(:user)
      raw_refresh_token, record = RefreshToken.issue_for(user)

      post "/api/auth/logout", params: { refresh_token: raw_refresh_token }

      expect(response).to have_http_status(:no_content)
      expect(record.reload).to be_revoked
    end
  end

  describe "GET /api/me" do
    it "requires authentication" do
      get "/api/me"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the current user for a valid access token" do
      user = create(:user)
      token = JwtService.encode(user)

      get "/api/me", headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["email"]).to eq(user.email)
    end

    it "rejects an expired access token" do
      user = create(:user)
      token = JWT.encode(
        { sub: user.id, exp: 1.minute.ago.to_i },
        JwtService.secret,
        JwtService::ALGORITHM
      )

      get "/api/me", headers: { "Authorization" => "Bearer #{token}" }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
