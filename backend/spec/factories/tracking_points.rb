FactoryBot.define do
  factory :tracking_point do
    order
    driver
    latitude { -23.55 }
    longitude { -46.63 }
    speed { 40.0 }
    heading { 90.0 }
    recorded_at { Time.current }
  end
end
