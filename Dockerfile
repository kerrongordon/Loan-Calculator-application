FROM node:24-alpine

ARG UID=1000
ARG GID=1000

RUN apk upgrade --no-cache && \
    npm install -g pnpm && \
    apk add --no-cache gosu shadow && \
    groupmod -g ${GID} node && \
    usermod -u ${UID} node

WORKDIR /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "run", "dev"]
