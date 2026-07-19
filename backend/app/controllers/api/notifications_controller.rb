module Api
  class NotificationsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_notification, only: [ :update ]

    def index
      scope = current_user.notifications.recent_first
      scope = scope.unread if params[:unread] == "true"
      pagy_object, notifications = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        notifications: notifications.map { |n| NotificationSerializer.new(n).as_json },
        unread_count: current_user.notifications.unread.count,
        meta: pagy_meta(pagy_object)
      }
    end

    def update
      @notification.mark_as_read!
      render json: NotificationSerializer.new(@notification).as_json
    end

    def mark_all_read
      current_user.notifications.unread.update_all(read_at: Time.current)
      head :no_content
    end

    private

    def set_notification
      @notification = current_user.notifications.find(params[:id])
    end
  end
end
