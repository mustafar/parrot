FROM node:8.0

ADD ./ ./

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
