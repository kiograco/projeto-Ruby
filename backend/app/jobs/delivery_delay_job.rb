# Flags orders running past their estimated_delivery_at so dispatchers/admins can
# act on them (spec Section 7, Dispatcher: "Monitor delays"). Intended to run on a
# schedule (e.g. via sidekiq-cron) in production; not currently scheduled.
class DeliveryDelayJob < ApplicationJob
  queue_as :default

  RENOTIFY_AFTER = 6.hours

  def perform
    recipients = User.active.joins(:role).where(roles: { name: [ Role::ADMIN, Role::DISPATCHER ] }).to_a
    return if recipients.empty?

    Order.overdue.find_each do |order|
      next if recently_notified?(order)

      OrderEventNotifier.notify(order, Notification::DELIVERY_DELAYED, recipients: recipients)
    end
  end

  private

  def recently_notified?(order)
    order.notifications
      .where(event: Notification::DELIVERY_DELAYED)
      .where("created_at > ?", RENOTIFY_AFTER.ago)
      .exists?
  end
end
