# Source Game Models

`source-game-models` is a Codex skill for sourcing, license-checking, adapting, and integrating free third-party 3D models into Web 3D games.

## Contents

- [`source-game-models/`](source-game-models/) - the installable skill folder
- [`demo/`](demo/) - a runnable Three.js A/B comparison using a CC0 Quaternius skeleton

## Demo

```bash
cd demo
npm install
npm run dev
```

The demo compares a primitive baseline with the sourced model under the same camera and light rig. The selected asset's provenance, audit data, and attribution are recorded in [`demo/THIRD_PARTY_ASSETS.md`](demo/THIRD_PARTY_ASSETS.md).

The skill defaults to free, asset-specific licenses, user approval before downloading, glTF/GLB auditing, runtime-first remixing, and browser verification. It never treats an unknown or ripped model as acceptable final art.
