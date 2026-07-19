class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :resource_type, null: false
      t.bigint :resource_id, null: false
      t.jsonb :before_state
      t.jsonb :after_state
      t.string :ip_address
      t.datetime :created_at, null: false
    end
    add_index :audit_logs, [ :resource_type, :resource_id ]
  end
end
