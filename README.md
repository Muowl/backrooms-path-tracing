# Backrooms: Path Tracing Experience

A first-person 3D Backrooms-inspired game and rendering experiment built for the browser. This project simulates path tracing-like visual aesthetics (bloom, chromatic aberration, warm color grading, film grain, and vignette) using WebGL and Three.js post-processing.

## Features

- **🏢 Liminal Space Design**: A 40×40 modular room inspired by the yellow corridors and damp carpet of the classic Backrooms lore.
- **💡 Volumetric Lighting**: 8 ceiling-mounted fluorescent lights casting soft shadows (`PCFSoftShadowMap`), with organic flickers and dim zones to build suspense.
- **🌊 Sunken Tiled Pool**: A recessed 8×6 swimming pool with tiled walls and a custom ShaderMaterial water surface with animated vertex displacement waves and caustic shimmer.
- **🔴 Physics-Enabled Ball**: A red rubber ball that reacts to gravity, bounces off walls/floors, and floats realistically on the water.
- **🎬 Cinematic Post-Processing**: Consolidates chromatic aberration, film grain noise (to mimic path-tracer raw output), vignette, and warm color grading into a single custom ShaderPass for high performance.
- **🎮 First-Person Controller**: Smooth movement, acceleration/deceleration, sprinting, jumping, and wall/pool boundaries collision resolution.
- **📦 Procedural Asset Generation**: 100% of textures (carpet, wallpaper, tiles, ceiling, dust, and bump maps) are generated programmatically on HTML5 canvases, removing external assets and enabling offline/instant load.

## Controls

- **W, A, S, D** — Move
- **Mouse** — Look around
- **Shift** — Sprint
- **Space** — Jump
- **E** — Pick up the red ball (when close)
- **Left Click** — Throw the ball (when holding)
- **Esc** — Release mouse lock to reveal menu

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
    ├── player.js       # Movement, gravity, and collision resolution
    ├── input.js        # Keyboard & mouse event listener setups
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
