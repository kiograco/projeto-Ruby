require "rails_helper"

RSpec.describe TrackingPoint, type: :model do
  it "is valid with valid attributes" do
    expect(build(:tracking_point)).to be_valid
  end

  it "requires latitude within range" do
    expect(build(:tracking_point, latitude: 200)).not_to be_valid
  end

  it "requires longitude within range" do
    expect(build(:tracking_point, longitude: -200)).not_to be_valid
  end

  it "defaults recorded_at to now when omitted" do
    point = build(:tracking_point, recorded_at: nil)

    point.valid?

    expect(point.recorded_at).to be_present
  end
end
