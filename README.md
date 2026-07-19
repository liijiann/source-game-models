# Source Game Models

`source-game-models` is a Codex skill for sourcing, license-checking, adapting, and integrating free third-party 3D models into Web 3D games.

![Primitive baseline compared with a sourced and runtime-remixed skeleton](preview.png)

The preview compares a primitive baseline with a sourced and runtime-remixed model under the same camera and lighting. The external model is [Skeleton by Quaternius](https://poly.pizza/m/DM4QScSmbS), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

## Install

Ask Codex to install the skill from this repository:

```text
Install the source-game-models skill from:
https://github.com/liijiann/source-game-models/tree/main/source-game-models
```

The skill is installed as `~/.codex/skills/source-game-models` and becomes available on the next turn.

## Use

Invoke it explicitly for the most predictable result:

```text
Use $source-game-models to find a free, commercially usable animated character for my Three.js game. Show me licensed candidates before downloading anything.
```

It can also trigger automatically when a task involves sourcing or improving characters, props, vehicles, buildings, environments, or animation assets for Three.js, React Three Fiber, or Babylon.js.

## What It Enforces

- Analyze the project's art direction and performance budget before searching.
- Present verifiable candidates with author, source, license, format, animation, and performance details.
- Download only after user approval.
- Reject unclear licenses, ripped assets, noncommercial-only assets, and models that forbid derivatives.
- Audit glTF/GLB files and record provenance in `THIRD_PARTY_ASSETS.md`.
- Adapt materials, scale, parts, and animations before considering mesh-level Blender work.
- Validate the result in the real game scene, including mobile performance.

The skill defaults to free, asset-specific licenses, user approval before downloading, glTF/GLB auditing, runtime-first remixing, and browser verification. It never treats an unknown or ripped model as acceptable final art.
