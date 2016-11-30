'use strict';
const express = require('express'),
    assert = require('assert'),
    async = require('async'),
    Path = require('path'),
    Joi = require('joi'),
    internals = {};

let middlewareSchema = Joi.array().items(
    Joi.object({
        module: Joi.string(),
        useFunction: Joi.string(),
        customFunction: Joi.func(),
        args: Joi.array()
    })
);

internals.schema = {
    options: Joi.object({
        relativeTo: Joi.string()
    }),
    manifest: Joi.object({
        application: Joi.object({
            locals: Joi.object(),
            views: Joi.object({
                engine: Joi.string(),
                path: Joi.string()
            }),
            middleware: middlewareSchema,
            routers: Joi.array().items(
                Joi.object({
                    router: Joi.string(),
                    middleware: middlewareSchema,
                    options: Joi.object({
                        path: Joi.string()
                    })
                })
            )
        }).required()
    })
};

exports.compose = function(manifest /*, [options], [callback] */ ) {

    assert(arguments.length <= 3, 'Invalid number of arguments');
    const options = arguments.length === 1 || typeof arguments[1] === 'function' ? {} : arguments[1];
    const callback = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : null;

    Joi.assert(options, internals.schema.options, 'Invalid options');
    Joi.assert(manifest, internals.schema.manifest, 'Invalid manifest');

    if (!callback) {
        return new Promise((resolve, reject) => {
            exports.compose(manifest, options, (error, app) => {
                if (error) {
                    return reject(error);
                }
                return resolve(app);
            });
        });
    }

    async.waterfall([
        function(cb) {
            /*
             * Parse application from manifest application entries.
             */
            cb(null, internals.parseApplication(manifest || {}, options.relativeTo));
        },
        function(app, cb) {
            /*
             * Parse routers from manifest application.routers entries.
             */
            cb(null, internals.parseRouters(manifest, app, options.relativeTo));
        }
    ], function(error, app) {
        if (error) {
            return callback(error);
        }
        /*
         * Return composed application.
         */
        callback(null, app);
    });

};

internals.parseApplication = function(manifest, relativeTo) {
    let middleware = manifest.application.middleware;
    let locals = manifest.application.locals;
    let views = manifest.application.views;
    let app = express();

    /*
     * Parse middleware from manifest.application.middleware.
     */
    if (middleware && middleware.length) {
        internals.registerMiddleware(app, middleware);
    }

    /*
     * Parse locals from manifest.application.locals.
     */
    if (locals && Object.keys(locals).length) {
        Object.assign(app.locals, locals);
    }

    /*
     * Parse view settings from manifest.application.views.
     */
    if (views && Object.keys(views).length) {
        if (views.path) {
            if (relativeTo && views.path[0] === '.') {
                app.set('views', Path.join(relativeTo, views.path));
            } else {
                app.set('views', views.path);
            }
        }
        if (views.engine) {
            app.set('view engine', views.engine);
        }
    }

    return app;
};

internals.parseRouters = function(manifest, app, relativeTo) {
    let routers = manifest.application.routers;

    /*
     * Parse routers from manifest.appliction.routers. Routers can have
     * middleware registered as with application. If a path is provided,
     * use path during registration with application.
     */
    if (routers && routers.length) {
        routers.forEach((entry) => {
            let filepath = entry.router;
            if (relativeTo && filepath[0] === '.') {
                filepath = Path.join(relativeTo, filepath);
            }

            let router = require(filepath);
            /*
             * Parse middleware from manifest.application.routers.middleware.
             */
            if (entry.middleware && entry.middleware.length) {
                internals.registerMiddleware(router, entry.middleware);
            }

            if (entry.options && entry.options.path) {
                app.use(entry.options.path, router);
            } else {
                app.use(router);
            }
        });
    }

    return app;
}

internals.registerMiddleware = function(user, middleware) {
    /*
     * Parse middleware to pass in the 'use(..)' function of the consumer. The
     * consumer could be either an app or a router. This section should be flexible
     * enough to handle multiple scenarios of middleware use. For example, the
     * entry.module could be the middleware to require along with a function and
     * arguments. This results in an app.use(..) call similar to
     * app.use(morgan('combined')).
     */
    middleware.forEach((entry) => {
        if (entry.module && entry.useFunction) {
            user.use(require(entry.module)[entry.useFunction].apply(
                null, entry.args));
        } else if (entry.module && !entry.useFunction) {
            user.use(require(entry.module)(
                entry.args && entry.args.length > 1 ? entry.args : entry.args[0]));
        } else if (!entry.module && entry.customFunction) {
            user.use(entry.customFunction);
        }
    });
}
