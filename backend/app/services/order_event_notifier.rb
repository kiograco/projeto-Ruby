class OrderEventNotifier
  TITLES = {
    Notification::ORDER_CREATED => "Order confirmed",
    Notification::DRIVER_ASSIGNED => "Driver assigned",
    Notification::PICKUP_COMPLETE => "Package picked up",
    Notification::NEAR_DESTINATION => "Almost there",
    Notification::DELIVERED => "Delivered",
    Notification::FAILED => "Delivery failed",
    Notification::DELIVERY_DELAYED => "Delivery running late"
  }.freeze

  BODIES = {
    Notification::ORDER_CREATED => ->(order) { "Your order ##{order.id} has been created and is pending assignment." },
    Notification::DRIVER_ASSIGNED => ->(order) { "A driver has been assigned to order ##{order.id}." },
    Notification::PICKUP_COMPLETE => ->(order) { "Order ##{order.id} has been picked up and is on its way." },
    Notification::NEAR_DESTINATION => ->(order) { "Order ##{order.id} is almost at its destination." },
    Notification::DELIVERED => ->(order) { "Order ##{order.id} has been delivered." },
    Notification::FAILED => ->(order) { "Order ##{order.id} delivery failed." },
    Notification::DELIVERY_DELAYED => ->(order) { "Order ##{order.id} is running past its estimated delivery time." }
  }.freeze

  def self.notify(order, event, recipients:)
    new(order, event, recipients).notify
  end

  def initialize(order, event, recipients)
    @order = order
    @event = event
    @recipients = recipients
  end

  def notify
    @recipients.compact.uniq.map do |user|
      notification = Notification.create!(
        user: user,
        order: @order,
        event: @event,
        title: TITLES.fetch(@event),
        body: BODIES.fetch(@event).call(@order)
      )
      SendEmailJob.perform_later(notification.id)
      notification
    end
  end
end
