require "rails_helper"

RSpec.describe DeliveryDelayJob, type: :job do
  let(:customer) { create(:customer) }
  let(:creator) { create(:user, :customer) }

  it "notifies admins and dispatchers about overdue orders" do
    admin = create(:user, :admin)
    dispatcher = create(:user, :dispatcher)
    overdue_order = create(:order, customer: customer, created_by: creator, estimated_delivery_at: 1.hour.ago)

    described_class.perform_now

    expect(admin.notifications.where(event: Notification::DELIVERY_DELAYED, order: overdue_order)).to exist
    expect(dispatcher.notifications.where(event: Notification::DELIVERY_DELAYED, order: overdue_order)).to exist
  end

  it "does not notify twice within the renotify window" do
    create(:user, :admin)
    order = create(:order, customer: customer, created_by: creator, estimated_delivery_at: 1.hour.ago)

    described_class.perform_now

    expect { described_class.perform_now }.not_to change {
      order.notifications.where(event: Notification::DELIVERY_DELAYED).count
    }
  end

  it "ignores orders that are not overdue" do
    create(:user, :admin)
    create(:order, customer: customer, created_by: creator, estimated_delivery_at: 1.hour.from_now)

    expect { described_class.perform_now }.not_to change(Notification, :count)
  end
end
