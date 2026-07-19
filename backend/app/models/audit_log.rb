class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  validates :action, presence: true
  validates :resource_type, presence: true
  validates :resource_id, presence: true

  scope :for_resource, ->(resource) { where(resource_type: resource.class.name, resource_id: resource.id) }
  scope :recent_first, -> { order(created_at: :desc) }
end
