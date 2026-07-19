FactoryBot.define do
  factory :customer do
    sequence(:name) { |n| "Customer #{n}" }
    sequence(:email) { |n| "customer#{n}@example.com" }
    sequence(:document) { |n| "documento-#{n}" }
    phone { "+55 11 91234-5678" }
  end
end
