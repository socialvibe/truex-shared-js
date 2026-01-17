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
yarn test -- platform           # matches txm_platform-test.js
yarn test -- focus_manager      # matches all focus_manager tests
jest url_params                 # alternative: use jest directly

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

- **Framework:** Jest with jsdom environment
- **Test location:** Place tests in `__tests__/` subdirectory next to source files
- **Test naming:** Use `-test.js` or `-tests.js` suffix (e.g., `url_params-test.js`)
- **Test pattern:** Jest regex is `__tests__/[^/]+-tests?.js`

### Test Structure

```javascript
import { MyFunction } from '../my_module';

describe("MyModule", () => {
    describe("MyFunction", () => {
        test("should do something specific", () => {
            expect(MyFunction(input)).toBe(expectedOutput);
        });
    });
});
```

- Use `describe` blocks to group related tests
- Use `test` (not `it`) for individual test cases
- Test names should be descriptive: "should do X when Y"
- For platform-specific tests, construct with user agent override:
  `new TXMPlatform("Mozilla/5.0 ...")`

## Code Style Guidelines

### Language & Modules

- **Language:** Plain JavaScript (ES6+), no TypeScript
- **Modules:** ES6 `import`/`export` syntax
- **Node version:** 14.21 (see `.nvmrc`)

### Imports

```javascript
// Named imports preferred
import { TXMPlatform, keyCodes } from './txm_platform';
import { parseQueryArgs } from '../utils/url_params';

// Default imports when module exports default
import timedTrace from "../utils/timed_trace";

// Side-effect imports for polyfills
import '../utils/uuid-polyfill';

// External packages
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
├── components/        # UI components (debug-log, fonts)
├── deploy/           # Deployment utilities (S3 upload, CDN purge)
│   └── __tests__/
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

### Versioning

- Update version in `package.json`
- Document changes in `CHANGELOG.md` with JIRA ticket references
- Tag releases as `v1.x.x` in git
