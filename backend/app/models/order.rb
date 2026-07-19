class Order < ApplicationRecord
  PENDING = "pending"
  ASSIGNED = "assigned"
  PICKED_UP = "picked_up"
  IN_TRANSIT = "in_transit"
  NEAR_DESTINATION = "near_destination"
  DELIVERED = "delivered"
  CANCELLED = "cancelled"
  FAILED = "failed"

  ALLOWED_TRANSITIONS = {
    PENDING => [ ASSIGNED, CANCELLED ],
    ASSIGNED => [ PICKED_UP, CANCELLED ],
    PICKED_UP => [ IN_TRANSIT, FAILED ],
    IN_TRANSIT => [ NEAR_DESTINATION, FAILED ],
    NEAR_DESTINATION => [ DELIVERED, FAILED ],
    DELIVERED => [],
    CANCELLED => [],
    FAILED => []
  }.freeze

  STATUS_EVENTS = {
    PICKED_UP => Notification::PICKUP_COMPLETE,
    NEAR_DESTINATION => Notification::NEAR_DESTINATION,
    DELIVERED => Notification::DELIVERED,
    FAILED => Notification::FAILED
  }.freeze

  belongs_to :customer
  belongs_to :driver, optional: true
  belongs_to :created_by, class_name: "User", inverse_of: :created_orders
  belongs_to :pickup_address, class_name: "Address"
  belongs_to :delivery_address, class_name: "Address"
  has_many :order_items, dependent: :destroy
  has_many :tracking_points, dependent: :destroy
  has_many :notifications, dependent: :destroy

  accepts_nested_attributes_for :pickup_address, :delivery_address
  accepts_nested_attributes_for :order_items, allow_destroy: true

  validates :status, inclusion: { in: ALLOWED_TRANSITIONS.keys }
  validates :total_price, numericality: { greater_than_or_equal_to: 0 }

  scope :with_status, ->(status) { where(status: status) if status.present? }
  scope :overdue, lambda {
    where.not(status: [ DELIVERED, CANCELLED, FAILED ])
      .where.not(estimated_delivery_at: nil)
      .where("estimated_delivery_at < ?", Time.current)
  }

  before_validation :compute_total_price_from_items, on: :create

  after_create :notify_order_created
  after_create :audit_creation
  after_update :notify_driver_assigned, if: -> { saved_change_to_driver_id? && driver_id.present? }
  after_update :audit_driver_assignment, if: -> { saved_change_to_driver_id? && driver_id.present? }
  after_update :audit_status_change, if: :saved_change_to_status?

  def transition_to!(new_status)
    new_status = new_status.to_s

    unless ALLOWED_TRANSITIONS.fetch(status, []).include?(new_status)
      errors.add(:status, "cannot transition from #{status} to #{new_status}")
      return false
    end

    attrs = { status: new_status }
    attrs[:delivered_at] = Time.current if new_status == DELIVERED

    return false unless update(attrs)

    notify_status_change(new_status)
    true
  end

  private

  def compute_total_price_from_items
    return if total_price.present? && total_price.positive?
    return if order_items.empty?

    self.total_price = order_items.sum { |item| (item.quantity || 0) * (item.unit_price || 0) }
  end

  def notify_order_created
    OrderEventNotifier.notify(self, Notification::ORDER_CREATED, recipients: [ created_by ])
  end

  def notify_driver_assigned
    OrderEventNotifier.notify(self, Notification::DRIVER_ASSIGNED, recipients: [ created_by, driver&.user ])
  end

  def notify_status_change(new_status)
    event = STATUS_EVENTS[new_status]
    return unless event

    OrderEventNotifier.notify(self, event, recipients: [ created_by ])
  end

  def audit_creation
    AuditLogger.log(action: "order_created", resource: self, after: audit_snapshot)
  end

  def audit_driver_assignment
    was, now = saved_change_to_driver_id
    AuditLogger.log(action: "driver_assigned", resource: self, before: { driver_id: was }, after: { driver_id: now })
  end

  def audit_status_change
    was, now = saved_change_to_status
    AuditLogger.log(action: "status_change", resource: self, before: { status: was }, after: { status: now })
  end

  def audit_snapshot
    { status: status, customer_id: customer_id, driver_id: driver_id, total_price: total_price.to_s }
  end
end
