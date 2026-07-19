class ApplicationMailer < ActionMailer::Base
  default from: "notifications@deliverytracker.dev"
  layout "mailer"
end
