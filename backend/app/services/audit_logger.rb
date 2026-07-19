class AuditLogger
  def self.log(action:, resource:, before: nil, after: nil)
    AuditLog.create!(
      user: Current.user,
      action: action,
      resource_type: resource.class.name,
      resource_id: resource.id,
      before_state: before,
      after_state: after,
      ip_address: Current.ip_address
    )
  end
end
