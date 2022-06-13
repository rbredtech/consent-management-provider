FROM node:18-alpine

WORKDIR /usr/src/app
COPY  . .

RUN npm ci

CMD [ "npm", "start" ]