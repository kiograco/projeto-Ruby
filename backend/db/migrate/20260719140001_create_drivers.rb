class CreateDrivers < ActiveRecord::Migration[8.1]
  def change
    create_table :drivers do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.references :vehicle, foreign_key: true
      t.string :license_number, null: false
      t.string :status, null: false, default: "offline"
      t.decimal :current_latitude, precision: 10, scale: 6
      t.decimal :current_longitude, precision: 10, scale: 6

      t.timestamps
    end

    add_index :drivers, :license_number, unique: true
  end
end
