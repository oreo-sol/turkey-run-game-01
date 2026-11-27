// Gobble Dash — the world. One job: the run's state and its rules — how far
// the turkey has run, what the farmer does, what a collision costs, and
// when the run ends caught or escaped.
import {
  ESCAPE_DISTANCE,
  START_LIVES,
  FARMER_START_GAP,
  stageAt,
  speedAt,
} from './config.js';
import { makeTurkey } from './turkey.js';
import { makeFarmer } from './farmer.js';
import { makeObstacles, KIND, overlaps } from './obstacles.js';
import { makeRng } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

export const EVENT_NONE = 0;
export const EVENT_OVER = 1;
export const EVENT_ESCAPED = 2;

export function makeWorld(seed) {
  const rng = makeRng(seed || 20261127);
  const turkey = makeTurkey();
  const farmer = makeFarmer();
  const obstacles = makeObstacles(rng);
  const world = {
    turkey,
    farmer,
    obstacles,
    screen: SCREEN_TITLE,
    distance: 0,
    score: 0,
    corn: 0,
    lives: START_LIVES,
    best: 0,
    time: 0,
    message: '',
    messageTime: 0,
    stageName: 'FARMYARD',
    /** True while the turkey is hidden inside a haystack. */
    get hidden() { return turkey.hiding; },
    get stage() { return stageAt(this.distance); },
    get speed() { return speedAt(this.distance); },

    reset() {
      turkey.reset();
      farmer.reset();
      farmer.gap = FARMER_START_GAP;
      obstacles.reset();
      this.distance = 0;
      this.score = 0;
      this.corn = 0;
      this.lives = START_LIVES;
      this.time = 0;
      this.message = '';
      this.messageTime = 0;
      this.stageName = 'FARMYARD';
      this.screen = SCREEN_TITLE;
    },

    startRun() {
      this.reset();
      this.screen = SCREEN_PLAY;
    },

    /** Show a short floating message ("SPOTTED!", "+10", ...). */
    flash(text) {
      this.message = text;
      this.messageTime = 1.4;
    },

    /** The turkey hit something solid: lose a life, the farmer lunges. */
    hitHazard(item) {
      if (turkey.invulnerable > 0 || turkey.hiding) return false;
      item.active = false;
      this.lives -= 1;
      turkey.stumble();
      farmer.lunge(85);
      this.flash(this.lives > 0 ? 'OUCH! THE FARMER IS CLOSER!' : 'CAUGHT!');
      return true;
    },

  };

  /** One fixed step of the run. `intent` carries the player's jump / duck
   *  for this step; returns an event bitmask. */
  world.step = function step(dt, intent, sounds) {
    if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
    world.time += dt;
    if (world.messageTime > 0) world.messageTime -= dt;
    const stage = world.stage;
    if (stage.name !== world.stageName) {
      world.stageName = stage.name;
      world.flash(stage.name === 'THE KITCHEN' ? 'THE KITCHEN! DODGE THE OVEN!' : `NOW: ${stage.name}`);
      if (sounds) sounds.shout();
    }
    const speed = world.speed;
    world.distance += (speed * dt) / 50;
    world.score += speed * dt * 0.05;

    // Player intent.
    if (intent && intent.jump) {
      const kind = turkey.jump();
      if (kind === 'jump' && sounds) sounds.jump();
      if (kind === 'double' && sounds) sounds.doubleJump();
    }
    turkey.setDuck(Boolean(intent && intent.duck));
    turkey.update(dt, speed);

    // The farmer keeps pace behind; a clean stretch lets the turkey pull away.
    farmer.driftBack(6 * dt);
    farmer.update(dt, turkey.x, turkey.hiding);

    // Hide: ducking inside a haystack makes the farmer lose the trail.
    let nearHay = null;
    for (const item of obstacles.items) {
      if (item.active && item.kind === KIND.HAY && Math.abs(item.x - turkey.x) < 70) nearHay = item;
    }
    if (nearHay && intent && intent.duck && turkey.grounded && !turkey.hiding) {
      turkey.hide();
      farmer.loseTrail();
      world.flash('HIDDEN! THE FARMER LOST YOU!');
      if (sounds) sounds.feather();
    }
    if (turkey.hiding && (!intent || !intent.duck || !nearHay)) {
      turkey.unhide();
    }

    obstacles.update(dt, speed, stage);

    // Collisions.
    for (const item of obstacles.items) {
      if (!item.active) continue;
      if (item.kind === KIND.CORN || item.kind === KIND.FEATHER) {
        if (overlaps(turkey, item)) {
          item.active = false;
          if (item.kind === KIND.CORN) {
            world.score += 10;
            world.corn += 1;
            if (sounds) sounds.corn();
          } else {
            world.score += 50;
            world.flash('+50 GOLDEN FEATHER!');
            if (sounds) sounds.feather();
          }
        }
        continue;
      }
      if (item.kind === KIND.HAY) continue;
      if (item.kind === KIND.PUDDLE) {
        if (overlaps(turkey, item) && turkey.grounded) {
          item.active = false;
          world.score = Math.max(0, world.score - 5);
          world.flash('SPLASH! SLOWED DOWN!');
          farmer.lunge(30);
        }
        continue;
      }
      if (overlaps(turkey, item)) {
        if (item.kind === KIND.KNIFE && sounds) sounds.whizz();
        const hit = world.hitHazard(item);
        if (hit && sounds) sounds.stumble();
        if (world.lives <= 0) {
          world.screen = SCREEN_OVER;
          if (sounds) { sounds.caught(); sounds.stopMusic(); }
          return EVENT_OVER;
        }
      }
    }

    // The farmer caught up.
    if (farmer.caught) {
      world.screen = SCREEN_OVER;
      if (sounds) { sounds.shout(); sounds.caught(); sounds.stopMusic(); }
      return EVENT_OVER;
    }

    // Freedom: the woods past the kitchen.
    if (world.distance >= ESCAPE_DISTANCE) {
      world.screen = SCREEN_ESCAPED;
      world.best = Math.max(world.best, Math.floor(world.score));
      if (sounds) { sounds.escaped(); sounds.stopMusic(); }
      return EVENT_ESCAPED;
    }
    return EVENT_NONE;
  };

  return world;
}
