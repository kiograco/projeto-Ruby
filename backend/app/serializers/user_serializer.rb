class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json(*)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      active: user.active
    }
  end

  private

  attr_reader :user
end
