class SendEmailJob < ApplicationJob
  queue_as :default

  def perform(notification_id)
    notification = Notification.find_by(id: notification_id)
    return unless notification

    NotificationMailer.event_email(notification).deliver_now
  end
end
