FROM ruby:3.3-slim

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      libvips \
      git \
      curl \
      pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN gem install bundler rails -v "~> 8.0" --no-document

WORKDIR /app

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["entrypoint.sh"]
CMD ["rails", "server", "-b", "0.0.0.0"]
