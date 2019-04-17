import httpStatus from 'http-status-codes';
import { findKey, get as getOrDefault, isEmpty } from 'lodash';
import JSum from 'jsum';
import querystring from 'querystring';

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const swaggerMiddleware = require('swagger-express-middleware');
const interceptor = require('express-interceptor');

const app = express();
const port = process.env.PORT;
const swaggerPath = process.env.SWAGGER_SPEC;
const isVerboseMode = process.env.VERBOSE !== undefined;

// eslint-disable-next-line
const getQueryHash = (query) => isEmpty(query) ? '' : JSum.digest(query, 'SHA256', 'hex');

const setRequestStatus = (res, code) => {
  // this is a hack to overwrite the message set by the swagger middleware
  // (which is not overwritten by res.status(204).send('Not Implemented'), etc )
  res.statusMessage = httpStatus.getStatusText(code);
  res.status(code);
  return res;
};

let mocks = {};
const resetMocks = () => { mocks = {}; };
const mockKey = (method, path) => `${method.toUpperCase()} ${path}`;
const saveMock = (mockBehavior) => {
  const {
    method, path, status, response, qs,
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
  const queryHash = getQueryHash(querystring.parse(qs));
  mocks[mockKey(method, `${path}${queryHash}`)] = mockResponse;
};
const getMockResponse = (method, path, query) => {
  const queryHash = getQueryHash(query);
  const key = mockKey(method, `${path}${queryHash}`);
  const mockResponse = mocks[key];
  if (isVerboseMode) {
    /* eslint-disable no-console */
    console.log('---------------------');
    console.log(`mocked keys: [ ${Object.keys(mocks)} ]`);
    console.log(`requested key: ${key}`);
    /* eslint-enable no-console */
  }
  return mockResponse;
};

const handle = (req, res) => {
  // get swagger basePath
  const basePath = getOrDefault(req, 'swagger.api.basePath', '')
    .replace(/\/$/, '');

  if (getOrDefault(req, 'statusOverride')) {
    setRequestStatus(res, req.statusOverride).send().end();
  }

  if (!getOrDefault(req, 'swagger.api')) {
    setRequestStatus(res, httpStatus.NOT_FOUND).send().end();
  }

  // get current request path
  const path = req.path.substring(basePath.length);

  // check for a mocking call
  if (path === '/mock') {
    if (req.method === 'DELETE') {
      resetMocks();
    } else if (req.method === 'PUT') {
      saveMock(req.body);
    } else {
      res.status(501).send('Not Implemented').end();
      return;
    }
    setRequestStatus(res, httpStatus.NO_CONTENT).send().end();
    return;
  }

  // check for an invalid path
  if (req.swagger.path === null || req.swagger.path === undefined) {
    setRequestStatus(res, httpStatus.NOT_FOUND).send().end();
    return;
  }

  // checked for mocked bhavior
  const mockedResponse = getMockResponse(req.method, path, req.query);
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

  setRequestStatus(res, httpStatus.NOT_IMPLEMENTED).send().end();
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
      setRequestStatus(res, httpStatus.INTERNAL_SERVER_ERROR).send().end(); // Oops
    }
  },
}));

const errorMiddleware = (err, req, res, next) => {
  if (err && err.message && !/mock$/.test(err.message)) {
    console.log(err); // eslint-disable-line no-console
    req.statusOverride = err.status;
    next();
  } else {
    next();
  }
};

swaggerMiddleware(swaggerPath, app, (err, middleware) => {
  app.use(
    swaggerInterceptor,
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    errorMiddleware,
    middleware.mock(),
  );

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`The mock api is now running at http://localhost:${port}`);
  });

  /* eslint-disable */
  ['SIGINT', 'SIGTERM'].forEach(function (signal) {
    process.on(signal, function () {
      console.log('Shutting down...');
      server.close(process.exit);
    });
  });
  /* eslint-enable */
});
