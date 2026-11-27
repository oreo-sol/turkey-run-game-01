// Gobble Dash — hazards and pickups. One job: what spawns ahead of the
// turkey, how each thing moves, and what happens when the turkey meets it.
// Fences and ovens are jumped, puddles and pumpkins are jumped or dodged,
// knives fly at head height (duck under them), haystacks hide the turkey.
import { GROUND_Y, VIEW_W } from './config.js';

export const KIND = {
  FENCE: 'fence',
  PUDDLE: 'puddle',
  HAY: 'hay',
  PUMPKIN: 'pumpkin',
  KNIFE: 'knife',
  OVEN: 'oven',
  POT: 'pot',
  CORN: 'corn',
  FEATHER: 'feather',
};

const SIZES = {
  fence: { w: 34, h: 52 },
  puddle: { w: 90, h: 14 },
  hay: { w: 74, h: 58 },
  pumpkin: { w: 46, h: 42 },
  knife: { w: 44, h: 12 },
  oven: { w: 84, h: 96 },
  pot: { w: 40, h: 30 },
  corn: { w: 30, h: 34 },
  feather: { w: 26, h: 30 },
};

export function makeObstacles(rng) {
  return {
    items: [],
    spawnTimer: 1.1,

    reset() {
      this.items = [];
      this.spawnTimer = 1.1;
    },

    /** Pick the next thing to spawn for this stage, spaced so jumps stay fair. */
    spawn(stage, speed) {
      let kind = rng.pick(stage.hazards);
      // A knife thrown right behind a fence, puddle or pumpkin would reach
      // the turkey while it is still mid-jump over that hazard, with no
      // fair dodge: knives only spawn when no jumpable hazard is close
      // behind the spawn point. A corn trail takes the knife's place.
      const JUMPABLE = [KIND.FENCE, KIND.PUDDLE, KIND.PUMPKIN, KIND.OVEN, KIND.POT];
      if (kind === KIND.KNIFE) {
        const blocked = this.items.some(
          (item) => item.active && JUMPABLE.includes(item.kind) && item.x > VIEW_W + 60 - 520,
        );
        if (blocked) kind = KIND.CORN;
      }
      const size = SIZES[kind];
      const item = {
        kind,
        x: VIEW_W + 60,
        y: GROUND_Y - size.h,
        w: size.w,
        h: size.h,
        vy: 0,
        vx: 0,
        spin: 0,
        active: true,
        scored: false,
      };
      if (kind === KIND.PUDDLE) item.y = GROUND_Y - 6;
      if (kind === KIND.KNIFE) {
        // Flies level at head height: duck under it, or jump clean over it.
        // No gravity: a thrown knife that sank to the ground would hit a
        // ducking turkey, which would make ducking useless.
        item.y = GROUND_Y - 66;
        item.vy = 0;
        item.vx = -(speed * 0.55);
      }
      if (kind === KIND.PUMPKIN) {
        item.vx = -90;
        item.y = GROUND_Y - size.h;
      }
      this.items.push(item);
      // Sometimes a corn trail rides above the hazard, rewarding the jump.
      if (rng.chance(0.55)) {
        const arc = rng.chance(0.5) ? 130 : 70;
        for (let i = 0; i < 3; i += 1) {
          this.items.push({
            kind: KIND.CORN,
            x: VIEW_W + 60 + i * 44,
            y: GROUND_Y - arc - (i === 1 ? 34 : 0),
            w: SIZES.corn.w,
            h: SIZES.corn.h,
            vy: 0,
            vx: 0,
            spin: 0,
            active: true,
            scored: false,
          });
        }
      } else if (rng.chance(0.25)) {
        this.items.push({
          kind: KIND.FEATHER,
          x: VIEW_W + 80,
          y: GROUND_Y - 150,
          w: SIZES.feather.w,
          h: SIZES.feather.h,
          vy: 0,
          vx: 0,
          spin: 0,
          active: true,
          scored: false,
        });
      }
    },

    update(dt, speed, stage) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(stage, speed);
        const [lo, hi] = stage.spawnEvery;
        this.spawnTimer = rng.range(lo, hi);
      }
      for (const item of this.items) {
        if (!item.active) continue;
        // Everything scrolls left with the world; knives and pumpkins add
        // their own leftward motion on top.
        item.x -= speed * dt;
        if (item.kind === KIND.KNIFE || item.kind === KIND.PUMPKIN) item.x += item.vx * dt;
        if (item.kind === KIND.KNIFE) {
          item.spin += dt * 9;
        }
        if (item.kind === KIND.PUMPKIN) item.spin += dt * 5;
        if (item.x + item.w < -80) item.active = false;
      }
      this.items = this.items.filter((item) => item.active);
    },
  };
}

/** AABB overlap between the turkey and one item. */
export function overlaps(turkey, item) {
  return (
    turkey.x < item.x + item.w &&
    turkey.x + turkey.w > item.x &&
    turkey.y < item.y + item.h &&
    turkey.y + turkey.h > item.y
  );
}

/** Draw one hazard or pickup. Each kind is drawn from flat autumn shapes. */
export function drawItem(ctx, item) {
  ctx.save();
  switch (item.kind) {
    case KIND.FENCE: {
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(item.x, item.y, 6, item.h);
      ctx.fillRect(item.x + item.w - 6, item.y, 6, item.h);
      ctx.fillRect(item.x - 4, item.y + 8, item.w + 8, 8);
      ctx.fillRect(item.x - 4, item.y + 28, item.w + 8, 8);
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(item.x - 4, item.y + 8, item.w + 8, 3);
      break;
    }
    case KIND.PUDDLE: {
      ctx.fillStyle = '#7fb3d5';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + 7, item.w / 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a8cfe8';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2 - 12, item.y + 5, 18, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case KIND.HAY: {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b57f22';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(item.x + item.w / 2, item.y + item.h / 2, 14 + Math.abs(i) * 7, -0.6 + i * 0.18, 0.6 + i * 0.18);
        ctx.stroke();
      }
      ctx.fillStyle = '#3a2412';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE!', item.x + item.w / 2, item.y - 8);
      break;
    }
    case KIND.PUMPKIN: {
      ctx.save();
      ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
      ctx.rotate(item.spin);
      ctx.fillStyle = '#e8862e';
      ctx.beginPath();
      ctx.ellipse(0, 0, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c96a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, item.w / 4, item.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7a9b3a';
      ctx.fillRect(-3, -item.h / 2 - 4, 6, 10);
      ctx.restore();
      break;
    }
    case KIND.KNIFE: {
      ctx.save();
      ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
      ctx.rotate(item.spin);
      ctx.fillStyle = '#d7dee8';
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(12, -4);
      ctx.lineTo(22, 0);
      ctx.lineTo(12, 4);
      ctx.lineTo(-22, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2412';
      ctx.fillRect(-22, -5, 12, 10);
      ctx.restore();
      break;
    }
    case KIND.OVEN: {
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(item.x + 8, item.y + 10, item.w - 16, 34);
      ctx.fillStyle = '#ff9a3d';
      ctx.fillRect(item.x + 12, item.y + 14, item.w - 24, 26);
      ctx.fillStyle = '#ffcf5e';
      ctx.beginPath();
      ctx.moveTo(item.x + 22, item.y + 40);
      ctx.lineTo(item.x + 30, item.y + 18);
      ctx.lineTo(item.x + 38, item.y + 40);
      ctx.moveTo(item.x + 44, item.y + 40);
      ctx.lineTo(item.x + 52, item.y + 18);
      ctx.lineTo(item.x + 60, item.y + 40);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(item.x + 8, item.y + 52, item.w - 16, 8);
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(item.x + 16, item.y + 70, 5, 0, Math.PI * 2);
      ctx.arc(item.x + 32, item.y + 70, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case KIND.POT: {
      ctx.fillStyle = '#3b4a6b';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fb3d5';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + 6, item.w / 2 - 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case KIND.CORN: {
      ctx.fillStyle = '#f5b301';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, 10, 15, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d98e32';
      for (let r = 0; r < 3; r += 1) {
        ctx.fillRect(item.x + 8, item.y + 8 + r * 9, 14, 2);
      }
      ctx.fillStyle = '#7a9b3a';
      ctx.beginPath();
      ctx.moveTo(item.x + 15, item.y + item.h - 2);
      ctx.lineTo(item.x + 8, item.y + item.h + 6);
      ctx.lineTo(item.x + 22, item.y + item.h + 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case KIND.FEATHER: {
      ctx.fillStyle = '#f5d76e';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, 8, 14, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2 - 4, 4, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}
