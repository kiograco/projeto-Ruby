require "rails_helper"

RSpec.describe RefreshToken, type: :model do
  describe ".issue_for" do
    it "returns a raw token and persists only its digest" do
      user = create(:user)

      raw_token, record = RefreshToken.issue_for(user, ip_address: "127.0.0.1", user_agent: "RSpec")

      expect(raw_token).to be_present
      expect(record.token_digest).to eq(RefreshToken.digest(raw_token))
      expect(record.token_digest).not_to eq(raw_token)
      expect(record.expires_at).to be_within(1.second).of(RefreshToken::TTL.from_now)
    end
  end

  describe ".find_by_raw_token" do
    it "finds the record matching the raw token" do
      user = create(:user)
      raw_token, record = RefreshToken.issue_for(user)

      expect(RefreshToken.find_by_raw_token(raw_token)).to eq(record)
    end

    it "returns nil for an unknown token" do
      expect(RefreshToken.find_by_raw_token("bogus")).to be_nil
    end

    it "returns nil for a blank token" do
      expect(RefreshToken.find_by_raw_token(nil)).to be_nil
    end
  end

  describe "#active?" do
    it "is true for a fresh token" do
      _raw, record = RefreshToken.issue_for(create(:user))

      expect(record).to be_active
    end

    it "is false once revoked" do
      _raw, record = RefreshToken.issue_for(create(:user))
      record.revoke!

      expect(record).not_to be_active
    end

    it "is false once expired" do
      _raw, record = RefreshToken.issue_for(create(:user))
      record.update!(expires_at: 1.minute.ago)

      expect(record).not_to be_active
    end
  end
end
