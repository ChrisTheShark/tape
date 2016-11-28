
## Interface

Tape exports a single function `compose` accepting a JSON `manifest` file specifying the express application routes, middleware, local variables and view settings.

### `compose(manifest, [options], [callback])`

Composes an express application where:
+ `manifest` - an object having:
  * `application` - an object containing the configuration passed to [app.use([...])] (http://expressjs.com/en/4x/api.html#app)  or [app.set(..., ...)] (http://expressjs.com/en/4x/api.html#app)
