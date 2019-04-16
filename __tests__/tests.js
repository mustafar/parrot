import fetch from 'node-fetch';

const apiBase = 'http://localhost:15009/parrot-test';

beforeEach(async () => {
  await fetch(`${apiBase}/mock`, { method: 'DELETE' });
});

test('if invalid api base path, then 404', async () => {
  const response = await fetch('http://localhost:15009/foo');
  expect(response.status).toEqual(404);
});

test('if invalid path, then 404', async () => {
  const response = await fetch(`${apiBase}/foo/bar`);
  expect(response.status).toEqual(404);
});

/**
 * GET /robin/location
 * 500: does not have an example
 * 200: does not have an example
 */
test('if valid path, but not faked and without examples, then 501', async () => {
  const response = await fetch(`${apiBase}/robin/location`);
  expect(response.status).toEqual(501);
});

/**
 * GET /batman/location
 * 500: does not have an example
 * 201: example at the wrong level
 * 200: example at the right level
 */
test('if not mocked, return 1st example response', async () => {
  const response = await fetch(`${apiBase}/batman/location`);
  expect(response.status).toEqual(200);
  expect(response.text()).resolves.toEqual('batcave');
});

test('only /mock can be used to mock', async () => {
  const mock = {
    method: 'GET', path: '/batman/location', status: 201, response: { arkham: 'asylum' },
  };
  let response = await fetch(
    `${apiBase}/some/path/to/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(501);
  expect(response.statusText).toEqual('Not Implemented');

  response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);
  expect(response.statusText).toEqual('No Content');
});

test('if mocked, with body, returns the mocked status and body', async () => {
  let response = await fetch(`${apiBase}/batman/location`);
  expect(response.text()).resolves.toEqual('batcave');

  const mock = {
    method: 'GET', path: '/batman/location', status: 201, response: { arkham: 'asylum' },
  };
  response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);
  expect(response.statusText).toEqual('No Content');

  response = await fetch(`${apiBase}/batman/location`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.json()).resolves.toEqual(mock.response);
});

test('if mocked, without body, returns the mocked status', async () => {
  let response = await fetch(`${apiBase}/batman/location`);
  expect(response.text()).resolves.toEqual('batcave');

  const mock = {
    method: 'GET', path: '/batman/location', status: 201,
  };
  response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);

  response = await fetch(`${apiBase}/batman/location`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.text()).resolves.toEqual('');
});

test('if mocked, subsequent mocks will override', async () => {
  const mock = {
    method: 'GET', path: '/batman/location', status: 201, response: 'arkham',
  };
  let response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);

  mock.status = 200;
  mock.response = 'wayne manor';
  response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);

  response = await fetch(`${apiBase}/batman/location`, { method: 'GET' });
  expect(response.status).toEqual(200);
  expect(response.text()).resolves.toEqual('wayne manor');
});


test('if mocked, with query string, returns different responses by query', async () => {
  let response = await fetch(`${apiBase}/batman/location`);
  expect(response.text()).resolves.toEqual('batcave');

  const mock = {
    method: 'GET',
    path: '/robin/location',
    qs: 'greeting=hi%20you&foo=1',
    status: 201,
    response: { arkham: 'asylum' },
  };
  response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);
  expect(response.statusText).toEqual('No Content');

  // works when query is urlencoded
  response = await fetch(`${apiBase}/robin/location?greeting=hi%20you&foo=1`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.json()).resolves.toEqual(mock.response);

  // works when query is NOT urlencoded
  response = await fetch(`${apiBase}/robin/location?greeting=hi you&foo=1`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.json()).resolves.toEqual(mock.response);

  // change query params order
  response = await fetch(`${apiBase}/robin/location?foo=1&greeting=hi%20you`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.json()).resolves.toEqual(mock.response);

  // try unmocked query
  response = await fetch(`${apiBase}/robin/location?hello=world`, { method: 'GET' });
  expect(response.status).toEqual(501);
  expect(response.statusText).toEqual('Not Implemented');
});

test('if mocked, with path params, returns different responses by path', async () => {
  const mock = {
    method: 'GET',
    path: '/robin/catchphrases/1',
    status: 200,
    response: { catchphrases: 'holy gemini batman!' },
  };
  let response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);
  expect(response.statusText).toEqual('No Content');

  // works when path is mocked
  response = await fetch(`${apiBase}/robin/catchphrases/1`, { method: 'GET' });
  expect(response.status).toEqual(mock.status);
  expect(response.json()).resolves.toEqual(mock.response);

  // cannot find unmocked path
  response = await fetch(`${apiBase}/robin/catchphrases/2`, { method: 'GET' });
  expect(response.status).toEqual(501);
  expect(response.statusText).toEqual('Not Implemented');

  // cannot find path with variable
  response = await fetch(`${apiBase}/robin/catchphrases/{id}`, { method: 'GET' });
  expect(response.status).toEqual(400);
  expect(response.statusText).toEqual('Bad Request');
});

test('if mocked, but called with invalid path, then 400', async () => {
  const mock = {
    method: 'GET',
    path: '/robin/catchphrases/invalid_id',
    status: 200,
    response: { catchphrases: 'holy gemini batman!' },
  };

  // mock with invalid path
  let response = await fetch(
    `${apiBase}/mock`,
    { method: 'PUT', body: JSON.stringify(mock), headers: { 'content-type': 'application/json' } },
  );
  expect(response.status).toEqual(204);
  expect(response.statusText).toEqual('No Content');

  // invoke invalid path
  response = await fetch(`${apiBase}/robin/catchphrases/invalid_id`, { method: 'GET' });
  expect(response.status).toEqual(400);
  expect(response.statusText).toEqual('Bad Request');
});
