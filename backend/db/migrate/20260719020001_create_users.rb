class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.references :role, null: false, foreign_key: true
      t.boolean :active, null: false, default: true
      t.integer :failed_login_attempts, null: false, default: 0
      t.datetime :locked_at

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
