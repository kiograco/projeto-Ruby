require "csv"

module Api
  class ReportsController < ApplicationController
    before_action :authenticate_user!
    before_action :require_admin_or_dispatcher!
    rescue_from ArgumentError, with: :render_bad_request

    def deliveries
      from, to = date_range
      orders = Order.where(created_at: from.beginning_of_day..to.end_of_day).to_a
      grouped = orders.group_by { |order| order.created_at.to_date }

      rows = (from..to).map do |date|
        day_orders = grouped[date] || []
        delivered = day_orders.select { |order| order.status == Order::DELIVERED }

        {
          date: date.iso8601,
          total: day_orders.size,
          delivered: delivered.size,
          failed: day_orders.count { |order| order.status == Order::FAILED },
          cancelled: day_orders.count { |order| order.status == Order::CANCELLED },
          revenue: delivered.sum(&:total_price).to_f
        }
      end

      respond_with_report(rows, %w[date total delivered failed cancelled revenue], "deliveries") do
        { from: from.iso8601, to: to.iso8601, rows: rows }
      end
    end

    def drivers
      rows = Driver.includes(:user, :orders).map do |driver|
        delivered = driver.orders.select { |order| order.status == Order::DELIVERED }
        durations = delivered.filter_map { |order| delivery_minutes(order) }

        {
          driver_id: driver.id,
          name: driver.user.name,
          deliveries_completed: delivered.size,
          average_delivery_time_minutes: average(durations),
          revenue: delivered.sum(&:total_price).to_f
        }
      end.sort_by { |row| -row[:deliveries_completed] }

      respond_with_report(
        rows, %w[driver_id name deliveries_completed average_delivery_time_minutes revenue], "drivers"
      ) { { rows: rows } }
    end

    def performance
      orders = Order.all.to_a
      delivered = orders.select { |order| order.status == Order::DELIVERED }
      durations = delivered.filter_map { |order| delivery_minutes(order) }
      on_time_eligible = delivered.select(&:estimated_delivery_at)
      on_time = on_time_eligible.count { |order| order.delivered_at <= order.estimated_delivery_at }

      data = {
        total_orders: orders.size,
        delivered: delivered.size,
        failed: orders.count { |order| order.status == Order::FAILED },
        cancelled: orders.count { |order| order.status == Order::CANCELLED },
        average_delivery_time_minutes: average(durations),
        on_time_rate: on_time_eligible.empty? ? nil : (on_time.to_f / on_time_eligible.size * 100).round(1)
      }

      respond_with_report([ data ], data.keys.map(&:to_s), "performance") { data }
    end

    private

    def delivery_minutes(order)
      return nil unless order.delivered_at

      (order.delivered_at - order.created_at) / 60.0
    end

    def average(values)
      return nil if values.empty?

      (values.sum / values.size).round(1)
    end

    def date_range
      to = params[:to].present? ? Date.parse(params[:to]) : Time.zone.today
      from = params[:from].present? ? Date.parse(params[:from]) : to - 29.days
      [ from, to ]
    end

    def respond_with_report(rows, headers, filename)
      case params[:export]
      when "csv"
        send_data to_csv(rows, headers), filename: "#{filename}.csv", type: "text/csv"
      when "pdf"
        send_data to_pdf(rows, headers, filename), filename: "#{filename}.pdf", type: "application/pdf"
      else
        render json: yield
      end
    end

    def to_csv(rows, headers)
      CSV.generate do |csv|
        csv << headers
        rows.each { |row| csv << headers.map { |header| row[header.to_sym] } }
      end
    end

    def to_pdf(rows, headers, title)
      Prawn::Document.new do |pdf|
        pdf.text title.to_s.capitalize, size: 18, style: :bold
        pdf.move_down 12
        table_data = [ headers ] + rows.map { |row| headers.map { |header| row[header.to_sym].to_s } }
        pdf.table(table_data, header: true, width: pdf.bounds.width)
      end.render
    end

    def require_admin_or_dispatcher!
      return if [ Role::ADMIN, Role::DISPATCHER ].include?(current_user.role.name)

      render_forbidden
    end

    def render_bad_request
      render json: { error: "Invalid parameters" }, status: :bad_request
    end
  end
end
