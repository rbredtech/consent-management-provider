FROM node:18-alpine

RUN apk add dumb-init

WORKDIR /usr/src/app

COPY --chown=node:node ./dist/ ./dist
COPY --chown=node:node ./package.json .
COPY --chown=node:node ./package-lock .json

ENV NODE_ENV=production
RUN npm install
USER node

ENTRYPOINT [ "dumb-init", "node", "dist/app.js" ]
