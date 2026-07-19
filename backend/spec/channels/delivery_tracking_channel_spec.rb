require "rails_helper"

RSpec.describe DeliveryTrackingChannel, type: :channel do
  let(:admin) { create(:user, :admin) }
  let(:customer) { create(:customer) }
  let(:order) { create(:order, customer: customer) }

  it "confirms the subscription for an admin" do
    stub_connection(current_user: admin)

    subscribe(order_id: order.id)

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for(order)
  end

  it "confirms the subscription for the assigned driver" do
    driver = create(:driver)
    order.update!(driver: driver)
    stub_connection(current_user: driver.user)

    subscribe(order_id: order.id)

    expect(subscription).to be_confirmed
  end

  it "rejects an unrelated driver" do
    driver = create(:driver)
    stub_connection(current_user: driver.user)

    subscribe(order_id: order.id)

    expect(subscription).to be_rejected
  end

  it "rejects a subscription for an unknown order" do
    stub_connection(current_user: admin)

    subscribe(order_id: 999_999)

    expect(subscription).to be_rejected
  end
end
