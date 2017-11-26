FROM ruby:2.4.2-alpine3.6

RUN apk --update add \
  gcc musl-dev make \
  postgresql-dev \
  && rm -rf /var/cache/apk/*

WORKDIR /app
# RUN bundle
