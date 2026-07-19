class OrderSerializer
  def initialize(order)
    @order = order
  end

  def as_json(*)
    {
      id: order.id,
      status: order.status,
      total_price: order.total_price.to_f,
      estimated_delivery_at: order.estimated_delivery_at&.iso8601,
      delivered_at: order.delivered_at&.iso8601,
      customer: { id: order.customer.id, name: order.customer.name },
      driver: order.driver && { id: order.driver.id, name: order.driver.user.name },
      pickup_address: AddressSerializer.new(order.pickup_address).as_json,
      delivery_address: AddressSerializer.new(order.delivery_address).as_json,
      order_items: order.order_items.map { |item| OrderItemSerializer.new(item).as_json },
      created_at: order.created_at.iso8601
    }
  end

  private

  attr_reader :order
end
