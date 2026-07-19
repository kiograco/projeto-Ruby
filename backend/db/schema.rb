# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_19_180000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "postgis"

  create_table "addresses", force: :cascade do |t|
    t.string "city", null: false
    t.string "complement"
    t.datetime "created_at", null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.string "neighborhood", null: false
    t.string "number", null: false
    t.string "state", null: false
    t.string "street", null: false
    t.datetime "updated_at", null: false
    t.string "zip_code", null: false
  end

  create_table "customers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "document", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "phone", null: false
    t.datetime "updated_at", null: false
    t.index ["document"], name: "index_customers_on_document", unique: true
    t.index ["email"], name: "index_customers_on_email", unique: true
  end

  create_table "drivers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "current_latitude", precision: 10, scale: 6
    t.decimal "current_longitude", precision: 10, scale: 6
    t.string "license_number", null: false
    t.string "status", default: "offline", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "vehicle_id"
    t.index ["license_number"], name: "index_drivers_on_license_number", unique: true
    t.index ["user_id"], name: "index_drivers_on_user_id", unique: true
    t.index ["vehicle_id"], name: "index_drivers_on_vehicle_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.bigint "order_id", null: false
    t.integer "quantity", default: 1, null: false
    t.decimal "unit_price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "customer_id", null: false
    t.datetime "delivered_at"
    t.bigint "delivery_address_id", null: false
    t.bigint "driver_id"
    t.datetime "estimated_delivery_at"
    t.bigint "pickup_address_id", null: false
    t.string "status", default: "pending", null: false
    t.decimal "total_price", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_orders_on_created_by_id"
    t.index ["customer_id"], name: "index_orders_on_customer_id"
    t.index ["delivery_address_id"], name: "index_orders_on_delivery_address_id"
    t.index ["driver_id"], name: "index_orders_on_driver_id"
    t.index ["pickup_address_id"], name: "index_orders_on_pickup_address_id"
    t.index ["status"], name: "index_orders_on_status"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "tracking_points", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "driver_id", null: false
    t.decimal "heading", precision: 6, scale: 2
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.bigint "order_id", null: false
    t.datetime "recorded_at", null: false
    t.decimal "speed", precision: 6, scale: 2
    t.datetime "updated_at", null: false
    t.index ["driver_id"], name: "index_tracking_points_on_driver_id"
    t.index ["order_id", "recorded_at"], name: "index_tracking_points_on_order_id_and_recorded_at"
    t.index ["order_id"], name: "index_tracking_points_on_order_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.integer "failed_login_attempts", default: 0, null: false
    t.datetime "locked_at"
    t.string "name", null: false
    t.string "password_digest", null: false
    t.bigint "role_id", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["role_id"], name: "index_users_on_role_id"
  end

  create_table "vehicles", force: :cascade do |t|
    t.decimal "capacity", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.string "model", null: false
    t.string "plate", null: false
    t.datetime "updated_at", null: false
    t.string "vehicle_type", null: false
    t.integer "year", null: false
    t.index ["plate"], name: "index_vehicles_on_plate", unique: true
  end

  add_foreign_key "drivers", "users"
  add_foreign_key "drivers", "vehicles"
  add_foreign_key "order_items", "orders"
  add_foreign_key "orders", "addresses", column: "delivery_address_id"
  add_foreign_key "orders", "addresses", column: "pickup_address_id"
  add_foreign_key "orders", "customers"
  add_foreign_key "orders", "drivers"
  add_foreign_key "orders", "users", column: "created_by_id"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "tracking_points", "drivers"
  add_foreign_key "tracking_points", "orders"
  add_foreign_key "users", "roles"
end
