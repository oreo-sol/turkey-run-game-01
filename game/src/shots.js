// Gobble Dash — the screenshot scenes behind ?shot=title|play|kitchen|end.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot (jump the fence, duck the
// knife, hide in the hay when the farmer is close), so the frame is what a
// real game looks like and the same seed always gives the same frame.
import { KIND } from './obstacles.js';
import { SCREEN_OVER, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE, EVENT_OVER, EVENT_ESCAPED } from './world.js';

const SAMPLE = 1 / 60;
const TITLE_SECONDS = 2;
const PLAY_SECONDS = 14;
const KITCHEN_TARGET_M = 940;
const END_LIMIT_SECONDS = 240;

/** The autopilot's intent for this step, given the world and its skill.
 *  Jumpable hazards and knives are judged separately: a knife right behind
 *  a fence must not hide the fence, and ducking under a knife must not
 *  stop the turkey jumping the pumpkin behind it. */
export function autopilot(world, skill, prev) {
  const turkey = world.turkey;
  const intent = { jump: false, duck: false };
  let jumpable = null;
  let jumpableDist = Infinity;
  let knifeDist = Infinity;
  let hayDist = Infinity;
  for (const item of world.obstacles.items) {
    if (!item.active) continue;
    // Pickups are not hazards: a corn cob must never hide the fence behind it.
    if (item.kind === KIND.CORN || item.kind === KIND.FEATHER) continue;
    const dist = item.x - (turkey.x + turkey.w);
    // An item has only truly passed when its right edge clears the turkey's
    // left edge: a knife at dist -11 still overlaps the turkey by 11 px, so
    // cutting the scan off at -10 lets the turkey stand up into it.
    if (dist < -(item.w + turkey.w) || dist > 480) continue;
    if (item.kind === KIND.KNIFE) {
      if (dist < knifeDist) knifeDist = dist;
    } else if (item.kind === KIND.HAY) {
      if (dist < hayDist) hayDist = dist;
    } else if (dist < jumpableDist) {
      jumpableDist = dist;
      jumpable = item;
    }
  }
  if (knifeDist < 200) intent.duck = true;
  if (hayDist < 60 && world.farmer.gap < 130) intent.duck = true;
  if (jumpable) {
    // Jump by time to impact, not distance: pumpkins roll in faster than
    // fences slide in, so they need an earlier jump at the same distance.
    const approach = world.speed + (jumpable.kind === KIND.PUMPKIN ? 90 : 0);
    const timeToHit = jumpableDist / approach;
    // Never jump into a knife: if one is close ahead, stay low and duck
    // under it instead, then jump the hazard once the knife has passed.
    const knifeInTheWay = knifeDist < 260 && knifeDist > 0;
    if (timeToHit < 0.5 * skill && turkey.grounded && !knifeInTheWay) intent.jump = true;
  }
  // Only signal the jump on its rising edge, so the turkey does not burn
  // its double jump the step after leaving the ground.
  const jump = intent.jump && !prev.jump;
  prev.jump = intent.jump;
  prev.duck = intent.duck;
  return { jump, duck: intent.duck };
}

/**
 * Set `world` to the named scene (title, play, kitchen or end; any other
 * name is title) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  world.reset();
  const prev = { jump: false, duck: false };
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    world.screen = SCREEN_TITLE;
    for (let i = 0; i < TITLE_SECONDS / SAMPLE; i += 1) {
      world.turkey.update(SAMPLE, 300);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.startRun();
  if (name === 'play') {
    for (let i = 0; i < PLAY_SECONDS / SAMPLE; i += 1) {
      const event = world.step(SAMPLE, autopilot(world, 1, prev), null);
      if (event & EVENT_OVER || event & EVENT_ESCAPED) break;
    }
    return { screen: world.screen === SCREEN_PLAY ? SCREEN_PLAY : world.screen, best: world.best };
  }
  if (name === 'kitchen') {
    for (let i = 0; i < (KITCHEN_TARGET_M * 50) / 300 / SAMPLE; i += 1) {
      if (world.distance >= KITCHEN_TARGET_M) break;
      const event = world.step(SAMPLE, autopilot(world, 1, prev), null);
      if (event & EVENT_OVER || event & EVENT_ESCAPED) break;
    }
    // Keep running a few seconds more until an oven is in frame: the
    // kitchen shot should show the oven, the stage's signature danger.
    // Still real gameplay — just the moment the camera stops at.
    for (let i = 0; i < 8 / SAMPLE; i += 1) {
      const ovenInFrame = world.obstacles.items.some(
        (item) => item.active && item.kind === KIND.OVEN && item.x > 260 && item.x < 820,
      );
      if (ovenInFrame) break;
      const event = world.step(SAMPLE, autopilot(world, 1, prev), null);
      if (event & EVENT_OVER || event & EVENT_ESCAPED) break;
    }
    // Nudge the farmer close so the danger reads in one frame.
    world.farmer.lunge(70);
    return { screen: world.screen === SCREEN_PLAY ? SCREEN_PLAY : world.screen, best: world.best };
  }
  // end: a clumsy pilot that jumps too late, so the farmer catches the turkey.
  for (let i = 0; i < END_LIMIT_SECONDS / SAMPLE; i += 1) {
    const event = world.step(SAMPLE, autopilot(world, 0.35, prev), null);
    if (event & EVENT_OVER) break;
    if (event & EVENT_ESCAPED) break;
  }
  const over = world.screen === SCREEN_OVER;
  return { screen: over ? SCREEN_OVER : SCREEN_ESCAPED, best: world.best };
}
