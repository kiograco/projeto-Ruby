require "rails_helper"

RSpec.describe OrderEventNotifier do
  include ActiveJob::TestHelper

  let(:customer) { create(:customer) }
  let(:creator) { create(:user, :customer) }

  it "creates a notification per recipient and enqueues an email job for each" do
    order = create(:order, customer: customer, created_by: creator)
    driver = create(:driver)

    expect {
      described_class.notify(order, Notification::DRIVER_ASSIGNED, recipients: [ creator, driver.user ])
    }.to change(Notification, :count).by(2)
      .and have_enqueued_job(SendEmailJob).exactly(2).times
  end

  it "deduplicates and drops nil recipients" do
    order = create(:order, customer: customer, created_by: creator)

    expect {
      described_class.notify(order, Notification::DRIVER_ASSIGNED, recipients: [ creator, creator, nil ])
    }.to change(Notification, :count).by(1)
  end

  it "stamps the title and body for the given event" do
    order = create(:order, customer: customer, created_by: creator)

    notification = described_class.notify(order, Notification::DELIVERED, recipients: [ creator ]).first

    expect(notification.title).to eq("Delivered")
    expect(notification.body).to include("delivered")
  end
end
