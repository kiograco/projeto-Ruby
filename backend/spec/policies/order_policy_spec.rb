require "rails_helper"

RSpec.describe OrderPolicy do
  let(:customer) { create(:customer) }

  describe "#show?" do
    it "allows the customer-role user who created the order" do
      creator = create(:user, :customer)
      order = create(:order, customer: customer, created_by: creator)

      expect(described_class.new(creator, order).show?).to be true
    end

    it "denies a customer-role user who did not create the order" do
      creator = create(:user, :customer)
      other_customer = create(:user, :customer)
      order = create(:order, customer: customer, created_by: creator)

      expect(described_class.new(other_customer, order).show?).to be false
    end
  end

  describe "Scope" do
    it "scopes to orders created by a customer-role user" do
      creator = create(:user, :customer)
      own_order = create(:order, customer: customer, created_by: creator)
      create(:order, customer: customer)

      resolved = described_class::Scope.new(creator, Order).resolve

      expect(resolved).to contain_exactly(own_order)
    end

    it "returns none for an unauthenticated scope" do
      resolved = described_class::Scope.new(nil, Order).resolve

      expect(resolved).to be_empty
    end
  end
end
