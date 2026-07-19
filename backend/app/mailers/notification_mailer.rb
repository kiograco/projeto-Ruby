class NotificationMailer < ApplicationMailer
  def event_email(notification)
    @notification = notification
    mail(to: notification.user.email, subject: notification.title)
  end
end
