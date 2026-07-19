require "rails_helper"

RSpec.describe CleanupLogsJob, type: :job do
  it "deletes read notifications older than the retention window" do
    old_read = create(:notification, read_at: 1.day.ago)
    old_read.update_column(:created_at, (CleanupLogsJob::RETENTION + 1.day).ago)

    described_class.perform_now

    expect(Notification.find_by(id: old_read.id)).to be_nil
  end

  it "keeps recent notifications regardless of read state" do
    recent = create(:notification, read_at: 1.day.ago)

    described_class.perform_now

    expect(Notification.find_by(id: recent.id)).to be_present
  end

  it "keeps old but unread notifications" do
    old_unread = create(:notification)
    old_unread.update_column(:created_at, (CleanupLogsJob::RETENTION + 1.day).ago)

    described_class.perform_now

    expect(Notification.find_by(id: old_unread.id)).to be_present
  end
end
