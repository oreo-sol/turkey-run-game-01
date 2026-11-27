// Gobble Dash — entry point. One job: own the canvas, the frame loop and
// the screen state machine, and wire input, sound and the world together.
// ?shot=title|play|kitchen|end renders one staged scene for screenshots.
import { VIEW_W, VIEW_H } from './config.js';
import { makeAudio } from './audio.js';
import { makeInput } from './input.js';
import { makeWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_OVER, SCREEN_ESCAPED, EVENT_OVER, EVENT_ESCAPED } from './world.js';
import { drawFrame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '20261127');
const shotName = params.get('shot');
const world = makeWorld(seed);
const audio = makeAudio();
const input = makeInput(canvas);

let scrollX = 0;
let lastTime = performance.now();
let shotStaged = false;

/** Keep the canvas at the game's 960x540 view, scaled to the window. */
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/** Announce state changes for screen readers. */
function announce(text) {
  status.textContent = text;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (shotName) {
    if (!shotStaged) {
      const staged = stageShot(shotName, world);
      world.screen = staged.screen;
      world.best = staged.best;
      shotStaged = true;
    }
    drawFrame(ctx, world, scrollX);
    return;
  }

  if (input.takeMute()) {
    const muted = audio.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }

  if (world.screen === SCREEN_TITLE) {
    if (input.takeStart()) {
      audio.unlock();
      audio.gobble();
      audio.startMusic();
      world.startRun();
      announce('Run! Jump the fences, duck the knives, outrun the farmer.');
    }
  } else if (world.screen === SCREEN_PLAY) {
    if (input.takePause()) {
      world.screen = SCREEN_PAUSE;
      audio.stopMusic();
      announce('Paused.');
    } else {
      const intent = {
        jump: input.takeJump(),
        duck: input.ducking,
      };
      const event = world.step(dt, intent, audio);
      scrollX += world.speed * dt;
      if (event & EVENT_OVER) {
        world.best = Math.max(world.best, Math.floor(world.score));
        announce(`Caught! You ran ${Math.floor(world.distance)} metres. Press Space to run again.`);
      } else if (event & EVENT_ESCAPED) {
        announce(`Escaped! You ran 1,200 metres in ${world.time.toFixed(1)} seconds. Press Space to run again.`);
      }
    }
  } else if (world.screen === SCREEN_PAUSE) {
    if (input.takePause() || input.takeStart()) {
      world.screen = SCREEN_PLAY;
      audio.startMusic();
      announce('Running again.');
    }
  } else if (world.screen === SCREEN_OVER || world.screen === SCREEN_ESCAPED) {
    if (input.takeStart()) {
      audio.click();
      audio.startMusic();
      world.startRun();
      announce('Run! Jump the fences, duck the knives, outrun the farmer.');
    }
  }

  input.endFrame();
  drawFrame(ctx, world, scrollX);
  requestAnimationFrame(frame);
}

// Draw one frame at once, right now, so the first paint does not have to
// wait for the compositor's first animation frame (headless screenshots
// take the page as loaded, and a shot scene must already be on the canvas).
frame(performance.now());
requestAnimationFrame(frame);
