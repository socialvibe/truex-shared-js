# truex-shared-js

Common ES6 JavaScript library shared across true[X] repos. Provides focus management
for CTV (Connected TV) platforms, SIMID client implementation, platform detection,
and various utilities.

This is a private library published as `@socialvibe/shared` to GitHub Packages.
Source is consumed directly - there is no build step.

Consumer install instructions live in [README_NPM.md](./README_NPM.md). That file
replaces this README at publish time and is not included in the package.

## Setup

### Prerequisites

- **Node.js 24** (see `.nvmrc`)
- **npm** (comes with Node)

```bash
# Install the correct Node version (using nvm)
nvm install
nvm use

# Or using n
n 24

# Install dependencies
npm install
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests matching a pattern
npm test -- --test-name-pattern="platform"
npm test -- src/focus_manager

# Watch mode (re-run on changes)
npm run watch

# Run with coverage report
npm run coverage

# CI mode (with JUnit XML output)
npm run test:ci

# Typecheck JSDoc (src only, not tests)
npm run typecheck
```

### Test Structure

Tests use Node.js native test runner with jsdom for DOM environment.
Place tests in `__tests__/` subdirectories with `-test.js` suffix.

```javascript
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { MyFunction } from '../my_module.js';

describe("MyModule", () => {
    test("should do something", () => {
        assert.strictEqual(MyFunction(input), expected);
    });
});
```

## Project Structure

```
src/
├── components/        # UI components (fonts)
├── events/           # Event definitions (ad events)
├── focus_manager/    # CTV focus/input management
├── simid/            # SIMID client implementation
└── utils/            # General utilities
```

## Versioning & Releases

Every PR targeting `develop` must increment the version in `package.json`
and add a `CHANGELOG.md` entry. CI does not bump the version after merge.

1. Create a branch: `feature/<TICKET>[/<short-description>]` or `bugfix/<TICKET>[/<short-description>]`
2. Bump the patch version in `package.json` (minor/major when the change warrants it)
3. Document the change in `CHANGELOG.md` under the same `## vX.Y.Z` heading as that version. If the heading already exists, append there — do not add a second heading for the same increment.
4. Implement the change, commit, push, open a PR
5. CI runs unit tests and checks that the version was incremented
6. After merge to `develop`, CI runs unit tests, publishes `@socialvibe/shared`
   to GitHub Packages, tags `vX.Y.Z`, and creates a GitHub release

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed coding guidelines and conventions.
