require "rails_helper"

RSpec.describe Vehicle, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:vehicle)).to be_valid
    end

    it "requires a unique plate" do
      existing = create(:vehicle)
      duplicate = build(:vehicle, plate: existing.plate.downcase)

      expect(duplicate).not_to be_valid
    end

    it "upcases the plate before validation" do
      vehicle = create(:vehicle, plate: "xyz-1234")

      expect(vehicle.plate).to eq("XYZ-1234")
    end

    it "requires a known vehicle type" do
      expect(build(:vehicle, vehicle_type: "spaceship")).not_to be_valid
    end

    it "requires a positive capacity" do
      expect(build(:vehicle, capacity: 0)).not_to be_valid
    end

    it "requires a plausible year" do
      expect(build(:vehicle, year: 1900)).not_to be_valid
    end
  end

  describe ".search" do
    it "matches by plate or model" do
      match = create(:vehicle, plate: "AAA-1111", model: "Sprinter")
      create(:vehicle, plate: "BBB-2222", model: "Fiorino")

      expect(Vehicle.search("Sprinter")).to contain_exactly(match)
      expect(Vehicle.search("AAA")).to contain_exactly(match)
    end
  end
end
