class CreateTrackingPoints < ActiveRecord::Migration[8.1]
  def change
    create_table :tracking_points do |t|
      t.references :order, null: false, foreign_key: true
      t.references :driver, null: false, foreign_key: true
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.decimal :speed, precision: 6, scale: 2
      t.decimal :heading, precision: 6, scale: 2
      t.datetime :recorded_at, null: false

      t.timestamps
    end

    add_index :tracking_points, [ :order_id, :recorded_at ]
  end
end
