# truex-shared-js

Common ES6 JavaScript library shared across true[X] repos. Provides focus management
for CTV (Connected TV) platforms, SIMID client implementation, platform detection,
and various utilities.

This is a private library consumed via git URL with version tags (not published to npm).
Source is consumed directly - there is no build step.

## Setup

### Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **Yarn** package manager

```bash
# Install the correct Node version (using nvm)
nvm install
nvm use

# Or using n
n 22

# Install Yarn if not already installed
npm install -g yarn

# Install dependencies
yarn install
```

## Development

### Running Tests

```bash
# Run all tests
yarn test

# Run tests matching a pattern
yarn test -- --test-name-pattern="platform"
yarn test -- src/focus_manager

# Watch mode (re-run on changes)
yarn watch

# Run with coverage report
yarn coverage

# CI mode (with JUnit XML output)
yarn test:ci
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
├── __tests__/         # Test setup files
├── components/        # UI components (debug-log, fonts)
├── events/           # Event definitions (ad events)
├── focus_manager/    # CTV focus/input management
├── simid/            # SIMID client implementation
└── utils/            # General utilities
```

## Usage in Other Projects

Add to your `package.json` dependencies:

```json
{
    "dependencies": {
        "truex-shared": "git://github.com/socialvibe/truex-shared-js#v1.x.x"
    }
}
```

Replace `v1.x.x` with the desired version tag.

## Versioning & Releases

1. Update version in `package.json`
2. Document changes in `CHANGELOG.md`
3. Commit and push changes
4. Tag the release: `git tag v1.x.x && git push --tags`

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed coding guidelines and conventions.
