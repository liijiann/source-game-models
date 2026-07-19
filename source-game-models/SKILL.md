---
name: source-game-models
description: Source, license-check, adapt, and integrate free third-party 3D models for Web 3D games built with Three.js, React Three Fiber, or Babylon.js. Use when building or improving 3D game characters, props, vehicles, buildings, environments, creatures, rigged models, or animation assets; when primitive geometry or hand-built placeholder meshes would otherwise become final art; or when evaluating, importing, optimizing, and visually unifying glTF/GLB assets.
---

# Source Game Models

Use existing, legally reusable 3D assets as the starting point for final game art. Treat primitive geometry as temporary scaffolding unless the project explicitly calls for an abstract geometric style.

## Non-Negotiable Rules

- Search before modeling a final character, recognizable object, vehicle, building, or environment prop.
- Use only free assets with a current, asset-specific license that permits the intended project use and modifications.
- Reject unknown provenance, ripped assets, preview-only models, no-derivatives licenses, noncommercial licenses for commercial-friendly projects, editorial-only assets, and unclear terms.
- Present 2-5 qualified candidates and wait for the user's choice before downloading. Skip this pause only when the user explicitly delegates the selection.
- Never log in, create an account, accept new terms, bypass access controls, or purchase anything for the user.
- Preserve provenance and attribution. Do not redistribute source assets separately unless their license explicitly allows it.
- Do not declare the art complete while debug primitives still stand in for intended final models.

## Workflow

### 1. Establish the Art and Runtime Target

Inspect the project and any references before searching. Record:

- subject, role, silhouette, proportions, and camera distance;
- art style, palette, material response, and detail density;
- framework and loader already in use;
- target devices, scene density, animation needs, and existing performance budget;
- required format, preferring `.glb`, then self-contained `.gltf`.

If the project does not establish a material preference, favor PBR metal/rough assets that can be recolored without repainting every texture. If the art direction is ambiguous and materially changes the search, ask for a reference or a short style choice before searching.

### 2. Search and Apply the License Gate

Read [references/source-catalog.md](references/source-catalog.md) before searching. Search reputable libraries first, using subject synonyms plus style, rigging, animation, and format terms.

Verify each candidate on its live asset page. Search snippets, collection-wide assumptions, filenames, and third-party reposts are not license evidence. A candidate passes only when all of these are known:

- original asset page and identifiable creator or publisher;
- free download availability;
- exact license or governing terms;
- permission for the intended project use and derivative modification;
- attribution requirements;
- an obtainable format and a plausible Web 3D performance profile.

### 3. Present Candidates Before Downloading

Aim to show 2-5 candidates in a compact comparison with these fields. If only one candidate survives the license and technical gates, show that one and explain the search limitation; never pad the table with unverified or unsuitable assets.

| Candidate | Preview/link | Author/source | License | Format | Rig/animation | Technical notes | Proposed adaptation |
| --- | --- | --- | --- | --- | --- | --- | --- |

Include known mesh, texture, and file-size information. Mark unavailable information as `unknown`; do not invent it. Explain exclusions when a visually strong option fails licensing or technical checks. Recommend one candidate based on art fit first, then silhouette/detail, technical fit, editability, and performance.

Stop for selection unless autonomous selection was explicitly authorized. Login-required candidates may be shown, but prefer an equally suitable no-login option.

### 4. Download and Preserve Evidence

Download only from the creator or authorized distribution page after selection. Use the project's existing asset layout. Keep the original license file when supplied and preserve an unmodified source copy when practical.

Create or update `THIRD_PARTY_ASSETS.md` in the target project with one row per asset:

| Asset | Author | Source URL | License and URL | Accessed | Local file | Modifications | Attribution text |
| --- | --- | --- | --- | --- | --- | --- | --- |

Use an ISO date for `Accessed`. Record the pack name when the model comes from a bundle. Never use a preview renderer, cached viewer payload, shipped game, or unrelated mirror as a download source.

### 5. Audit Before Integration

Read [references/web-3d-quality.md](references/web-3d-quality.md). Run the bundled inspector before writing loader code:

```bash
node <skill-dir>/scripts/inspect_gltf.mjs path/to/model.glb
node <skill-dir>/scripts/inspect_gltf.mjs path/to/model.glb --json
```

Pass project-specific limits when known:

```bash
node <skill-dir>/scripts/inspect_gltf.mjs model.glb --max-triangles 120000 --max-file-mb 20
```

Treat inspector warnings as triage signals, not automatic license or quality decisions. Confirm missing files, required decoder extensions, texture cost, scale, pivot, orientation, materials, skeleton, clips, and visible defects in the renderer.

### 6. Adapt in Layers

Make the smallest modification that achieves a coherent result:

1. **Runtime styling:** adjust palette, material parameters, scale, pose, shadows, and mesh visibility.
2. **Composition:** combine licensed parts, add or remove accessories, reuse compatible animation clips, and add project-native particles or effects.
3. **Asset optimization:** remove unused nodes or animations, resize textures, and apply compression only when the project already supports the required decoders.
4. **DCC editing:** use Blender for topology, UV, rig, weight, or baked-texture changes only when Blender is installed and the change is actually needed.

Do not claim mesh, UV, or rig edits were performed when no suitable DCC tool is available. Do not add Blender as a mandatory dependency for runtime-only changes.

### 7. Integrate and Verify in the Real Scene

Follow the project's existing Three.js, React Three Fiber, or Babylon.js loading pattern. Verify the actual gameplay view, not an isolated model viewer:

- model and all textures load without console or network errors;
- framing, scale, ground contact, collision proxy, and interaction match gameplay;
- materials, lighting, shadows, and silhouette fit neighboring assets;
- every required animation plays, loops, transitions, and resets correctly;
- loading behavior and frame time are acceptable on desktop and mobile targets;
- responsive screenshots contain no blank canvas, clipping, or UI overlap;
- `THIRD_PARTY_ASSETS.md` is complete and required attribution is visible in the shipped credits or documentation.

Use browser automation and screenshots when available. For canvas games, also check that the rendered canvas contains meaningful non-background pixels.

## Failure and Completion Rules

If no candidate passes, report the sites and queries searched, list the decisive rejection reasons, and ask whether to broaden the visual style or technical constraints. Do not silently substitute a low-quality primitive model.

Complete the task only when the selected model is licensed, recorded, technically inspected, integrated, visibly adapted to the art direction, and verified in the gameplay scene. Report what was verified and any remaining device, animation, or licensing uncertainty.
