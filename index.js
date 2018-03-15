import { findKey, get as getOrDefault } from 'lodash';

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const swaggerMiddleware = require('swagger-express-middleware');
const interceptor = require('express-interceptor');

const app = express();
const port = process.env.PORT;
const swaggerPath = process.env.SWAGGER_SPEC;

const setRequestStatus = (res, code, message) => {
  // this is a hack to overwrite the message set by the swagger middleware
  // (which is not overwritten by res.status(204).send('Not Implemented'), etc )
  res.statusMessage = message;
  res.status(code);
  return res;
};

let mocks = {};
const resetMocks = () => { mocks = {}; };
const mockKey = (method, path) => `${method.toUpperCase()} ${path}`;
const saveMock = (mockBehavior) => {
  const {
    method, path, status, response,
  } = mockBehavior;
  if (method === undefined ||
    path === undefined ||
    !/^\//.test(path) ||
    status === undefined) {
    throw new Error('invalid mock behavior supplied');
  }
  const mockResponse = { status };
  if (response !== undefined) {
    mockResponse.response = response;
  }
  mocks[mockKey(method, path)] = mockResponse;
};
const getMockResponse = (method, path) => mocks[mockKey(method, path)];

const handle = (req, res) => {
  // check base path
  if (getOrDefault(req, 'swagger.api.basePath') === undefined) {
    setRequestStatus(res, 404, 'Not Found').send().end();
    return;
  }

  // check for a mocking call
  if (req.path === `${req.swagger.api.basePath}/mock`) {
    if (req.method === 'DELETE') {
      resetMocks();
    } else if (req.method === 'PUT') {
      saveMock(req.body);
    } else {
      res.status(501).send('Not Implemented').end();
      return;
    }
    setRequestStatus(res, 204, 'No Content').send().end();
    return;
  }

  // check for an invalid path
  if (req.swagger.path === null || req.swagger.path === undefined) {
    setRequestStatus(res, 501, 'Not Implemented').send().end();
    return;
  }

  // checked for mocked bhavior
  const mockedResponse = getMockResponse(req.method, req.swagger.pathName);
  if (mockedResponse) {
    res.status(mockedResponse.status);
    if (mockedResponse.response !== undefined) {
      res.send(mockedResponse.response);
    }
    res.end();
    return;
  }

  // check for default behavior
  const { responses } = req.swagger.path[req.method.toLowerCase()];
  const exampleResponseHttpCode = findKey(responses, r => getOrDefault(r, 'schema.example') !== undefined);
  if (exampleResponseHttpCode !== undefined) {
    res.send(responses[exampleResponseHttpCode].schema.example).end();
    return;
  }

  setRequestStatus(res, 501, 'Not Implemented').send().end();
};

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
    try {
      handle(req, res);
    } catch (err) {
      console.log(err); // eslint-disable-line no-console
      setRequestStatus(res, 500, 'Internal Server Error').send().end(); // Oops
    }
  },
}));

swaggerMiddleware(swaggerPath, app, (err, middleware) => {
  if (err) {
    throw err;
  }

  app.use(
    swaggerInterceptor,
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
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
