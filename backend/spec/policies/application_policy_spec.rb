require "rails_helper"

RSpec.describe ApplicationPolicy do
  describe "default actions" do
    it "denies every action by default" do
      policy = described_class.new(nil, nil)

      expect(policy.index?).to be false
      expect(policy.show?).to be false
      expect(policy.create?).to be false
      expect(policy.update?).to be false
      expect(policy.destroy?).to be false
    end
  end

  describe "Scope" do
    it "raises when #resolve isn't overridden by a subclass" do
      scope = described_class::Scope.new(nil, nil)

      expect { scope.resolve }.to raise_error(NoMethodError, /must define #resolve/)
    end
  end
end
