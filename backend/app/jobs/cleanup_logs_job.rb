# Prunes old, already-read notifications. Intended to run on a schedule (e.g. via
# sidekiq-cron) in production; not currently scheduled.
class CleanupLogsJob < ApplicationJob
  queue_as :default

  RETENTION = 90.days

  def perform
    Notification.where.not(read_at: nil).where("created_at < ?", RETENTION.ago).delete_all
  end
end
