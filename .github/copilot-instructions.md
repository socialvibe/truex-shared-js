# truex-shared-js

Common ES6 JavaScript library shared across true[X] repos. Provides focus management
for CTV (Connected TV) platforms, SIMID client implementation, platform detection,
and various utilities.

This is a private library consumed via git URL with version tags (not published to npm).
Source is consumed directly - there is no build step.

## Build & Test Commands

**Package manager:** Yarn

```bash
# Install dependencies
yarn install

# Run all tests
yarn test

# Run a single test file by pattern
yarn test --test-name-pattern="platform"     # matches test names containing "platform"
yarn test src/focus_manager                  # run tests in focus_manager directory

# Run a single test file
yarn test:single src/utils/__test__/url_params.test.js  # run tests in url_params.test.js

# Run .only test cases from a single file
yarn test:only src/utils/__test__/url_params.test.js    # run only .only test cases

# Watch mode (re-run on changes)
yarn watch

# Run with coverage report
yarn coverage

# CI mode (with JUnit XML output)
yarn test:ci
```

There is no build/compile step. This library is ES6 source consumed directly by
dependent projects via their own build systems (Babel/Browserify).

## Testing Guidelines

- **Framework:** Node.js native test runner with jsdom environment
- **Test location:** Place tests in `__tests__/` subdirectory next to source files
- **Test naming:** Use `-test.js` or `-tests.js` suffix (e.g., `url_params-test.js`)
- **Test pattern:** `src/**/__tests__/*-test*.js`

### Test Structure

```javascript
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { MyFunction } from '../my_module.js';

describe("MyModule", () => {
    describe("MyFunction", () => {
        test("should do something specific", () => {
            assert.strictEqual(MyFunction(input), expectedOutput);
        });
    });
});
```

- Use `describe` blocks to group related tests
- Use `test` (not `it`) for individual test cases
- Test names should be descriptive: "should do X when Y"


## Code Style Guidelines

### Language & Modules

- **Language:** Plain JavaScript (ES6+), no TypeScript
- **Modules:** ES6 `import`/`export` syntax with explicit `.js` extensions
- **Node version:** 24 (see `.nvmrc`)

### Imports

```javascript
// Named imports preferred - always include .js extension for local imports
import { TXMPlatform, keyCodes } from './txm_platform.js';
import { parseQueryArgs } from '../utils/url_params.js';

// Default imports when module exports default
import timedTrace from "../utils/timed_trace.js";

// Side-effect imports for polyfills
import '../utils/uuid-polyfill.js';

// External packages (no extension needed)
import { v4 as uuid } from 'uuid';
```

Order imports: external packages, then local modules (relative paths).

### Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| Classes | PascalCase, `TXM` prefix for core | `TXMFocusManager`, `SIMIDClient` |
| Files (utils) | snake_case | `url_params.js`, `timed_trace.js` |
| Files (components) | kebab-case | `simid-client.js`, `debug-log.js` |
| Functions | camelCase | `parseQueryArgs`, `encodeUrlParams` |
| Constants (local) | camelCase | `keyCodes`, `inputActions` |
| Private members | underscore prefix | `_focus`, `_resolve`, `_contentWindow` |
| Boolean flags | `is`/`has`/`supports` prefix | `isActive`, `hasProxy`, `supportsTouch` |

### Formatting

- **Indentation:** 4 spaces
- **Braces:** Same line (K&R style)
- **Semicolons:** Required
- **Quotes:** Single quotes for strings
- **No trailing commas** in most cases (some exceptions exist)

```javascript
export class MyClass {
    constructor(value) {
        this._value = value;
        this.isReady = false;
    }

    get value() {
        return this._value;
    }

    doSomething(arg1, arg2) {
        if (arg1) {
            return this._process(arg2);
        }
        return undefined;
    }
}
```

### Documentation

Use JSDoc comments for public classes and methods:

```javascript
/**
 * Parses the query args from a given url.
 * @param {string} url - the url to parse the query args from
 * @param {string} separatorString - string to separate the query args by
 * @returns {object} - object map of key/value query arg pairs
 */
export function parseQueryArgs(url, separatorString = "&") {
    // ...
}
```

### Error Handling

```javascript
// Simple validation errors - throw strings
if (!url) {
    throw 'url not provided';
}

// Throw Error objects for detailed errors
if (!withElement) throw new Error("captureKeyboardFocus: missing element arg");

// Tolerate errors with try/catch when appropriate
try {
    value = decodeURIComponent(parts[1]);
} catch (ignore) {
    value = parts[1];
}

// Console warnings for non-fatal issues
console.warn('rejected', this._url, ...data);
```

### Class Patterns

- Use getters for computed/derived properties
- Use underscore-prefixed fields for private state
- Bind methods in constructor when used as callbacks

```javascript
export class MyClass {
    constructor() {
        this._items = [];
        this.onEvent = this.onEvent.bind(this);  // for callbacks
    }

    get items() { return this._items; }
    get hasItems() { return this._items.length > 0; }
}
```

## Project Structure

```
src/
├── __tests__/         # Test setup files
├── components/        # UI components (debug-log, fonts)
├── events/           # Event definitions (ad events)
├── focus_manager/    # CTV focus/input management
│   └── __tests__/
├── simid/            # SIMID client implementation
│   └── __tests__/
└── utils/            # General utilities
    └── __tests__/
```

### Adding New Code

- **Utilities:** Add to `src/utils/`, create test in `src/utils/__tests__/`
- **Focus/input related:** Add to `src/focus_manager/`
- **Platform detection:** Extend `TXMPlatform` class in `txm_platform.js`
- **New module category:** Create new directory under `src/` with `__tests__/` subdirectory


## Commit Convention

Use conventional commit format with JIRA ticket prefix:

```
<JIRA-ID> - <type>: <description>

Examples:
PI-1234 - feat: Add new focus navigation algorithm
PI-1234 - fix: Correct key mapping for PS5 platform
PI-1234 - refactor: Simplify URL parameter parsing
PI-1234 - test: Add tests for edge cases in loaders
PI-1234 - docs: Update testing guidelines
```
