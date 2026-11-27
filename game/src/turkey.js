// Gobble Dash — the turkey. One job: the player's body, its jump /
// double-jump / duck / hide physics, and how it looks mid-run.
import { GROUND_Y, GRAVITY, JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY } from './config.js';

export const TURKEY_W = 56;
export const TURKEY_H = 58;
export const TURKEY_DUCK_H = 34;

export function makeTurkey() {
  return {
    x: 150,
    y: GROUND_Y - TURKEY_H,
    w: TURKEY_W,
    h: TURKEY_H,
    vy: 0,
    grounded: true,
    jumpsUsed: 0,
    ducking: false,
    hiding: false,
    invulnerable: 0,
    runTime: 0,
    stumbleTime: 0,
    /** The turkey's feet on the ground line. */
    get feetY() { return this.y + this.h; },
    /** Centre x, for pickups and the farmer's reach. */
    get centreX() { return this.x + this.w / 2; },

    /** Start a jump, or a double jump while airborne. Returns 'jump' | 'double' | null. */
    jump() {
      if (this.hiding) return null;
      if (this.grounded) {
        this.vy = JUMP_VELOCITY;
        this.grounded = false;
        this.jumpsUsed = 1;
        return 'jump';
      }
      if (this.jumpsUsed < 2) {
        this.vy = DOUBLE_JUMP_VELOCITY;
        this.jumpsUsed = 2;
        return 'double';
      }
      return null;
    },

    /** Duck low (or stay ducked) while `down` is held. */
    setDuck(down) {
      this.ducking = down && this.grounded && !this.hiding;
      this.h = this.ducking ? TURKEY_DUCK_H : TURKEY_H;
      // Always re-seat the turkey on the ground when grounded: standing up
      // after a duck must lift the body back to full height, not leave it
      // sunk 24 px into the dirt with a shifted hitbox.
      if (this.grounded) this.y = GROUND_Y - this.h;
    },

    /** Slip into a haystack to hide from the farmer. */
    hide() {
      this.hiding = true;
      this.ducking = false;
      this.h = TURKEY_DUCK_H;
      this.y = GROUND_Y - this.h;
    },
    unhide() {
      this.hiding = false;
      this.h = TURKEY_H;
      this.y = GROUND_Y - this.h;
    },

    /** A hit that costs a life: brief stumble, brief invulnerability. */
    stumble() {
      this.stumbleTime = 0.55;
      this.invulnerable = 1.4;
    },

    update(dt, speed) {
      this.runTime += dt * (0.6 + speed / 400);
      if (this.stumbleTime > 0) this.stumbleTime -= dt;
      if (this.invulnerable > 0) this.invulnerable -= dt;
      if (!this.grounded) {
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;
        if (this.y >= GROUND_Y - this.h) {
          this.y = GROUND_Y - this.h;
          this.vy = 0;
          this.grounded = true;
          this.jumpsUsed = 0;
        }
      }
    },

    reset() {
      this.x = 150;
      this.y = GROUND_Y - TURKEY_H;
      this.w = TURKEY_W;
      this.h = TURKEY_H;
      this.vy = 0;
      this.grounded = true;
      this.jumpsUsed = 0;
      this.ducking = false;
      this.hiding = false;
      this.invulnerable = 0;
      this.runTime = 0;
      this.stumbleTime = 0;
    },
  };
}

/** Draw the turkey at its current pose: running legs, fanned tail, red wattle. */
export function drawTurkey(ctx, turkey) {
  if (turkey.invulnerable > 0 && Math.floor(turkey.invulnerable * 12) % 2 === 0) return;
  const bob = turkey.grounded && !turkey.ducking ? Math.sin(turkey.runTime * 10) * 3 : 0;
  const cx = turkey.x + turkey.w / 2;
  const cy = turkey.y + turkey.h / 2 + bob;
  ctx.save();
  ctx.translate(cx, cy);
  if (turkey.stumbleTime > 0) ctx.rotate(-0.25);
  // Tail fan: five autumn feathers.
  const tailColors = ['#b5651d', '#d98e32', '#c0392b', '#e8a33d', '#8a5a2b'];
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i - 2) * 0.32;
    ctx.save();
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(-26, 0, 7, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8f5a2b';
  ctx.beginPath();
  ctx.ellipse(2, 8, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#5d3413';
  ctx.beginPath();
  ctx.ellipse(-2, 2, 14, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  ctx.fillStyle = '#a86a3a';
  ctx.fillRect(14, -22, 10, 24);
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath();
  ctx.arc(20, -24, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, wattle, eye.
  ctx.fillStyle = '#f5b301';
  ctx.beginPath();
  ctx.moveTo(28, -26);
  ctx.lineTo(40, -22);
  ctx.lineTo(28, -18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(26, -14, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c0f05';
  ctx.beginPath();
  ctx.arc(23, -27, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(24, -28, 1, 0, Math.PI * 2);
  ctx.fill();
  // Legs: two orange sticks scissoring while running.
  if (turkey.grounded && !turkey.ducking) {
    const swing = Math.sin(turkey.runTime * 10) * 10;
    ctx.strokeStyle = '#e8862e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, 20);
    ctx.lineTo(-6 + swing, 30);
    ctx.moveTo(6, 20);
    ctx.lineTo(6 - swing, 30);
    ctx.stroke();
  }
  ctx.restore();
}
