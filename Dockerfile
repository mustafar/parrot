FROM mhart/alpine-node:slim-16

ADD ./ ./

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
