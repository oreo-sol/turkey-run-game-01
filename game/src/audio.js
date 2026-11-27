// Gobble Dash — every sound is synthesized with WebAudio, no audio files.
// One job: small named effects the game triggers, plus a tiny banjo-ish
// pluck loop for the run. Nothing here loads anything over the network.
export function makeAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, low) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low || 1200;
    const gain = ac.createGain();
    gain.gain.value = vol || 0.2;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  const sounds = {
    /** Two-note gobble: the turkey's hello on the title screen. */
    gobble() {
      tone(520, 0.09, 'square', 0.12, 380);
      tone(660, 0.09, 'square', 0.12, 480, 0.1);
      tone(780, 0.14, 'square', 0.1, 520, 0.2);
    },
    /** Short hop blip. */
    jump() { tone(280, 0.16, 'sine', 0.2, 620); },
    /** Higher second-hop blip. */
    doubleJump() { tone(420, 0.14, 'sine', 0.18, 840); },
    /** Corn pickup ding. */
    corn() {
      tone(880, 0.08, 'triangle', 0.2);
      tone(1320, 0.12, 'triangle', 0.16, null, 0.07);
    },
    /** Golden feather sparkle. */
    feather() {
      tone(1046, 0.1, 'triangle', 0.18);
      tone(1318, 0.1, 'triangle', 0.18, null, 0.08);
      tone(1568, 0.18, 'triangle', 0.16, null, 0.16);
    },
    /** Stumble thud + squawk. */
    stumble() {
      noise(0.18, 0.25, 900);
      tone(300, 0.22, 'sawtooth', 0.16, 120);
    },
    /** Farmer's angry shout. */
    shout() {
      tone(180, 0.28, 'sawtooth', 0.2, 90);
      tone(140, 0.3, 'sawtooth', 0.16, 70, 0.12);
    },
    /** Knife whizzing past. */
    whizz() { noise(0.22, 0.14, 3200); },
    /** Caught sting. */
    caught() {
      tone(392, 0.3, 'sawtooth', 0.2, 370);
      tone(311, 0.3, 'sawtooth', 0.2, 290, 0.28);
      tone(233, 0.6, 'sawtooth', 0.2, 180, 0.56);
    },
    /** Escaped fanfare. */
    escaped() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.2, null, i * 0.13));
      tone(1318, 0.4, 'triangle', 0.18, null, 0.55);
    },
    /** Soft click for menus. */
    click() { tone(700, 0.05, 'square', 0.08); },
  };

  return {
    ...sounds,
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopMusic();
      return muted;
    },
    /** Start the plucky run loop; stops itself on mute. */
    startMusic() {
      if (muted || musicTimer) return;
      const tune = [392, 0, 523, 0, 587, 659, 0, 523, 440, 0, 392, 0];
      musicTimer = setInterval(() => {
        if (muted) return;
        const note = tune[musicStep % tune.length];
        musicStep += 1;
        if (note) tone(note, 0.16, 'triangle', 0.05);
      }, 170);
    },
    stopMusic() {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    },
  };
}
