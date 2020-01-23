truex-shared-js
===============

HTML5/JS Shared Utilities

ES6 based, can be used anywhere that needs them.

This library is intended to be made accessible via the yarn packager with src "as is".

As such, the build steps of this library itself is avoided.

We do want jest unit tests to run however.

## Setup

### Dependencies

**N & validated Node version**: `npm install -g n && n lts`

*** n lts is currently `12.14.1` as of 01/10/20. an alternative command to install a validated node version is to use the command:  `n 12.14.1`

**Yarn**: `npm install -g yarn`

After installing Yarn:

```
yarn install
```

## Building and Testing

As this is a reusable library of JS classes and functions, any building/running in this repo is primarily done in the context of unit tests.

Please your tests in a __tests__ sub directory of your relevant files. The convention is to add a -test.js suffix for a given source files.

To run the test suite you can do: `npm test` or `jest`

Or for a single test: `npm test -- platform`
or: `jest focus_manager`
i.e. use a test file name pattern that will match the 

## Deploying

To make this library available to other repos, be sure to push any changes and follow the normal review process.

Ensure the version number in package.json is updated to a newer value, and be sure to tag your branch in github with 
the same version, e.g. `v1.0.0` .

In client repos, one should refer to this library using the package name, github repo url, and desired version 
number, e.g.
```
    dependencies: {
        ...
        "truex-shared": "git://github.com/socialvibe/truex-shared-js#v1.0.0",
        ...
    }
```  
