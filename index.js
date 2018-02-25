const express = require('express');
const swaggerMiddleware = require('swagger-express-middleware');
const interceptor = require('express-interceptor');

const app = express();
const port = process.env.PORT;
const swaggerPath = process.env.SWAGGER_SPEC;

if (port === undefined || swaggerPath === undefined) {
  throw new Error('PORT and SWAGGER_SPEC environment variables must be set.');
}

const swaggerJsonDeserializerInterceptor = interceptor((req, res) => ({
  isInterceptable: () => /application\/json/.test(res.get('Content-Type')),
  intercept: () => {
    const response = req.swagger.path[req.method.toLowerCase()].responses['200'].schema.example;
    if (response) {
      res.send(response);
    } else {
      res.sendStatus(501); // Not Implemented
    }
  },
}));

swaggerMiddleware(swaggerPath, app, (err, middleware) => {
  app.use(
    swaggerJsonDeserializerInterceptor,
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
