## tape

[![Build Status](https://travis-ci.org/ChrisTheShark/tape.svg?branch=master)](https://travis-ci.org/ChrisTheShark/tape)

Lead Maintainer - [Chris Dyer](https://github.com/ChrisTheShark)

### A server composer for Express.

Tape provides configuration based composition of Express's application object. Specifically it wraps

 * an application creation via `app = require('express')()`
 * one or more `router = require('express').Router()` registrations
 * zero or more registrations of middleware

calling each based on the configuration generated from the Tape manifest.

### Interface

Tape's [API](API.md) is a single `compose` function accepting a JSON `manifest` file specifying the express application routes, middleware, local variables and view settings.

### express version dependency

Tape currently supports express 4. Additional support will be added as express matures. Tape has not been tested on lower versions of express.
