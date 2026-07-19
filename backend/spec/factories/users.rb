FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "Test User" }
    password { "password123" }
    password_confirmation { password }
    active { true }
    role { create(:role, :admin) }

    trait :dispatcher do
      role { create(:role, :dispatcher) }
    end

    trait :driver do
      role { create(:role, :driver) }
    end

    trait :customer do
      role { create(:role, :customer) }
    end
  end
end
