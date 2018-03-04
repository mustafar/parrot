const fetch = require('node-fetch');

const apiBase = 'http://localhost:15009/parrot-test';

beforeEach(async () => {
  await fetch(`${apiBase}/mock`, { method: 'DELETE' });
});

test('if invalid path, then 501', async () => {
  const response = await fetch(`${apiBase}/foo/bar`);
  expect(response.status).toEqual(501);
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
