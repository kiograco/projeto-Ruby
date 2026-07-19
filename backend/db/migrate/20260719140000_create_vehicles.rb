class CreateVehicles < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicles do |t|
      t.string :plate, null: false
      t.string :model, null: false
      t.integer :year, null: false
      t.string :vehicle_type, null: false
      t.decimal :capacity, precision: 10, scale: 2, null: false

      t.timestamps
    end

    add_index :vehicles, :plate, unique: true
  end
end
