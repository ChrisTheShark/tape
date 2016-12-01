'use strict';
const expect = require('chai').expect,
    Tape = require('../lib/index.js');

describe('compose', function() {

    /*
     * =========================================================================
     * Negative path test cases.
     * =========================================================================
     */

    it('should notify user if manifest is invalid', function(done) {
        let manifest = {
            blah: {
                static: 'test'
            },
            foo: {}
        };

        try {
            Tape.compose(manifest, function(error, app) {});
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('ValidationError');
            done();
        }
    });

    it('should fail validation if application section is missing', function(done) {
        let manifest = {};

        try {
            Tape.compose(manifest, function(error, app) {});
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('ValidationError');
            done();
        }
    });

    it('should fail validation if number of arguments is greater than 3', function(done) {
        let manifest = {
            application: {}
        };

        try {
            Tape.compose(manifest, {}, function(error, app) {}, true);
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('AssertionError');
            done();
        }
    });

    it('should fail validation if route method is missing.', function(done) {
        let manifest = {
            application: {
                routes: [{
                    path: '/address',
                    handlers: [function(req, res) {
                        res.json({
                            success: 'Super!'
                        });
                    }]
                }]
            }
        };

        try {
            Tape.compose(manifest, {}, function(error, app) {});
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('ValidationError');
            done();
        }
    });

    it('should fail validation if route path is missing.', function(done) {
        let manifest = {
            application: {
                routes: [{
                    method: 'get',
                    handlers: [function(req, res) {
                        res.json({
                            success: 'Super!'
                        });
                    }]
                }]
            }
        };

        try {
            Tape.compose(manifest, {}, function(error, app) {});
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('ValidationError');
            done();
        }
    });

    it('should fail validation if route handler array is missing.', function(done) {
        let manifest = {
            application: {
                routes: [{
                    method: 'get',
                    path: '/address'
                }]
            }
        };

        try {
            Tape.compose(manifest, {}, function(error, app) {});
        } catch (error) {
            expect(error).to.not.be.null;
            expect(error.name).to.equal('ValidationError');
            done();
        }
    });

    /*
     * =========================================================================
     * Happy path test cases.
     * =========================================================================
     */

    it('should set application local variable when provided', function(done) {
        let manifest = {
            application: {
                locals: {
                    title: 'My Application'
                }
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            expect(app.locals.title).to.equal('My Application');
            done();
        });
    });

    it('should register static asset folder when provided', function(done) {
        let manifest = {
            application: {
                middleware: [{
                    module: 'express',
                    useFunction: 'static',
                    args: ['public']
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].name).to.equal('serveStatic');
            done();
        });
    });

    it('should register template engine and view directory when provided', function(done) {
        let manifest = {
            application: {
                views: {
                    engine: 'pug',
                    path: './views'
                }
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            expect(app.settings.views).to.equal('./views');
            expect(app.settings['view engine']).to.equal('pug');
            done();
        });
    });

    it('should register middleware by module and function when provided', function(done) {
        let manifest = {
            application: {
                middleware: [{
                    module: 'body-parser',
                    useFunction: 'json'
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].name).to.equal('jsonParser');
            done();
        });
    });

    it('should register middleware by constructor and args when provided', function(done) {
        let manifest = {
            application: {
                middleware: [{
                    module: 'morgan',
                    args: ['combined']
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].name).to.equal('logger');
            done();
        });
    });

    it('should register custom middleware when provided', function(done) {
        let manifest = {
            application: {
                middleware: [{
                    customFunction: function(req, res, next) {
                        next();
                    }
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].name).to.not.be.null;
            done();
        });
    });

    it('should register a route when provided', function(done) {
        let manifest = {
            application: {
                routes: [{
                    method: 'get',
                    path: '/address',
                    handlers: [function(req, res) {
                        res.json({
                            success: 'Super!'
                        });
                    }]
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].regexp).to.deep.equal(/^\/address\/?$/i);
            done();
        });
    });

    it('should register a route when provided ignoring case', function(done) {
        let manifest = {
            application: {
                routes: [{
                    method: 'GET',
                    path: '/address',
                    handlers: [function(req, res) {
                        res.json({
                            success: 'Super!'
                        });
                    }]
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].regexp).to.deep.equal(/^\/address\/?$/i);
            done();
        });
    });

    it('should register a route with multiple handlers when provided', function(done) {
        let manifest = {
            application: {
                routes: [{
                    method: 'get',
                    path: '/address',
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
                }]
            }
        };

        Tape.compose(manifest, function(error, app) {
            expect(error).to.be.null;
            let routeStack = app._router.stack;
            expect(routeStack[2].regexp).to.deep.equal(/^\/address\/?$/i);
            expect(routeStack[2].route.stack.length).to.equal(2);
            done();
        });
    });
});
