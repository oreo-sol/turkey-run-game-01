// Gobble Dash — tuning, palette and stage table. One job: every number the
// rest of the game reads, in one place, so the run can be tuned without
// touching the rules.
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 452;
export const GRAVITY = 2400;
export const JUMP_VELOCITY = -1150;
export const DOUBLE_JUMP_VELOCITY = -820;
export const RUN_SPEED_START = 300;
export const RUN_SPEED_MAX = 560;
export const ESCAPE_DISTANCE = 1200;
export const START_LIVES = 3;
export const FARMER_CATCH_GAP = 0;
export const FARMER_START_GAP = 170;
export const FARMER_MAX_GAP = 260;

// Autumn palette: cream sky, amber fields, deep brown barn, hot kitchen red.
export const PALETTE = {
  skyTop: '#f7dfa8',
  skyMid: '#f2b96b',
  skyBottom: '#e08a4e',
  kitchenSkyTop: '#f2c14e',
  kitchenSkyMid: '#d97b3f',
  kitchenSkyBottom: '#8f3b2a',
  ground: '#a06a35',
  groundDark: '#7d4f24',
  grass: '#c98f3d',
  fence: '#6e4520',
  barnRed: '#a83c2a',
  barnDark: '#7e2a1d',
  cream: '#fff3d6',
  ink: '#3a2412',
  red: '#c0392b',
  gold: '#f5b301',
  leaf: '#7a9b3a',
};

// Stages grow harder as the turkey runs from the farmyard to the kitchen.
// Each stage names its backdrop, its hazards and how fast the run gets.
export const STAGES = [
  {
    name: 'FARMYARD',
    from: 0,
    to: 400,
    speed: 300,
    spawnEvery: [0.95, 1.45],
    hazards: ['fence', 'puddle', 'hay'],
    pickups: ['corn', 'corn', 'feather'],
    sky: 'farm',
  },
  {
    name: 'CORNFIELD',
    from: 400,
    to: 900,
    speed: 380,
    spawnEvery: [1.0, 1.45],
    hazards: ['fence', 'pumpkin', 'hay', 'knife'],
    pickups: ['corn', 'corn', 'corn', 'feather'],
    sky: 'farm',
  },
  {
    name: 'THE KITCHEN',
    from: 900,
    to: 1200,
    speed: 460,
    spawnEvery: [0.65, 1.05],
    hazards: ['oven', 'knife', 'pot', 'fence'],
    pickups: ['corn', 'corn', 'feather'],
    sky: 'kitchen',
  },
];

/** The stage the turkey is running through at `distance` metres. */
export function stageAt(distance) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distance >= STAGES[i].from) return STAGES[i];
  }
  return STAGES[0];
}

/** Speed in px/s at `distance`, rising smoothly inside each stage. */
export function speedAt(distance) {
  const stage = stageAt(distance);
  const next = STAGES[Math.min(STAGES.indexOf(stage) + 1, STAGES.length - 1)];
  const span = stage.to - stage.from;
  const t = span > 0 ? Math.min(1, Math.max(0, (distance - stage.from) / span)) : 0;
  return stage.speed + (next.speed - stage.speed) * t;
}
