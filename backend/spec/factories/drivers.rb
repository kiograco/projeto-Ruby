FactoryBot.define do
  factory :driver do
    association :user, factory: [ :user, :driver ]
    sequence(:license_number) { |n| "LIC-#{100_000 + n}" }
    status { "offline" }
  end
end
