# Parrot
Mockable, containerized API generated from a Swagger spec.

# Running
### Setup Dockerfile
```
FROM mustafar/parrot:latest

# set the port for the mock api
ENV PORT=3000

# copy a swagger spec to /swagger.yml (inside container)
# and also set the path of swagger.yml in the container
COPY /path/to/a/swagger/spec /swagger.yml
ENV SWAGGER_SPEC="/swagger.yml
```

### Build container image
Run the following command (in the same dir as the Dockerfile) to build your image
`docker build -t my_api .`

You may now publish this image to a docker repository.

### Run container
Run this command to start your container
`docker run -p 3000:3000 my_api:latest`

The `-p` directive sets up port forwarding from your container to host.

# Testing
Once your API is up and running, you may call various API endpoints and receive either default or mocked responses.

### Default response example
Consider the following swagger route
```
/batman/location:
  get:
    x-swagger-router-controller: batman-location-controller
    responses:
      500:
        description: failed to find batman
      201:
        example: alfred's outhouse # example is at an unexpected level
      200:
        schema:
          type: string
          example: batcave # example at correct level
          description: batman found
```
Parrot will return the **first** response with an `example` property nested under a `schema` property. It will response with the value of the `example` property (in this case `batcave (200)`).

### Mocked response example
Call `PUT /mock` to mock another route
```js
// mock
const mock = {
  method: 'GET',
  path: '/batman/location',
  status: 201,
  response: 'arkham',
};
await fetch(
  `${apiBase}/mock`,
  {
    method: 'PUT',
    body: JSON.stringify(mock),
    headers: { 'content-type': 'application/json' }
  },
);

// invoke (should return "arkham (201)")
await fetch(`${apiBase}/batman/location`, { method: 'GET' });
```

`DELETE /mock` will reset all mocked behavor.

Check out the [tests](https://github.com/mustafar/parrot/blob/master/__tests__/tests.js) for more examples!

# Contributing
Send me a PR or open an [Issue](https://github.com/mustafar/parrot/issues).
