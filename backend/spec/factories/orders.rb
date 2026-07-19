FactoryBot.define do
  factory :order do
    customer
    created_by factory: :user
    pickup_address factory: :address
    delivery_address factory: :address
    total_price { 50.0 }

    trait :with_items do
      total_price { nil }

      after(:build) do |order|
        order.order_items.build(description: "Package", quantity: 2, unit_price: 25.0)
      end
    end
  end
end
