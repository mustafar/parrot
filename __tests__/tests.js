const fetch = require('node-fetch');

const apiBase = 'http://localhost:15009/parrot-test';

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
test('if not faked, return 1st example response', async () => {
  const response = await fetch(`${apiBase}/batman/location`);
  expect(response.status).toEqual(200);
  expect(response.text()).resolves.toEqual('batcave');
});
