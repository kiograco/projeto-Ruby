require "rails_helper"

RSpec.describe AuditLogger do
  after { Current.reset }

  it "creates an audit log stamped with the current user and ip address" do
    actor = create(:user, :admin)
    customer = create(:customer)
    Current.user = actor
    Current.ip_address = "10.0.0.5"

    expect {
      described_class.log(action: "customer_updated", resource: customer, before: { name: "Old" }, after: { name: "New" })
    }.to change(AuditLog, :count).by(1)

    log = AuditLog.last
    expect(log.user).to eq(actor)
    expect(log.ip_address).to eq("10.0.0.5")
    expect(log.action).to eq("customer_updated")
    expect(log.resource_type).to eq("Customer")
    expect(log.resource_id).to eq(customer.id)
    expect(log.before_state).to eq({ "name" => "Old" })
    expect(log.after_state).to eq({ "name" => "New" })
  end

  it "allows a nil current user for system-triggered events" do
    customer = create(:customer)

    log = described_class.log(action: "customer_created", resource: customer)

    expect(log.user).to be_nil
  end
end
