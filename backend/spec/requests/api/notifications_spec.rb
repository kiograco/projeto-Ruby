require "rails_helper"

RSpec.describe "Api::Notifications", type: :request do
  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtService.encode(user)}" }
  end

  let(:user) { create(:user) }

  describe "GET /api/notifications" do
    it "requires authentication" do
      get "/api/notifications"

      expect(response).to have_http_status(:unauthorized)
    end

    it "lists only the current user's notifications" do
      mine = create(:notification, user: user)
      create(:notification)

      get "/api/notifications", headers: auth_headers(user)

      body = JSON.parse(response.body)
      expect(body["notifications"].map { |n| n["id"] }).to contain_exactly(mine.id)
    end

    it "reports the unread count" do
      create(:notification, user: user)
      create(:notification, user: user, read_at: Time.current)

      get "/api/notifications", headers: auth_headers(user)

      expect(JSON.parse(response.body)["unread_count"]).to eq(1)
    end

    it "filters to unread only when requested" do
      unread = create(:notification, user: user)
      create(:notification, user: user, read_at: Time.current)

      get "/api/notifications", params: { unread: "true" }, headers: auth_headers(user)

      body = JSON.parse(response.body)
      expect(body["notifications"].map { |n| n["id"] }).to contain_exactly(unread.id)
    end
  end

  describe "PATCH /api/notifications/:id" do
    it "marks the notification as read" do
      notification = create(:notification, user: user)

      patch "/api/notifications/#{notification.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(notification.reload).to be_read
    end

    it "does not allow marking another user's notification as read" do
      other_notification = create(:notification)

      patch "/api/notifications/#{other_notification.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/notifications/mark_all_read" do
    it "marks all of the current user's notifications as read" do
      create_list(:notification, 2, user: user)

      post "/api/notifications/mark_all_read", headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(user.notifications.unread).to be_empty
    end
  end
end
