require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:user)).to be_valid
    end

    it "requires a unique email" do
      existing = create(:user)
      duplicate = build(:user, email: existing.email.upcase)

      expect(duplicate).not_to be_valid
    end

    it "downcases the email before validation" do
      user = create(:user, email: "Mixed.Case@Example.com")

      expect(user.email).to eq("mixed.case@example.com")
    end
  end

  describe "#locked?" do
    it "is false by default" do
      expect(build(:user)).not_to be_locked
    end

    it "is true right after being locked" do
      user = create(:user)
      user.lock_access!

      expect(user).to be_locked
    end

    it "expires after the lockout duration" do
      user = create(:user, locked_at: (User::LOCKOUT_DURATION + 1.minute).ago)

      expect(user).not_to be_locked
    end
  end

  describe "#register_failed_attempt!" do
    it "increments the failed attempt counter" do
      user = create(:user, failed_login_attempts: 0)

      expect { user.register_failed_attempt! }.to change(user, :failed_login_attempts).from(0).to(1)
    end

    it "locks the account after the max attempts" do
      user = create(:user, failed_login_attempts: User::MAX_FAILED_ATTEMPTS - 1)

      user.register_failed_attempt!

      expect(user).to be_locked
    end
  end

  describe "#reset_failed_attempts!" do
    it "clears the counter and lock" do
      user = create(:user, failed_login_attempts: 3, locked_at: Time.current)

      user.reset_failed_attempts!

      expect(user.failed_login_attempts).to eq(0)
      expect(user.locked_at).to be_nil
    end
  end
end
