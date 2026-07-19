# Source Game Models

**English** | [简体中文](README.zh-CN.md)

`source-game-models` is a platform-agnostic AI-agent skill for reference-first Web 3D modeling. It helps AI move beyond crude primitive assemblies by studying strong existing models before making final modeling decisions.

![Primitive baseline compared with a reference-informed, runtime-remixed skeleton](preview.png)

The preview shows the same subject under the same camera and lighting. The left side is a primitive baseline; the right side uses an established model as a reference and adapts its proportions, materials, parts, and animation for the target scene. The reference model is [Skeleton by Quaternius](https://poly.pizza/m/DM4QScSmbS), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

## Purpose

The goal is better modeling, not simply downloading characters or props. The skill guides an AI agent to:

- Study existing models for silhouette, proportion, material language, detail density, construction, rigging, and animation.
- Turn those observations into a concrete modeling and adaptation plan for the current project.
- Adapt, remix, combine, or rebuild assets so the result fits the project's art direction and technical constraints.
- Treat primitive geometry as a prototype or an intentional abstract style, not a default final result.

Model search and download are supporting steps. A found asset should be used as a lawful reference or adaptation base, not dropped into the project unchanged without analysis.

## Install

Add the [`source-game-models/`](source-game-models/) folder through the custom-skill mechanism supported by your AI coding agent. The folder is self-contained and includes the skill instructions, source guidance, Web 3D quality guidance, and a glTF/GLB inspection script.

## Use

Ask the agent to improve a model through reference-driven analysis:

```text
Use the source-game-models skill to improve the main character in my Three.js game. Study suitable licensed models as references, explain what they teach us about silhouette, proportions, materials, rigging, and animation, then adapt or rebuild a result that matches this project's style.
```

Agents that support skill auto-discovery can also activate it for Three.js, React Three Fiber, or Babylon.js work involving characters, props, vehicles, buildings, environments, creatures, rigs, or animation.

## Workflow

1. Read the project's visual direction, scale, materials, detail level, animation needs, and performance budget.
2. Find a small set of high-quality, legally usable reference models.
3. Compare what each reference contributes to the modeling solution, not just how it looks in a thumbnail.
4. Confirm the reference direction with the user before downloading or integrating an asset.
5. Translate the chosen reference into project-specific changes to proportions, materials, parts, topology, rigging, or animation.
6. Record provenance, license terms, and modifications in `THIRD_PARTY_ASSETS.md`.
7. Validate the result in the real game scene, including framing, animation, rendering, and mobile performance.

## Reference With Care

Reference-first does not mean copying blindly. The skill rejects unclear licenses, ripped assets, noncommercial-only assets, and models that forbid derivatives. It preserves attribution and source records, and it does not present an unmodified download as completed modeling work.
