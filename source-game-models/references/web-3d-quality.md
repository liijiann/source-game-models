# Web 3D Model Quality Checklist

Use this checklist after a candidate passes the license gate. Judge the asset in the target game, because a model-viewer preview does not establish gameplay quality or performance.

## Before Download

- Prefer GLB for self-contained delivery. Accept glTF only when all buffers and images are available.
- Confirm whether geometry, textures, rig, and animations are included in the free download.
- Record published polygon count, texture resolution, archive size, physical scale, and required extensions when available.
- Prefer a coherent pack or author when several models must share the same visual language.
- Avoid committing to FBX/OBJ-only candidates unless a tested conversion path is already available.

## Static Audit

Run `scripts/inspect_gltf.mjs` and inspect its report. Compare results to project budgets rather than treating generic thresholds as quality scores.

Check:

- scene, node, mesh, primitive, material, texture, skin, and animation counts;
- triangle count and the effect of multiple simultaneously visible instances;
- file size and all external buffer/image references;
- `extensionsRequired`, especially Draco, Meshopt, and KTX2/Basis dependencies;
- unused scenes, nodes, materials, textures, morph targets, and animation clips;
- unexpectedly large textures, excessive materials, or one material per tiny part.

The inspector's default warnings at 250,000 triangles or 50 MiB are broad triage thresholds for a single Web asset, not automatic rejection limits. Override them with the game's actual budget.

## Transform and Geometry

- Measure the bounding box and normalize scale using the project's established world units.
- Confirm up axis, apparent forward direction, origin, pivot, and ground contact in the target loader.
- Look for inverted normals, backface holes, z-fighting, disconnected parts, bad tangents, and extreme bounding boxes.
- Keep authored hierarchy and node names when animation or gameplay code depends on them.
- Use simple collision proxies where appropriate; do not use a dense render mesh as the default physics collider.

## Materials and Textures

- Confirm base color and emissive maps use the correct color space; treat normal, roughness, metallic, and occlusion data as non-color data.
- Check alpha mode, double-sided materials, normal-map orientation, UV seams, and transparent sorting.
- Recolor through material parameters or well-scoped texture edits while preserving surface readability.
- Verify lighting under the game's environment, not only the source preview HDRI.
- Resize and compress textures only after comparing visible quality at the normal camera distance.
- Do not enable Draco, Meshopt, KTX2, or Basis compression until the matching runtime decoder is configured and tested.

## Rig and Animation

- List clip names, durations, tracks, and expected loop behavior.
- Confirm the intended skeleton exists and all skinned meshes remain attached through each clip.
- Test bind pose, scale, root motion, foot contact, transitions, and clip reset behavior.
- Preserve bone names when retargeting or gameplay code references them.
- Test animation cloning separately when multiple character instances are required.

## Framework Integration

- **Three.js:** follow the existing `GLTFLoader` setup and configure optional decoders before loading compressed assets.
- **React Three Fiber:** follow the project's `useGLTF`, Suspense, preload, disposal, and clone conventions; avoid recreating materials or loaders every render.
- **Babylon.js:** follow the existing `SceneLoader`/asset-container pattern and verify animation groups, handedness behavior, and material conversion.

Do not introduce a second asset-loading abstraction when the project already has one. Preserve loading, caching, error, and progress behavior.

## Gameplay and Browser QA

Test at the target desktop and mobile viewports:

- load from a cold refresh and inspect console/network failures;
- verify nonblank canvas pixels and a useful initial camera frame;
- inspect silhouette, scale, ground contact, lighting, shadows, and neighboring asset consistency;
- exercise interactions, collisions, cloning, LOD switching, and all animation states;
- measure frame time, draw calls, visible triangles, GPU memory pressure, and load transfer size with representative scene density;
- check that loading UI, HUD, labels, and controls do not overlap or shift when the model appears.

Capture screenshots of representative gameplay states. A successful isolated model-viewer render is not sufficient.

## Adaptation Ladder

Prefer the least destructive change that reaches the art direction:

1. material color, roughness/metalness, lighting, scale, pose, and visibility;
2. licensed-part composition, accessories, animation reuse, and project-native effects;
3. removal of unused content, texture resizing, LOD, and supported compression;
4. Blender mesh, UV, skinning, or baking work when Blender is installed.

Keep a source copy before destructive edits. Record material changes, removed components, texture processing, animation retargeting, and geometry edits in `THIRD_PARTY_ASSETS.md`.
