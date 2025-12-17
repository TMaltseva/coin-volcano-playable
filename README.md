# Coin Volcano Playable Ad

HTML5 playable ad for advertising platforms with chest selection and slot machine mechanics.

> ⚠️ **Important:** This code works on advertising platforms (Mintegral, Unity Ads) and uses `@smoud/playable-sdk` for integration with ad networks.

## Technologies

- **@smoud/playable-sdk** - Universal SDK for integration with advertising platforms
- **@smoud/playable-scripts** - Build tools for playable ads
- **Pixi.js** - For rendering animations and graphics
- **GSAP** - For animations and transitions
- **Vite** - Project bundler for development

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Run dev server (Vite)
npm run dev

# Run dev server with playable-scripts (recommended for testing integration)
npm run dev:playable
```

The project will be available at: `http://localhost:3000`

## Building for Advertising Platforms

### Mintegral

```bash
# Build for Mintegral
npm run build:mintegral
```

Output:
- `dist/mintegral/ConceptName.html` - HTML loader
- `dist/mintegral/build.js` - Minified JavaScript bundle
- `dist/AppName_ConceptName_v1_*_MINTEGRAL.zip` - ZIP archive for platform upload

### Unity Ads

```bash
# Build for Unity Ads
npm run build:unity
```

Output:
- `dist/AppName_ConceptName_v1_*_UNITY.html` - Single HTML file with all code

### Build for All Platforms

```bash
# Build for all platforms at once
npm run build:all
```

## Validation

Before uploading to advertising platforms, it's recommended to validate builds using validation scripts:

### Mintegral Validation

```bash
npm run validate:mintegral
```

Checks:
- ✅ ZIP archive size (< 5 MB)
- ✅ HTML loader and build.js sizes
- ✅ Playable SDK integration (`@smoud/playable-sdk`)
- ✅ MRAID/DAPI events
- ✅ Install event (sdk.install, triggerCTA)
- ✅ All resources inline (no external links in src/href attributes)
- ✅ SDK events (init, start, finish)
- ✅ Dependencies (GSAP, PixiJS)
- ✅ Performance metrics (requestAnimationFrame, timers, monitoring)

### Unity Ads Validation

```bash
npm run validate:unity
```

Checks:
- ✅ HTML file size (< 5 MB)
- ✅ Playable SDK integration
- ✅ MRAID protocol
- ✅ Install event
- ✅ All resources inline
- ✅ SDK events
- ✅ Dependencies
- ✅ Performance metrics
- ✅ Game logic
- ✅ Assets

## Integration with @smoud/playable-sdk

The project uses `@smoud/playable-sdk` for universal integration with advertising platforms:

### Initialization

```javascript
import { sdk } from "@smoud/playable-sdk";

sdk.init((width, height) => {
  window.game = new Game(width, height);
});
```

### SDK Events

- `sdk.on("resize", ...)` - Container size change
- `sdk.on("pause", ...)` - Playable pause
- `sdk.on("resume", ...)` - Playable resume
- `sdk.on("volume", ...)` - Volume change
- `sdk.on("finish", ...)` - Playable completion
- `sdk.on("interaction", ...)` - Interaction tracking

### Start and Finish

```javascript
// After all resources are loaded
sdk.start();

// After game experience completion (e.g., after BIG WIN)
sdk.finish();

// On CTA button click (Withdraw)
sdk.install();
```

The SDK automatically detects the platform and uses the appropriate protocol (MRAID, DAPI, Unity, etc.).



## Bundle Size

After building, check file sizes:

- **Mintegral ZIP**: Should be < 5 MB
- **Unity HTML**: Should be < 5 MB (typically ~2-3 MB)

Use validation scripts for automatic size checking.

## Deployment to Advertising Platforms

### Mintegral

1. Build the project: `npm run build:mintegral`
2. Run validation: `npm run validate:mintegral`
3. Upload ZIP archive (`dist/AppName_ConceptName_v1_*_MINTEGRAL.zip`) to Mintegral Playturbo

### Unity Ads

1. Build the project: `npm run build:unity`
2. Run validation: `npm run validate:unity`
3. Upload HTML file (`dist/AppName_ConceptName_v1_*_UNITY.html`) to Unity Ads

## Implementation Features

- **Automatic platform detection**: SDK automatically detects the advertising platform and uses the appropriate protocol
- **Inline resources**: All resources are embedded in the build for operation without external dependencies
- **Performance optimization**: Use of requestAnimationFrame, memory optimization, performance monitoring
- **Universal integration**: One codebase works on different advertising platforms thanks to `@smoud/playable-sdk`

## Documentation

- [@smoud/playable-sdk](https://github.com/smoudjs/playable-sdk) - SDK documentation
- [@smoud/playable-scripts](https://github.com/smoudjs/playable-scripts) - Build tools documentation

## License

ISC
