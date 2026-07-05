# Backrooms: Path Tracing Experience

A first-person 3D Backrooms-inspired game and rendering experiment built for the browser. This project simulates path tracing-like visual aesthetics (bloom, chromatic aberration, warm color grading, film grain, and vignette) using WebGL and Three.js post-processing.

## Features

- **🏢 Liminal Space Design**: A 40×40 modular room inspired by the yellow corridors and damp carpet of the classic Backrooms lore.
- **💡 Fluorescent Panel Lighting**: 8 recessed ceiling panels with emissive diffusers; 4 of them cast soft PCF shadows (each shadow-casting PointLight renders a 6-face cube map, so shadow casters are budgeted), plus organic flickers and dim zones to build suspense. A warm HemisphereLight fakes ceiling/floor bounce fill.
- **🌊 Sunken Tiled Pool**: A recessed 8×6 swimming pool cut into the carpet floor (ShapeGeometry with a hole), tiled walls, and a custom ShaderMaterial water surface with vertex-displacement waves, Schlick fresnel, and Blinn-Phong glints from the nearest fixtures.
- **🔴 Physics-Enabled Ball**: A red rubber ball (clearcoat physical material) that reacts to gravity, bounces off walls/floors, and floats on the water.
- **🎬 Linear HDR Pipeline**: RenderPass → UnrealBloom (in linear HDR, threshold 1.0 so only emissives bloom) → OutputPass (ACES tone mapping + sRGB) → custom grade pass (chromatic aberration, film grain, vignette, warm grading).
- **🎮 First-Person Controller**: Smooth movement, acceleration/deceleration, sprinting, jumping, wall/pool collision resolution, and swimming (jump at the surface to climb out of the pool).
- **📦 Procedural Asset Generation**: 100% of textures (carpet, wallpaper, tiles, ceiling, dust, and bump maps) are generated programmatically on HTML5 canvases and tagged `SRGBColorSpace`, removing external assets and enabling offline/instant load.

## Raster vs. real path tracing — press P

The game ships **two renderers for the same scene**, and comparing them is the whole point if you're studying rendering:

- **Raster mode** (default): each mesh is projected to the screen and shaded locally, with shadow maps, analytic fog, and post-processing (grain, bloom) imitating the *look* of a path-traced frame.
- **Path tracing mode** (press `P`): [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer) builds a BVH of the scene and progressively shoots rays from the camera, bouncing them around the room and accumulating radiance. The HUD shows the sample count — stand still and watch the Monte Carlo noise melt away as the image converges.

Effects the raster pipeline has to fake become simulation in path tracing mode:

| Effect | Raster mode fakes it with | Path tracing mode |
|---|---|---|
| Soft shadows | `PCFSoftShadowMap` blur | Light sampling over many rays |
| Bounce light (GI) | `HemisphereLight` fill | Diffuse ray bounces (`bounces: 6`) |
| Water reflections | Fresnel + hardcoded "ceiling color" | Specular rays hitting the actual ceiling |
| Water refraction | Semi-transparent alpha blend | Real `ior: 1.33` refraction + Beer-Lambert absorption |
| Film grain | Post-process noise | Monte Carlo variance (unconverged samples) |

Implementation notes (`src/pathtracing.js`):

- Dust particles (`THREE.Points`) and the water's custom `ShaderMaterial` can't be path traced, so on toggle the dust is hidden and the water swaps to a transmissive `MeshPhysicalMaterial`; both are restored on toggle-off.
- Dynamic objects (ball, water waves, light flicker) freeze while path tracing — moving geometry would invalidate the BVH every frame. Walking is allowed: each camera move restarts accumulation at low res (`dynamicLowRes`).
- Tune `renderScale` (default 0.5) and `bounces` (default 6) in `src/pathtracing.js` for your GPU. Fog and the HemisphereLight are ignored by the path tracer — the GI those were faking now comes from actual light transport.

## Controls

- **W, A, S, D** — Move
- **Mouse** — Look around
- **Shift** — Sprint
- **Space** — Jump (also climbs out of the pool from the water surface)
- **E** — Pick up the red ball (when close)
- **Left Click** — Throw the ball (when holding)
- **P** — Toggle real path tracing on/off
- **Esc** — Release mouse lock to reveal menu

> Tip: appending `?debug` to the URL exposes `window.__debug` (camera, scene, renderer, composer) in the console for experimentation.

## Architecture & Code Structure

The project is structured modularly using native ES modules without requiring heavy build steps or bundlers, mapped via native importmaps:

```
game-backroom-path/
├── index.html          # HTML entry point, importmap, UI overlays & HUD
├── style.css           # UI Glassmorphism styles, vignette, and CRT filter
├── game.js             # Main orchestrator entry point
└── src/
    ├── config.js       # Centralized global state, boundaries, and variables
    ├── textures.js     # Canvas-based procedural texture generators
    ├── room.js         # Room and wall geometry construction
    ├── lights.js       # Fluorescent fixtures & flicker logic
    ├── pool.js         # Sunken pool construction & water ShaderMaterial
    ├── ball.js         # Ball geometry, interaction, and custom physics
    ├── props.js        # Cardboard boxes and folding chair meshes
    ├── particles.js    # Floating dust motes particle system
    ├── player.js       # Movement, gravity, swimming, and collision resolution
    ├── input.js        # Keyboard & mouse event listener setups
    ├── pathtracing.js  # Real progressive path tracing mode (three-gpu-pathtracer)
    └── postprocessing.js # EffectComposer pipeline and BackroomsPostShader
```

## Running Locally

To run the game, simply serve the root directory using any local web server:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Open [http://localhost:8080](http://localhost:8080) in your web browser.
