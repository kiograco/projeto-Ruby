class NotificationSerializer
  def initialize(notification)
    @notification = notification
  end

  def as_json(*)
    {
      id: notification.id,
      order_id: notification.order_id,
      event: notification.event,
      title: notification.title,
      body: notification.body,
      read: notification.read?,
      created_at: notification.created_at.iso8601
    }
  end

  private

  attr_reader :notification
end
