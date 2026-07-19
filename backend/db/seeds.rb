# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

Role::NAMES.each do |name|
  Role.find_or_create_by!(name: name)
end

if Rails.env.development?
  admin_role = Role.find_by!(name: Role::ADMIN)

  User.find_or_create_by!(email: "admin@deliverytracker.dev") do |user|
    user.name = "Admin"
    user.role = admin_role
    user.password = "password123"
    user.password_confirmation = "password123"
    user.active = true
  end
end
