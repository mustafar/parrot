import { findKey, get as getOrDefault } from 'lodash';

const fs = require('fs');
const express = require('express');
const swaggerMiddleware = require('swagger-express-middleware');
const interceptor = require('express-interceptor');

const app = express();
const port = process.env.PORT;
const swaggerPath = process.env.SWAGGER_SPEC;

if (port === undefined || swaggerPath === undefined) {
  throw new Error('PORT and SWAGGER_SPEC environment variables must be set.');
}
fs.stat(swaggerPath, (err) => {
  if (err) {
    throw new Error('swagger spec not found');
  }
});

const swaggerInterceptor = interceptor((req, res) => ({
  isInterceptable: () => true,
  intercept: () => {
    if (req.swagger.path === null || req.swagger.path === undefined) {
      res.sendStatus(501).end(); // Not Implemented
      return;
    }
    const { responses } = req.swagger.path[req.method.toLowerCase()];
    const exampleResponseHttpCode = findKey(responses, r => getOrDefault(r, 'schema.example') !== undefined);

    if (exampleResponseHttpCode !== undefined) {
      res.send(responses[exampleResponseHttpCode].schema.example).end();
    } else {
      res.sendStatus(501).end(); // Not Implemented
    }
  },
}));

swaggerMiddleware(swaggerPath, app, (err, middleware) => {
  if (err) {
    throw err;
  }

  app.use(
    swaggerInterceptor,
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    middleware.mock(),
  );

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`The mock api is now running at http://localhost:${port}`);
  });
});
