// Gobble Dash — the farmer. One job: the chaser's brain (chase, search,
// corner) and how he looks while doing it. He starts behind the turkey and
// closes in on every stumble; hide in a haystack and he loses the trail.
import { GROUND_Y } from './config.js';

export const FARMER_W = 58;
export const FARMER_H = 96;

export function makeFarmer() {
  return {
    x: -40,
    y: GROUND_Y - FARMER_H,
    w: FARMER_W,
    h: FARMER_H,
    state: 'chase',
    searchTime: 0,
    runTime: 0,
    shoutTime: 0,
    /** Distance in px the farmer still has to close to grab the turkey. */
    gap: 170,

    /** The turkey stumbled: the farmer lunges closer and shouts. */
    lunge(amount) {
      this.gap = Math.max(0, this.gap - amount);
      this.shoutTime = 0.8;
    },
    /** The turkey hid: the farmer stops, scratches his head, searches. */
    loseTrail() {
      this.state = 'search';
      this.searchTime = 2.2;
    },
    /** A clean stretch of running lets the turkey pull a little ahead. */
    driftBack(amount) {
      if (this.state === 'chase') this.gap = Math.min(260, this.gap + amount);
    },

    update(dt, turkeyX, turkeyHidden) {
      this.runTime += dt;
      if (this.shoutTime > 0) this.shoutTime -= dt;
      if (this.state === 'search') {
        this.searchTime -= dt;
        if (this.searchTime <= 0) {
          this.state = 'chase';
          this.gap = Math.min(260, this.gap + 90);
        }
      }
      // The farmer runs just behind the turkey: his screen x follows the gap.
      // He never slides fully off the left edge: at least his pitchfork and
      // hat stay in frame, so the chase always reads on screen.
      const targetX = turkeyX - this.gap - this.w + 30;
      this.x += (targetX - this.x) * Math.min(1, dt * 6);
      this.x = Math.max(-35, this.x);
      this.y = GROUND_Y - this.h;
    },

    /** True when the farmer's hands are on the turkey. */
    get caught() {
      return this.state === 'chase' && this.gap <= 0;
    },

    reset() {
      this.x = -40;
      this.y = GROUND_Y - FARMER_H;
      this.gap = 170;
      this.state = 'chase';
      this.searchTime = 0;
      this.runTime = 0;
      this.shoutTime = 0;
    },
  };
}

/** Draw the farmer: overalls, straw hat, red shirt, pitchfork, angry brows. */
export function drawFarmer(ctx, farmer) {
  const bob = Math.abs(Math.sin(farmer.runTime * 9)) * 3;
  const cx = farmer.x + farmer.w / 2;
  const cy = farmer.y + farmer.h / 2 - bob;
  ctx.save();
  ctx.translate(cx, cy);
  // Pitchfork held high.
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(26, 20);
  ctx.lineTo(34, -52);
  ctx.stroke();
  ctx.strokeStyle = '#b8b8b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(28, -52);
  ctx.lineTo(28, -64);
  ctx.moveTo(34, -52);
  ctx.lineTo(34, -64);
  ctx.moveTo(40, -52);
  ctx.lineTo(40, -64);
  ctx.stroke();
  // Legs scissoring.
  const swing = Math.sin(farmer.runTime * 9) * 12;
  ctx.strokeStyle = '#3b4a6b';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(-6 + swing, 44);
  ctx.moveTo(6, 6);
  ctx.lineTo(6 - swing, 44);
  ctx.stroke();
  // Overalls + red shirt.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-18, -22, 36, 30);
  ctx.fillStyle = '#3b4a6b';
  ctx.fillRect(-16, -4, 32, 22);
  ctx.fillRect(-16, -4, 8, 18);
  ctx.fillRect(8, -4, 8, 18);
  // Arms pumping.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-16, -16);
  ctx.lineTo(-26, 4 - swing);
  ctx.moveTo(16, -16);
  ctx.lineTo(24, 8 + swing);
  ctx.stroke();
  // Head, beard, angry brows.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(0, -32, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.ellipse(0, -22, 10, 6, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#1c0f05';
  ctx.fillRect(-9, -38, 7, 3);
  ctx.fillRect(2, -38, 7, 3);
  ctx.beginPath();
  ctx.arc(-5, -33, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -33, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Straw hat.
  ctx.fillStyle = '#e8c95a';
  ctx.beginPath();
  ctx.ellipse(0, -42, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -54, 22, 12);
  ctx.fillStyle = '#a83c2a';
  ctx.fillRect(-11, -45, 22, 4);
  // Shout bubble when he lunges.
  if (farmer.shoutTime > 0) {
    ctx.fillStyle = '#fff3d6';
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(18, -78, 92, 26, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a2412';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COME BACK!', 24, -60);
  }
  ctx.restore();
}
