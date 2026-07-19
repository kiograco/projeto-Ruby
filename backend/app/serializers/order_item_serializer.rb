class OrderItemSerializer
  def initialize(order_item)
    @order_item = order_item
  end

  def as_json(*)
    {
      id: order_item.id,
      description: order_item.description,
      quantity: order_item.quantity,
      unit_price: order_item.unit_price.to_f
    }
  end

  private

  attr_reader :order_item
end
