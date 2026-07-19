require "rails_helper"

RSpec.describe NotificationMailer, type: :mailer do
  describe "#event_email" do
    it "addresses and renders the notification's title and body" do
      notification = create(:notification, title: "Delivered", body: "Order #1 has been delivered.")

      mail = described_class.event_email(notification)

      expect(mail.to).to eq([ notification.user.email ])
      expect(mail.subject).to eq("Delivered")
      expect(mail.body.encoded).to include("Order #1 has been delivered.")
    end
  end
end
