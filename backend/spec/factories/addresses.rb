FactoryBot.define do
  factory :address do
    street { "Rua das Flores" }
    number { "123" }
    neighborhood { "Centro" }
    city { "São Paulo" }
    state { "SP" }
    zip_code { "01234-567" }
  end
end
