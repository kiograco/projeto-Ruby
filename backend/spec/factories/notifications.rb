FactoryBot.define do
  factory :notification do
    user
    event { Notification::ORDER_CREATED }
    title { "Order confirmed" }
    body { "Your order has been created." }
  end
end
