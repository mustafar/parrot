FROM node:16.15.0-stretch-slim

ADD ./ ./

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
