class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :driver, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :pickup_address, null: false, foreign_key: { to_table: :addresses }
      t.references :delivery_address, null: false, foreign_key: { to_table: :addresses }
      t.string :status, null: false, default: "pending"
      t.decimal :total_price, precision: 10, scale: 2, null: false, default: 0
      t.datetime :estimated_delivery_at
      t.datetime :delivered_at

      t.timestamps
    end

    add_index :orders, :status
  end
end
