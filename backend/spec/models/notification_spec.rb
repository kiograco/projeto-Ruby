require "rails_helper"

RSpec.describe Notification, type: :model do
  it "is valid with valid attributes" do
    expect(build(:notification)).to be_valid
  end

  it "rejects an unknown event" do
    expect(build(:notification, event: "not_a_real_event")).not_to be_valid
  end

  describe "#read?" do
    it "is false by default" do
      expect(build(:notification)).not_to be_read
    end

    it "is true once marked as read" do
      notification = create(:notification)
      notification.mark_as_read!

      expect(notification).to be_read
    end
  end

  describe "#mark_as_read!" do
    it "sets read_at" do
      notification = create(:notification)

      notification.mark_as_read!

      expect(notification.read_at).to be_present
    end

    it "is idempotent" do
      notification = create(:notification, read_at: 1.day.ago)
      original = notification.read_at

      notification.mark_as_read!

      expect(notification.read_at).to eq(original)
    end
  end

  describe ".unread" do
    it "excludes read notifications" do
      unread = create(:notification)
      create(:notification, read_at: Time.current)

      expect(Notification.unread).to contain_exactly(unread)
    end
  end
end
