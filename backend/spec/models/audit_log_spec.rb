require "rails_helper"

RSpec.describe AuditLog, type: :model do
  it "is valid with valid attributes" do
    expect(build(:audit_log)).to be_valid
  end

  it "requires an action" do
    log = build(:audit_log, action: nil)

    expect(log).not_to be_valid
    expect(log.errors[:action]).to be_present
  end

  it "does not require a user (system-triggered events)" do
    expect(build(:audit_log, user: nil)).to be_valid
  end

  describe ".for_resource" do
    it "scopes to the given resource's type and id" do
      customer = create(:customer)
      matching = create(:audit_log, resource_type: "Customer", resource_id: customer.id)
      create(:audit_log, resource_type: "Customer", resource_id: customer.id + 1)
      create(:audit_log, resource_type: "Order", resource_id: customer.id)

      expect(AuditLog.for_resource(customer)).to contain_exactly(matching)
    end
  end

  describe ".recent_first" do
    it "orders newest first" do
      older = create(:audit_log, created_at: 2.days.ago)
      newer = create(:audit_log, created_at: 1.hour.ago)

      expect(AuditLog.recent_first.to_a).to eq([ newer, older ])
    end
  end
end
