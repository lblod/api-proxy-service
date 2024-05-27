# API Proxy Service

Yes, this is yet another proxy service in LBLOD stack.

This particular proxy service proxies all calls made to `/` to the configured `API_URL`, while adding the configured `API_KEY` to the header and checking if the session has allowed roles assigned.

## Configuration

The following environment variables can be set to configure the service:

- `API_URL`: The URL to which all calls are proxied.
- `API_KEY`: The API key to be used for the proxied calls.
- `API_KEY_HEADER`: The header to which the API key is added. Default is `X-Api-Key`.
- `REQUIRED_ROLES`: A comma-separated list of roles that are required to access the service. Default is empty. If set, the service will check if the session has any of the roles assigned before proxying the call. If not set or empty, no check is performed.

## Setup in a `mu-semtech` Docker stack


### `dispatcher.ex`

Service relies on the `mu-identifier` and `mu-dispatcher` service to forward requests to the proxy service.

```elixir
match "/api-proxy-service/*path" do
  forward conn, path, "http://api-proxy-service/"
end
```

### `docker-compose.yml`

```yaml
  api-proxy-service:
    image: lblod/api-proxy-service:latest
    links:
      - database:database
    environment:
      API_URL: "https://SOME_URL.COM"
      API_KEY: "SOME_KEY"
      REQUIRED_ROLES: "ONE,OR_MORE,ROLES"
    restart: always
```


