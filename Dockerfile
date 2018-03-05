FROM mhart/alpine-node:8

ADD ./ ./

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
