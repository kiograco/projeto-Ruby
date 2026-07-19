require "rails_helper"

RSpec.describe Order, type: :model do
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
end
