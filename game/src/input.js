// Gobble Dash — keyboard, mouse and touch input. One job: turn presses into
// named intents (jump / duck / hide / start / restart / pause / mute) and
// remember them until the game reads them, so a press is never lost between
// frames.
export function makeInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointerDown = false;

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
  const START_KEYS = new Set(['Enter', 'Space', 'ArrowUp', 'KeyW']);

  function onKeyDown(event) {
    if (event.repeat) return;
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
    held.add(event.code);
    pressed.add(event.code);
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onPointerDown(event) {
    event.preventDefault();
    pointerDown = true;
    pressed.add('Pointer');
  }
  function onPointerUp() {
    pointerDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  function has(keys) {
    for (const key of keys) if (pressed.has(key)) return true;
    return false;
  }

  return {
    /** True while any duck key (or pointer) is held down. */
    get ducking() {
      return has(DUCK_KEYS) || pointerDown;
    },
    /** Consume one jump press since the last frame. */
    takeJump() {
      if (has(JUMP_KEYS) || pressed.has('Pointer')) {
        pressed.clear();
        return true;
      }
      return false;
    },
    /** Consume one start/restart press since the last frame. */
    takeStart() {
      if (has(START_KEYS) || pressed.has('Pointer')) {
        pressed.clear();
        return true;
      }
      return false;
    },
    /** Consume one pause press (P or Escape). */
    takePause() {
      if (pressed.has('KeyP') || pressed.has('Escape')) {
        pressed.delete('KeyP');
        pressed.delete('Escape');
        return true;
      }
      return false;
    },
    /** Consume one mute press (M). */
    takeMute() {
      if (pressed.has('KeyM')) {
        pressed.delete('KeyM');
        return true;
      }
      return false;
    },
    /** Clear all pending presses (used on state changes). */
    clear() {
      pressed.clear();
      held.clear();
      pointerDown = false;
    },
    /** Forget presses older than this frame. */
    endFrame() {
      pressed.clear();
    },
  };
}
