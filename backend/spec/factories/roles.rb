FactoryBot.define do
  factory :role do
    name { Role::ADMIN }

    trait :admin do
      name { Role::ADMIN }
    end

    trait :dispatcher do
      name { Role::DISPATCHER }
    end

    trait :driver do
      name { Role::DRIVER }
    end

    trait :customer do
      name { Role::CUSTOMER }
    end

    initialize_with { Role.find_or_create_by!(name: name) }
  end
end
