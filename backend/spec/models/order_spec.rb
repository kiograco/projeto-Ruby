require "rails_helper"

RSpec.describe Order, type: :model do
  include ActiveJob::TestHelper

  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:order)).to be_valid
    end

    it "defaults to pending status" do
      expect(create(:order).status).to eq("pending")
    end
  end

  describe "total price computation" do
    it "keeps an explicitly provided total_price" do
      order = create(:order, total_price: 99.5)

      expect(order.total_price.to_f).to eq(99.5)
    end

    it "computes total_price from order items when not provided" do
      order = build(:order, :with_items)

      order.save!

      expect(order.total_price.to_f).to eq(50.0)
    end
  end

  describe "#transition_to!" do
    it "allows pending -> assigned" do
      order = create(:order)

      expect(order.transition_to!("assigned")).to be true
      expect(order.reload.status).to eq("assigned")
    end

    it "rejects invalid transitions" do
      order = create(:order)

      expect(order.transition_to!("delivered")).to be false
      expect(order.errors[:status]).to be_present
      expect(order.reload.status).to eq("pending")
    end

    it "sets delivered_at when transitioning to delivered" do
      order = create(:order)
      order.transition_to!("assigned")
      order.transition_to!("picked_up")
      order.transition_to!("in_transit")
      order.transition_to!("near_destination")

      order.transition_to!("delivered")

      expect(order.reload.delivered_at).to be_present
    end

    it "does not allow transitions out of a terminal state" do
      order = create(:order)
      order.transition_to!("cancelled")

      expect(order.transition_to!("assigned")).to be false
    end
  end

  describe "notifications" do
    let(:customer) { create(:customer) }
    let(:creator) { create(:user, :customer) }

    it "notifies the creator when the order is created" do
      expect {
        create(:order, customer: customer, created_by: creator)
      }.to change { creator.notifications.count }.by(1)

      expect(creator.notifications.last.event).to eq(Notification::ORDER_CREATED)
    end

    it "notifies the creator and driver when a driver is assigned" do
      order = create(:order, customer: customer, created_by: creator)
      driver = create(:driver)

      expect {
        order.update!(driver: driver)
      }.to change(Notification, :count).by(2)

      expect(driver.user.notifications.last.event).to eq(Notification::DRIVER_ASSIGNED)
    end

    it "does not notify again when the order is saved without changing the driver" do
      order = create(:order, customer: customer, created_by: creator, driver: create(:driver))

      expect { order.update!(total_price: 42) }.not_to change(Notification, :count)
    end

    it "notifies on delivery-relevant status transitions" do
      order = create(:order, customer: customer, created_by: creator)
      order.transition_to!("assigned")

      expect { order.transition_to!("picked_up") }.to change { creator.notifications.count }.by(1)
      expect(creator.notifications.last.event).to eq(Notification::PICKUP_COMPLETE)
    end

    it "does not notify on transitions with no mapped event (e.g. assigned)" do
      order = create(:order, customer: customer, created_by: creator)

      expect { order.transition_to!("assigned") }.not_to change(Notification, :count)
    end
  end

  describe "audit trail" do
    let(:customer) { create(:customer) }
    let(:creator) { create(:user, :customer) }

    it "logs an order_created entry when the order is created" do
      order = create(:order, customer: customer, created_by: creator)

      log = AuditLog.for_resource(order).sole
      expect(log.action).to eq("order_created")
      expect(log.after_state["status"]).to eq("pending")
    end

    it "logs a driver_assigned entry with before/after driver_id" do
      order = create(:order, customer: customer, created_by: creator)
      driver = create(:driver)

      order.update!(driver: driver)

      log = AuditLog.for_resource(order).find_by(action: "driver_assigned")
      expect(log.before_state["driver_id"]).to be_nil
      expect(log.after_state["driver_id"]).to eq(driver.id)
    end

    it "logs a status_change entry with before/after status" do
      order = create(:order, customer: customer, created_by: creator)

      order.transition_to!("assigned")

      log = AuditLog.for_resource(order).find_by(action: "status_change")
      expect(log.before_state["status"]).to eq("pending")
      expect(log.after_state["status"]).to eq("assigned")
    end
  end

  describe ".overdue" do
    it "includes only open orders past their estimate" do
      overdue = create(:order, customer: create(:customer), estimated_delivery_at: 1.hour.ago)
      create(:order, customer: create(:customer), estimated_delivery_at: 1.hour.from_now)
      create(:order, customer: create(:customer), estimated_delivery_at: nil)
      delivered = create(:order, customer: create(:customer), estimated_delivery_at: 1.hour.ago)
      delivered.update_column(:status, Order::DELIVERED)

      expect(Order.overdue).to contain_exactly(overdue)
    end
  end
end
