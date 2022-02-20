# docker run -it node:16.14-alpine /bin/bash
# ---- Base Node ----
FROM node:16.14-alpine@sha256:2c6c59cf4d34d4f937ddfcf33bab9d8bbad8658d1b9de7b97622566a52167f2b AS base
# Preparing
RUN mkdir -p /var/app && chown -R node /var/app
# Set working directory
WORKDIR /var/app
# Copy project file
COPY . .

ENV NODE_ENV=production
RUN apk add --update bash curl git && rm -rf /var/cache/apk/*
RUN npm ci --only=prod --silent
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD curl --fail http://0.0.0.0:3000/healthcheck || exit 1
CMD node server.js