require "rails_helper"

RSpec.describe Driver, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:driver)).to be_valid
    end

    it "requires a unique license number" do
      existing = create(:driver)
      duplicate = build(:driver, license_number: existing.license_number)

      expect(duplicate).not_to be_valid
    end

    it "requires the associated user to have the driver role" do
      admin_user = create(:user, :admin)
      driver = build(:driver, user: admin_user)

      expect(driver).not_to be_valid
      expect(driver.errors[:user]).to be_present
    end

    it "defaults to offline status" do
      expect(create(:driver).status).to eq("offline")
    end
  end

  describe "#update_location!" do
    it "updates the current coordinates" do
      driver = create(:driver)

      driver.update_location!(latitude: -23.55, longitude: -46.63)

      expect(driver.reload.current_latitude.to_f).to eq(-23.55)
      expect(driver.current_longitude.to_f).to eq(-46.63)
    end
  end

  describe ".online" do
    it "excludes offline drivers" do
      online_driver = create(:driver, status: "available")
      create(:driver, status: "offline")

      expect(Driver.online).to contain_exactly(online_driver)
    end
  end
end
