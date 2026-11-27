// Gobble Dash — everything the player sees. One job: draw the world, the
// HUD and the screens on the canvas, in the autumn palette from config.js.
import { VIEW_W, VIEW_H, GROUND_Y, PALETTE, ESCAPE_DISTANCE } from './config.js';
import { drawTurkey } from './turkey.js';
import { drawFarmer } from './farmer.js';
import { drawItem } from './obstacles.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_OVER, SCREEN_ESCAPED } from './world.js';

/** Draw the sky, sun, hills, barn and fences for the current stage. */
export function drawBackground(ctx, world, scrollX) {
  const kitchen = world.stage.sky === 'kitchen';
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, kitchen ? PALETTE.kitchenSkyTop : PALETTE.skyTop);
  sky.addColorStop(0.55, kitchen ? PALETTE.kitchenSkyMid : PALETTE.skyMid);
  sky.addColorStop(1, kitchen ? PALETTE.kitchenSkyBottom : PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

  // Sun with a sleepy face, low in the autumn sky.
  const sunX = 820;
  const sunY = 84;
  ctx.fillStyle = '#ffdf6b';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5b301';
  ctx.strokeStyle = '#f5b301';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 48, sunY + Math.sin(a) * 48);
    ctx.lineTo(sunX + Math.cos(a) * 60, sunY + Math.sin(a) * 60);
    ctx.stroke();
  }

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.85)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 280 - scrollX * 0.12) % (VIEW_W + 200) + VIEW_W + 200) % (VIEW_W + 200) - 100;
    const cy = 56 + i * 34;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 6, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling hills.
  ctx.fillStyle = kitchen ? '#7e2a1d' : '#c98f3d';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 20) {
    const y = GROUND_Y - 70 - Math.sin((x + scrollX * 0.4) / 160) * 26;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = kitchen ? '#5d1f14' : '#a8742c';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 20) {
    const y = GROUND_Y - 34 - Math.sin((x + scrollX * 0.6 + 300) / 120) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  if (kitchen) {
    drawKitchenWall(ctx, scrollX);
  } else {
    drawFarm(ctx, scrollX);
  }

  // Ground.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = PALETTE.groundDark;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 8);
  // Scuffed dirt dashes rushing past.
  ctx.strokeStyle = 'rgba(61, 38, 16, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i += 1) {
    const x = ((i * 97 - scrollX) % (VIEW_W + 120) + VIEW_W + 120) % (VIEW_W + 120) - 60;
    const y = GROUND_Y + 22 + (i % 4) * 16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 26, y);
    ctx.stroke();
  }
}

/** Barn, fences and corn stalks scrolling past in the farmyard. */
function drawFarm(ctx, scrollX) {
  // Red barn, far off.
  const barnX = ((420 - scrollX * 0.25) % (VIEW_W + 600) + VIEW_W + 600) % (VIEW_W + 600) - 300;
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(barnX, GROUND_Y - 150, 150, 150);
  ctx.fillStyle = PALETTE.barnDark;
  ctx.beginPath();
  ctx.moveTo(barnX - 12, GROUND_Y - 148);
  ctx.lineTo(barnX + 75, GROUND_Y - 205);
  ctx.lineTo(barnX + 162, GROUND_Y - 148);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(barnX + 55, GROUND_Y - 88, 40, 88);
  ctx.strokeStyle = PALETTE.barnDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(barnX + 55, GROUND_Y - 88);
  ctx.lineTo(barnX + 95, GROUND_Y);
  ctx.moveTo(barnX + 95, GROUND_Y - 88);
  ctx.lineTo(barnX + 55, GROUND_Y);
  ctx.stroke();
  // Fence posts along the field.
  ctx.fillStyle = PALETTE.fence;
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 110 - scrollX * 0.7) % (VIEW_W + 140) + VIEW_W + 140) % (VIEW_W + 140) - 70;
    ctx.fillRect(x, GROUND_Y - 62, 8, 62);
  }
  ctx.fillRect(0, GROUND_Y - 58, VIEW_W, 6);
  ctx.fillRect(0, GROUND_Y - 36, VIEW_W, 6);
  // Corn stalks with cobs.
  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 190 - scrollX * 0.5 + 60) % (VIEW_W + 220) + VIEW_W + 220) % (VIEW_W + 220) - 110;
    ctx.strokeStyle = PALETTE.leaf;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 8);
    ctx.lineTo(x + 8, GROUND_Y - 96);
    ctx.stroke();
    ctx.fillStyle = '#f5b301';
    ctx.beginPath();
    ctx.ellipse(x + 12, GROUND_Y - 66, 8, 16, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The kitchen: tiled wall, hanging pans, a window with the woods beyond. */
function drawKitchenWall(ctx, scrollX) {
  ctx.fillStyle = '#f3e2c7';
  ctx.fillRect(0, GROUND_Y - 210, VIEW_W, 210);
  ctx.strokeStyle = '#d9c39a';
  ctx.lineWidth = 2;
  for (let y = GROUND_Y - 210; y < GROUND_Y; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  for (let x = ((-scrollX * 0.3) % 60 + 60) % 60; x < VIEW_W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 210);
    ctx.lineTo(x, GROUND_Y);
    ctx.stroke();
  }
  // Window: the woods, freedom, just out of reach.
  const winX = ((700 - scrollX * 0.2) % (VIEW_W + 500) + VIEW_W + 500) % (VIEW_W + 500) - 250;
  ctx.fillStyle = '#7fb3d5';
  ctx.fillRect(winX, GROUND_Y - 190, 150, 110);
  ctx.fillStyle = '#5d8a4a';
  ctx.beginPath();
  ctx.moveTo(winX + 20, GROUND_Y - 80);
  ctx.lineTo(winX + 45, GROUND_Y - 140);
  ctx.lineTo(winX + 70, GROUND_Y - 80);
  ctx.moveTo(winX + 80, GROUND_Y - 80);
  ctx.lineTo(winX + 105, GROUND_Y - 140);
  ctx.lineTo(winX + 130, GROUND_Y - 80);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 6;
  ctx.strokeRect(winX, GROUND_Y - 190, 150, 110);
  // Hanging pans.
  for (let i = 0; i < 4; i += 1) {
    const x = ((i * 230 - scrollX * 0.35 + 120) % (VIEW_W + 260) + VIEW_W + 260) % (VIEW_W + 260) - 130;
    ctx.fillStyle = '#3b3b3b';
    ctx.beginPath();
    ctx.arc(x, GROUND_Y - 150, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x, GROUND_Y - 150, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** HUD: score, distance, lives, corn, stage and the farmer-gap bar. */
export function drawHud(ctx, world) {
  ctx.save();
  ctx.textAlign = 'left';
  // Top bar.
  ctx.fillStyle = 'rgba(58, 36, 18, 0.72)';
  ctx.beginPath();
  ctx.roundRect(12, 10, 330, 64, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 24, 38);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#f5b301';
  ctx.fillText(`${Math.floor(world.distance)} m  •  ${world.stageName}`, 24, 62);
  // Lives as hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 366 + i * 34;
    drawHeart(ctx, x, 42, i < world.lives);
  }
  // Corn count.
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`🌽 ${world.corn}`, 480, 40);
  // Farmer gap bar: how close the farmer is behind the turkey.
  const gapFrac = 1 - world.farmer.gap / 260;
  ctx.fillStyle = 'rgba(58, 36, 18, 0.72)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W - 292, 10, 280, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FARMER', VIEW_W - 280, 32);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  ctx.fillRect(VIEW_W - 280, 40, 256, 12);
  ctx.fillStyle = gapFrac > 0.7 ? '#e74c3c' : '#f5b301';
  ctx.fillRect(VIEW_W - 280, 40, Math.max(8, 256 * gapFrac), 12);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(gapFrac > 0.7 ? "HE'S RIGHT BEHIND YOU!" : 'keep running…', VIEW_W - 280, 66);
  // Floating message.
  if (world.messageTime > 0) {
    ctx.globalAlpha = Math.min(1, world.messageTime);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(58, 36, 18, 0.9)';
    ctx.lineWidth = 5;
    ctx.strokeText(world.message, VIEW_W / 2, 130);
    ctx.fillText(world.message, VIEW_W / 2, 130);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = full ? '#e74c3c' : 'rgba(255, 243, 214, 0.3)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-12, -4, -6, -12, 0, -5);
  ctx.bezierCurveTo(6, -12, 12, -4, 0, 8);
  ctx.fill();
  ctx.restore();
}

/** Draw the whole frame for the world's current screen. */
export function drawFrame(ctx, world, scrollX) {
  drawBackground(ctx, world, scrollX);
  for (const item of world.obstacles.items) {
    if (item.active) drawItem(ctx, item);
  }
  if (world.screen !== SCREEN_TITLE) {
    if (!world.turkey.hiding) drawTurkey(ctx, world.turkey);
    drawFarmer(ctx, world.farmer);
  }
  if (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSE) {
    drawHud(ctx, world);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_PAUSE) drawPause(ctx);
  if (world.screen === SCREEN_OVER) drawCaught(ctx, world);
  if (world.screen === SCREEN_ESCAPED) drawEscaped(ctx, world);
}

/** Big readable panel helper for the menu screens. */
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(58, 36, 18, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#f5b301';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTitle(ctx, world) {
  ctx.save();
  ctx.textAlign = 'center';
  panel(ctx, 180, 52, 600, 380);
  ctx.fillStyle = '#f5b301';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 132);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('A turkey escape game', VIEW_W / 2, 168);
  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText('Thanksgiving is coming. The farmer wants dinner.', VIEW_W / 2, 206);
  ctx.fillText('You want the woods. Run 1,200 m and live.', VIEW_W / 2, 232);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump (twice for a double jump)', VIEW_W / 2, 282);
  ctx.fillText('↓ — duck under knives • hide in a haystack', VIEW_W / 2, 310);
  ctx.fillText('Grab corn +10 • golden feather +50 • 3 lives', VIEW_W / 2, 338);
  ctx.fillStyle = '#f5b301';
  ctx.font = 'bold 24px sans-serif';
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE TO RUN', VIEW_W / 2, 392);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#c9a06a';
  ctx.fillText('P pause • M mute • the farmer never stops', VIEW_W / 2, 420);
  if (world.best > 0) {
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`BEST SCORE: ${world.best}`, VIEW_W / 2, 452);
  }
  ctx.restore();
}

function drawPause(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 18, 8, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  panel(ctx, 330, 190, 300, 150);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 252);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P or Space to keep running', VIEW_W / 2, 296);
  ctx.restore();
}

function drawCaught(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 18, 8, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  panel(ctx, 210, 110, 540, 320);
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText('CAUGHT!', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px sans-serif';
  ctx.fillText('The farmer got his Thanksgiving dinner.', VIEW_W / 2, 232);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#f5b301';
  ctx.fillText(`You ran ${Math.floor(world.distance)} m  •  score ${Math.floor(world.score)}`, VIEW_W / 2, 276);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '17px sans-serif';
  ctx.fillText(`Corn collected: ${world.corn}`, VIEW_W / 2, 308);
  if (world.best > 0) ctx.fillText(`Best score: ${world.best}`, VIEW_W / 2, 334);
  ctx.fillStyle = '#f5b301';
  ctx.font = 'bold 24px sans-serif';
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE TO RUN AGAIN', VIEW_W / 2, 392);
  ctx.restore();
}

function drawEscaped(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 60, 20, 0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  panel(ctx, 210, 110, 540, 320);
  ctx.fillStyle = '#7ec850';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText('ESCAPED!', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px sans-serif';
  ctx.fillText('You made it to the woods. No dinner tonight!', VIEW_W / 2, 232);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#f5b301';
  ctx.fillText(`1,200 m in ${world.time.toFixed(1)} s  •  score ${Math.floor(world.score)}`, VIEW_W / 2, 276);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '17px sans-serif';
  ctx.fillText(`Corn collected: ${world.corn}  •  lives left: ${world.lives}`, VIEW_W / 2, 308);
  if (world.best > 0) ctx.fillText(`Best score: ${world.best}`, VIEW_W / 2, 334);
  ctx.fillStyle = '#7ec850';
  ctx.font = 'bold 24px sans-serif';
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('▶ PRESS SPACE TO RUN AGAIN', VIEW_W / 2, 392);
  ctx.restore();
}
