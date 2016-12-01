
## Interface

Tape exports a single function `compose` accepting a JSON `manifest` file specifying the express application routes, middleware, local variables and view settings.

### `compose(manifest, [options], [callback])`

Composes an express application where:
+ `manifest` - an object having:
  * `application` - an object containing the configuration passed to [app.use(...)] (http://expressjs.com/en/4x/api.html#app)  or [app.set(..., ...)] (http://expressjs.com/en/4x/api.html#app)
    + `locals` - an object containing properties that are local variables within the application.
    + `views` - an object containing view settings for the application. View path and engine are set here.
    + `middleware` - an array of middleware objects to pass to the application. Middleware can be a module with a constructor and arguments; a module, a function and arguments; or a custom function.
    + `routes` - an array of route objects to pass to the application. These routes are parsed and provided to the appropriate [app.<method>(path, callback [, callback ...])] (http://expressjs.com/en/4x/api.html#app.get) function.
  * `routers` - an array of routers to register with the application. The path is relative to the options.relativeTo parameter.
    + `router` - relative path to router file.
    + `middleware` - an array of middleware objects to pass to the router. Syntax matches the application middleware above.
    + `options` - an object containing optional parameters for the router.
      * `path` - a string denoting a path to append to any requests to the router object.

If no `callback` is provided, a `Promise` object is returned where the value passed to the Promise resolve handler is the `app` object and the value passed to the Promise reject handler is the error response if a failure occurred.

## Usage

```javascript
'use strict';

const Tape = require('express-tape');

const manifest = {
    application: {
        locals: {
            title: 'My Application'
        },
        views: {
            engine: 'pug',
            path: './views'
        },
        middleware: [{
            module: 'express',
            useFunction: 'static',
            args: ['public']
        }, {
            module: 'body-parser',
            useFunction: 'json'
        }, {
            module: 'morgan',
            args: ['combined']
        }],
        routes: [{
    	   method: 'get',
           path: '/api/awesome',
           handlers: [
                function(req, res, next) {
                   console.log('Your about to be praised.');
                   next();
                },
                function(req, res) {
                   res.json({
                      success: 'Super!'
                   });
                }
           ]
        }],
        routers: [{
            router: './lib/routes/simpleRoute',
            middleware: [{
                customFunction: function(req, res, next) {
                    next();
                }
            }],
            options: {
                path: '/api'
            }
        }]
    }
};

const options = {
    relativeTo: __dirname
};

Tape.compose(manifest, options, function(error, app) {
    app.listen(3000, function(error) {
        if (error) {
            throw error;
        }
    });
});
```

The above snippet is from the Tape sample project located [here](https://github.com/ChrisTheShark/express-simple.git).
