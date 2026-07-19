class CustomerSerializer
  def initialize(customer)
    @customer = customer
  end

  def as_json(*)
    {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      document: customer.document,
      created_at: customer.created_at.iso8601
    }
  end

  private

  attr_reader :customer
end
