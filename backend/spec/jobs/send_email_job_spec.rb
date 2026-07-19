require "rails_helper"

RSpec.describe SendEmailJob, type: :job do
  it "delivers the notification email" do
    notification = create(:notification)

    expect {
      described_class.perform_now(notification.id)
    }.to change { ActionMailer::Base.deliveries.count }.by(1)

    expect(ActionMailer::Base.deliveries.last.to).to eq([ notification.user.email ])
  end

  it "does nothing for a notification that no longer exists" do
    expect {
      described_class.perform_now(-1)
    }.not_to change { ActionMailer::Base.deliveries.count }
  end
end
