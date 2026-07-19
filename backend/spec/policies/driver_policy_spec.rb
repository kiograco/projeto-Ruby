require "rails_helper"

RSpec.describe DriverPolicy do
  describe "Scope" do
    it "returns none for an unauthenticated scope" do
      create(:driver)

      resolved = described_class::Scope.new(nil, Driver).resolve

      expect(resolved).to be_empty
    end
  end
end
