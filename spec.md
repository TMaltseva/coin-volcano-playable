name: Coin Volcanoes Playable Ad
version: 1.0.0

description: |
  HTML5 playable-ad game with casino-style UX.
  Player selects one of three treasure chests → chest opens → coin burst → win screen.
  All layout must be adaptive and pixel-free. Use clamp everywhere.

engines:
  ui: HTML/CSS
  logic: JavaScript (ES6)
  rendering: PixiJS (optional)
  platform: Mintegral / Unity ads

specs:

  - name: adaptive-visuals
    description: Always use adaptive layout, no px values.
    instructions: |
      - Use clamp() for font-size, margins, paddings, icon sizes.
      - Layout must scale to any aspect ratio.
      - No fixed width/height in px.
      - Use max-width / max-height with object-fit: contain.
      - Use safe-area insets.

  - name: assets
    description: All assets must be loaded from /assets.
    instructions: |
      Required folders:
      /assets/backgrounds
      /assets/ui
      /assets/sprites/chests
      /assets/sprites/coins
      /assets/particles

      Required sprites:
      - chest_idle (png or sprite-sheet)
      - chest_open (sequence)
      - hand_tap
      - coin_spin
      - win_effect

  - name: loading-screen
    description: Create animated loading screen.
    instructions: |
      - Fade-in logo.
      - Breathing animation.
      - Progress bar 0% → 100% (1.5s).
      - Fire particle loop.

  - name: chest-screen
    description: Display 3 chest options.
    instructions: |
      - Place 3 chests horizontally with adaptive spacing.
      - Idle animation loop.
      - On user tap:
        → freeze other chests
        → animate selected chest opening
        → spawn coin burst

  - name: particles
    description: Particle effects for atmosphere.
    instructions: |
      - fire/ember floating particles on background
      - coin burst on win
      - all particles should be lightweight

  - name: win-screen
    description: Final winning screen.
    instructions: |
      - Show “YOU WON!” text with coin count.
      - Add pulsing glow.
      - CTA button: “PLAY NOW”
      - After 2 seconds → auto CTA.

  - name: interactions
    description: User interactions.
    instructions: |
      - Only one tap allowed.
      - Must work on touch devices.
      - Must play instantly (0 delay).

  - name: performance
    description: Optimize for mobile.
    instructions: |
      - Reduce texture size where possible.
      - Use WebP if available.
      - Avoid heavy JS loops.
      - Cap at ~3 MB total bundle.

