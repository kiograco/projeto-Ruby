FactoryBot.define do
  factory :audit_log do
    user
    action { "order_created" }
    resource_type { "Order" }
    resource_id { 1 }
    before_state { nil }
    after_state { { status: "pending" } }
    ip_address { "127.0.0.1" }
  end
end
