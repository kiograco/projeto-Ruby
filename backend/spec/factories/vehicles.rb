FactoryBot.define do
  factory :vehicle do
    sequence(:plate) { |n| "ABC-#{1000 + n}" }
    model { "Fiat Fiorino" }
    year { 2022 }
    vehicle_type { Vehicle::VAN }
    capacity { 500.0 }
  end
end
