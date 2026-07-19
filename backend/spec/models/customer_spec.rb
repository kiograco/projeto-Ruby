require "rails_helper"

RSpec.describe Customer, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:customer)).to be_valid
    end

    it "requires a unique email" do
      existing = create(:customer)
      duplicate = build(:customer, email: existing.email.upcase)

      expect(duplicate).not_to be_valid
    end

    it "requires a unique document" do
      existing = create(:customer)
      duplicate = build(:customer, document: existing.document)

      expect(duplicate).not_to be_valid
    end

    it "downcases the email before validation" do
      customer = create(:customer, email: "Mixed.Case@Example.com")

      expect(customer.email).to eq("mixed.case@example.com")
    end

    it "requires a name" do
      expect(build(:customer, name: nil)).not_to be_valid
    end

    it "requires a phone" do
      expect(build(:customer, phone: nil)).not_to be_valid
    end
  end

  describe ".search" do
    it "matches by name, email, or document" do
      match = create(:customer, name: "Ana Silva", email: "ana@example.com", document: "111.222.333-44")
      create(:customer, name: "Someone Else", email: "other@example.com", document: "999.888.777-66")

      expect(Customer.search("ana")).to contain_exactly(match)
      expect(Customer.search("111.222")).to contain_exactly(match)
      expect(Customer.search("example.com")).to include(match)
    end
  end
end
