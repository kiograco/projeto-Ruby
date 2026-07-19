class AuditLogSerializer
  def initialize(audit_log)
    @audit_log = audit_log
  end

  def as_json
    {
      id: @audit_log.id,
      action: @audit_log.action,
      user_name: @audit_log.user&.name,
      before_state: @audit_log.before_state,
      after_state: @audit_log.after_state,
      created_at: @audit_log.created_at
    }
  end
end
