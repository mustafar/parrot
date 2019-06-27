FROM mhart/alpine-node:8

ADD ./ ./

ENV NODE_ENV=production DEBUG=*

CMD [ "node", "index.js" ]
