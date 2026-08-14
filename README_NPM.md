# @socialvibe/shared

Common ES6 JavaScript library shared across TrueX repos. Provides focus management for CTV (Connected TV) platforms, SIMID client implementation, and various utilities for interactive ad experiences.

Source is consumed directly - there is no build step.
Public APIs are typed with JSDoc on the `.js` files. Ambient leftovers live in `src/common.d.ts`.

## Installation

This is a private package on GitHub Packages. Create a [personal access token](https://github.com/settings/tokens) with the `read:packages` scope and export it before installing:

```bash
export TRUEX_GITHUB_PACKAGES_TOKEN="YOUR_TOKEN_HERE"
```

Add an `.npmrc` in the consumer repo:

```
@socialvibe:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${TRUEX_GITHUB_PACKAGES_TOKEN}
```

Then add the dependency:

```json
{
  "dependencies": {
    "@socialvibe/shared": "1.12.0"
  }
}
```

```bash
npm install @socialvibe/shared@1.12.0
```

## Features

### Focus Manager

A comprehensive focus management system for handling remote control and keyboard input on CTV platforms.

```javascript
import { TXMFocusManager } from '@socialvibe/shared/src/focus_manager/txm_focus_manager.js';
import { inputActions } from '@socialvibe/shared/src/focus_manager/txm_input_actions.js';

const focusManager = new TXMFocusManager();

// Handle input actions
focusManager.onInputAction = (action) => {
  if (action === inputActions.select) {
    console.log('User pressed select');
    return true; // handled
  }
  return false; // not handled
};
```

**Key Classes:**
- `TXMFocusManager` - Main focus manager for handling navigation
- `Focusable` - Base class for focusable components
- `TXMPlatform` - Platform detection and key code mapping
- `inputActions` - Standard input action constants

### SIMID Client

Implementation of the [Secure Interactive Media Interface Definition (SIMID)](https://interactiveadvertisingbureau.github.io/SIMID) protocol for interactive ads.

```javascript
import { SIMIDClient } from '@socialvibe/shared/src/simid/simid-client.js';

const simidClient = new SIMIDClient(window);

// Start SIMID session
await simidClient.start();

// Listen to SIMID events
simidClient.addEventListener('simidEvent', (eventData) => {
  console.log('SIMID event received:', eventData);
});
```

### Utilities

#### URL Parameters

```javascript
import { parseQueryArgs, updateQueryArgs, setQueryArgs } from '@socialvibe/shared/src/utils/url_params.js';

// Parse query args from URL
const params = parseQueryArgs('https://example.com?foo=bar&baz=qux');
// => { foo: 'bar', baz: 'qux' }

// Update query args in URL
const newUrl = updateQueryArgs('https://example.com?foo=bar', { baz: 'qux' });
// => 'https://example.com?foo=bar&baz=qux'
```

#### App Storage

```javascript
import { AppStorage } from '@socialvibe/shared/src/utils/app-storage.js';

const storage = new AppStorage();

// Store and retrieve data
storage.setItem('key', 'value');
const data = storage.getItem('key');
```

#### Loaders

```javascript
import { ScriptLoader, ImageLoader } from '@socialvibe/shared/src/utils/loaders.js';

// Load external script
await new ScriptLoader('https://example.com/script.js').promise;

// Preload image
await new ImageLoader('https://example.com/image.png').promise;
```

#### Timed Trace

```javascript
import timedTrace from '@socialvibe/shared/src/utils/timed_trace.js';

const trace = timedTrace();
// ... do some work ...
trace('Operation completed'); // Logs with elapsed time
```

### Events

```javascript
import { TruexAdEventType } from '@socialvibe/shared/src/events/txm_ad_events.js';

// Standard ad event constants
console.log(TruexAdEventType.AD_STARTED);
console.log(TruexAdEventType.AD_COMPLETED);
```

## Version

For release notes and version history, see the project's CHANGELOG.md.
