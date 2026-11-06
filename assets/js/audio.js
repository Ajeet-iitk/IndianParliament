/* ============================================================
   SANSAD — Audio engine
   Sound effects and the optional scores are synthesised live
   with the Web Audio API. The default score is the bundled
   instrumental Vande Mataram recording, played through an
   HTML audio element so it can loop and honour the same
   music, volume, visibility and reduced-motion preferences.
   ============================================================ */

const SansadAudio = (function () {
  "use strict";

  const DEFAULTS = {
    music: true,
    sfx: true,
    musicVol: 0.42,
    sfxVol: 0.7,
    style: "vandemataram"
  };

  let settings = Object.assign({}, DEFAULTS);
  let ctx = null;
  let master, comp, sfxBus, musicBus, musicOut, reverb, reverbGain;
  let noiseBuffer = null;
  let unlocked = false;
  let musicPlaying = false;
  let musicTimer = null;
  let musicVoices = [];
  let nextPluck = 0;
  let beat = 0;
  let chordIndex = 0;
  let hiddenStop = false;
  let fileAudio = null;
  let filePlaying = false;
  let fileBlocked = false;
  let fileFadeTimer = null;

  const A4 = 440;
  const note = (n) => A4 * Math.pow(2, (n - 69) / 12);

  /* ----------------------------------------------------------
     Graph
     ---------------------------------------------------------- */
  function impulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  function makeNoise() {
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function init() {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx();
    } catch (_) {
      return null;
    }

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.008;
    comp.release.value = 0.25;

    master = ctx.createGain();
    master.gain.value = 0.9;

    comp.connect(master);
    master.connect(ctx.destination);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0;
    sfxBus.connect(comp);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicOut = ctx.createGain();
    musicOut.gain.value = 1;
    musicBus.connect(musicOut);
    musicOut.connect(comp);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.8, 2.6);
    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.32;
    musicBus.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(comp);

    noiseBuffer = makeNoise();
    applyVolumes(true);
    return ctx;
  }

  function curve(v) {
    return Math.pow(Math.max(0, Math.min(1, v)), 1.6);
  }

  function applyVolumes(immediate) {
    if (fileAudio && filePlaying) {
      fadeFileTo(targetFileVolume(), immediate ? 0 : 180);
    }
    if (!ctx) return;
    const t = ctx.currentTime;
    const s = settings.sfx ? curve(settings.sfxVol) : 0;
    const m = settings.music ? curve(settings.musicVol) : 0;
    if (immediate) {
      sfxBus.gain.setValueAtTime(s, t);
      musicBus.gain.setValueAtTime(m, t);
    } else {
      sfxBus.gain.setTargetAtTime(s, t, 0.08);
      musicBus.gain.setTargetAtTime(m, t, 0.12);
    }
  }

  /* ----------------------------------------------------------
     Small synthesis helpers
     ---------------------------------------------------------- */
  function tone(opts) {
    const t0 = ctx.currentTime + (opts.delay || 0);
    const dur = opts.dur || 0.2;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const peak = Math.max(0.0002, opts.gain || 0.04);
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq || 440, t0);
    if (opts.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.glide), t0 + dur);
    if (opts.detune) osc.detune.value = opts.detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = opts.filter;
      f.frequency.value = opts.filterFreq || 1200;
      f.Q.value = opts.q || 0.7;
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(opts.dest || sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(opts) {
    const t0 = ctx.currentTime + (opts.delay || 0);
    const dur = opts.dur || 0.15;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = opts.filter || "bandpass";
    f.frequency.setValueAtTime(opts.freq || 1200, t0);
    if (opts.freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), t0 + dur);
    f.Q.value = opts.q == null ? 0.8 : opts.q;
    const g = ctx.createGain();
    const peak = opts.gain == null ? 0.05 : opts.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(opts.dest || sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /* ----------------------------------------------------------
     Sound effects
     ---------------------------------------------------------- */
  function play(name) {
    if (!settings.sfx || !unlocked) return;
    if (!init()) return;
    if (ctx.state === "suspended") ctx.resume();

    switch (name) {
      case "click":
        noise({ dur: 0.045, gain: 0.05, filter: "highpass", freq: 1900, q: 0.6 });
        break;

      case "gavel":
        tone({ freq: 96, glide: 48, dur: 0.19, type: "sine", gain: 0.16, attack: 0.003 });
        noise({ dur: 0.11, gain: 0.12, filter: "lowpass", freq: 900, q: 0.5 });
        tone({ freq: 210, glide: 120, dur: 0.09, type: "triangle", gain: 0.05, delay: 0.005 });
        break;

      case "correct":
        tone({ freq: 523.25, dur: 0.18, type: "triangle", gain: 0.05 });
        tone({ freq: 659.25, dur: 0.18, type: "triangle", gain: 0.045, delay: 0.075 });
        tone({ freq: 783.99, dur: 0.32, type: "sine", gain: 0.05, delay: 0.15 });
        tone({ freq: 1046.5, dur: 0.3, type: "sine", gain: 0.022, delay: 0.2 });
        break;

      case "wrong":
        tone({ freq: 196, glide: 172, dur: 0.22, type: "sawtooth", gain: 0.035, filter: "lowpass", filterFreq: 700 });
        tone({ freq: 146.83, glide: 128, dur: 0.32, type: "sawtooth", gain: 0.03, delay: 0.1, filter: "lowpass", filterFreq: 600 });
        break;

      case "bell":
        [0, 0.52, 1.04].forEach((delay) => {
          tone({ freq: 587, dur: 1.5, type: "sine", gain: 0.075, delay, attack: 0.004 });
          tone({ freq: 587 * 2.41, dur: 1.05, type: "sine", gain: 0.032, delay, attack: 0.003 });
          tone({ freq: 587 * 3.93, dur: 0.8, type: "sine", gain: 0.018, delay, attack: 0.003 });
          tone({ freq: 587 * 0.5, dur: 1.2, type: "triangle", gain: 0.028, delay, attack: 0.005 });
        });
        break;

      case "tick":
        tone({ freq: 1180, dur: 0.045, type: "square", gain: 0.018, filter: "highpass", filterFreq: 700 });
        break;

      case "vote":
        tone({ freq: 760 + Math.random() * 90, dur: 0.06, type: "sine", gain: 0.012 });
        break;

      case "applause": {
        const t0 = ctx.currentTime;
        const dur = 1.9;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1500;
        f.Q.value = 0.55;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        for (let i = 0; i < 14; i++) {
          const t = t0 + 0.12 + (i / 14) * (dur - 0.25);
          g.gain.linearRampToValueAtTime(0.035 + Math.random() * 0.045, t);
          g.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.02, t + 0.09);
        }
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(f); f.connect(g); g.connect(sfxBus);
        src.start(t0); src.stop(t0 + dur + 0.05);
        noise({ dur: 0.7, gain: 0.02, filter: "highpass", freq: 2400, delay: 0.15 });
        break;
      }

      case "swell":
        noise({ dur: 0.55, gain: 0.03, filter: "lowpass", freq: 260, freqEnd: 2400, q: 0.6 });
        break;

      case "chime":
        [659.25, 987.77, 1318.5].forEach((f, i) => {
          tone({ freq: f, dur: 0.5 + i * 0.15, type: "sine", gain: 0.035 - i * 0.006, delay: i * 0.09 });
        });
        break;

      case "whoosh":
        noise({ dur: 0.34, gain: 0.032, filter: "lowpass", freq: 240, freqEnd: 2400, q: 0.7 });
        noise({ dur: 0.26, gain: 0.022, filter: "bandpass", freq: 1800, freqEnd: 320, q: 0.8, delay: 0.16 });
        tone({ freq: 180, glide: 90, dur: 0.3, type: "sine", gain: 0.02 });
        break;

      case "spray":
        noise({ dur: 0.46, gain: 0.05, filter: "highpass", freq: 3000, freqEnd: 900, q: 0.5 });
        noise({ dur: 0.2, gain: 0.025, filter: "highpass", freq: 4600, q: 0.4, delay: 0.04 });
        tone({ freq: 820, glide: 460, dur: 0.16, type: "triangle", gain: 0.014 });
        break;

      case "squish":
        tone({ freq: 140, glide: 48, dur: 0.13, type: "sine", gain: 0.13, attack: 0.004 });
        noise({ dur: 0.09, gain: 0.075, filter: "lowpass", freq: 700, q: 0.7 });
        tone({ freq: 320, glide: 90, dur: 0.08, type: "triangle", gain: 0.03, delay: 0.01 });
        break;

      case "skitter":
        [0, 0.035, 0.06, 0.095, 0.13, 0.17].forEach((delay, i) => {
          noise({ dur: 0.022, gain: 0.012 + (i % 2) * 0.004, filter: "highpass", freq: 3200 + i * 260, q: 0.6, delay });
        });
        break;

      case "breach":
        tone({ freq: 76, glide: 38, dur: 0.55, type: "sine", gain: 0.18, attack: 0.004 });
        noise({ dur: 0.4, gain: 0.075, filter: "lowpass", freq: 620, q: 0.6 });
        tone({ freq: 300, glide: 78, dur: 0.32, type: "sawtooth", gain: 0.04, delay: 0.03, filter: "lowpass", filterFreq: 900 });
        break;

      case "buzz":
        tone({ freq: 168, dur: 0.24, type: "sawtooth", gain: 0.022, filter: "bandpass", filterFreq: 780, q: 4 });
        tone({ freq: 183, dur: 0.22, type: "sawtooth", gain: 0.018, delay: 0.02, filter: "bandpass", filterFreq: 920, q: 4 });
        break;

      case "combo":
        [784, 1046.5, 1318.5].forEach((freq, i) => {
          tone({ freq, dur: 0.12, type: "triangle", gain: 0.04, delay: i * 0.055 });
        });
        break;

      case "reform":
        noise({ dur: 0.6, gain: 0.025, filter: "lowpass", freq: 280, freqEnd: 3200, q: 0.6 });
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
          tone({ freq, dur: 0.8 + i * 0.08, type: "sine", gain: 0.038, delay: i * 0.08, attack: 0.008 });
        });
        tone({ freq: 96, glide: 52, dur: 0.22, type: "sine", gain: 0.1, delay: 0.1 });
        break;

      case "victory":
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, i) => {
          tone({ freq, dur: 0.46, type: "triangle", gain: 0.04, delay: i * 0.12 });
          tone({ freq: freq * 2, dur: 0.3, type: "sine", gain: 0.014, delay: i * 0.12 + 0.02 });
        });
        noise({ dur: 0.9, gain: 0.02, filter: "highpass", freq: 2400, q: 0.5, delay: 0.2 });
        break;

      case "defeat":
        [392, 349.23, 293.66, 220].forEach((freq, i) => {
          tone({ freq, dur: 0.55, type: "triangle", gain: 0.045, delay: i * 0.18 });
          tone({ freq: freq * 0.5, dur: 0.65, type: "sine", gain: 0.03, delay: i * 0.18 + 0.02 });
        });
        break;

      case "alarm":
        tone({ freq: 220, glide: 110, dur: 0.9, type: "sawtooth", gain: 0.05, filter: "lowpass", filterFreq: 700, q: 1.2, attack: 0.05 });
        tone({ freq: 164, glide: 82, dur: 1.1, type: "sine", gain: 0.045, delay: 0.12, attack: 0.04 });
        noise({ dur: 1.2, gain: 0.015, filter: "bandpass", freq: 300, freqEnd: 220, q: 0.8, attack: 0.2 });
        break;

      case "conch":
        tone({ freq: 196, glide: 294, dur: 1.15, type: "sawtooth", gain: 0.045, filter: "lowpass", filterFreq: 900, q: 1.4, attack: 0.09 });
        tone({ freq: 392, glide: 587, dur: 0.95, type: "sine", gain: 0.028, delay: 0.08, attack: 0.08 });
        noise({ dur: 1.05, gain: 0.018, filter: "bandpass", freq: 700, freqEnd: 1500, q: 1.1, attack: 0.12 });
        break;

      case "dhol":
        [0, 0.15, 0.3, 0.45, 0.62].forEach((delay, i) => {
          tone({ freq: i % 2 ? 118 : 82, glide: 46, dur: 0.17, type: "sine", gain: 0.13, delay, attack: 0.004 });
          noise({ dur: 0.06, gain: 0.055, filter: "lowpass", freq: 900, q: 0.6, delay });
        });
        tone({ freq: 196, glide: 98, dur: 0.22, type: "triangle", gain: 0.03, delay: 0.62 });
        break;

      default:
        tone({ freq: 600, dur: 0.08, type: "sine", gain: 0.03 });
    }
  }

  /* ----------------------------------------------------------
     Ambient score
     ---------------------------------------------------------- */
  const STYLES = {
    tanpura: {
      pluckEvery: 1.15,
      pattern: [note(48), note(43), note(60), note(48)], // C3 G2 C4 C3
      chords: [
        [note(48), note(52), note(55)],
        [note(45), note(48), note(52)],
        [note(41), note(45), note(48)],
        [note(43), note(47), note(50)]
      ],
      drone: [note(36), note(43), note(48)],
      padType: "triangle",
      cutoff: 900
    },
    cinematic: {
      pluckEvery: 2.3,
      pattern: [note(50), note(38), note(62), note(50)], // D3 D2 D4 D3
      chords: [
        [note(50), note(53), note(57)],
        [note(46), note(50), note(53)],
        [note(41), note(45), note(48)],
        [note(48), note(52), note(55)]
      ],
      drone: [note(38), note(45), note(50)],
      padType: "sine",
      cutoff: 640
    },
    desh: {
      pluckEvery: 0.62,
      // Original march motif in D major pentatonic — a processional, not a quotation.
      pattern: [
        note(50), note(57), note(62), note(57), note(59), note(62), note(64), note(62),
        note(57), note(64), note(69), note(64), note(62), note(59), note(57), note(50)
      ],
      chords: [
        [note(50), note(54), note(57)],
        [note(55), note(59), note(62)],
        [note(57), note(61), note(64)],
        [note(50), note(54), note(57)]
      ],
      drone: [note(38), note(45), note(50)],
      padType: "triangle",
      cutoff: 1150
    },
    vande: {
      pluckEvery: 1.35,
      // A slow devotional pentatonic in D — an instrumental homage to the song.
      pattern: [
        note(50), note(53), note(57), note(55), note(53), note(50), note(48), note(50),
        note(53), note(57), note(60), note(57), note(55), note(53), note(50), note(48)
      ],
      chords: [
        [note(50), note(53), note(57)],
        [note(45), note(50), note(53)],
        [note(48), note(52), note(55)],
        [note(43), note(50), note(55)]
      ],
      drone: [note(38), note(45), note(50)],
      padType: "sine",
      cutoff: 780
    },
    silent: null
  };

  /* ----------------------------------------------------------
     Recorded score
     ---------------------------------------------------------- */
  const FILE_STYLES = {
    vandemataram: {
      src: "assets/audio/vande-mataram-instrumental.mp3",
      trim: 1.35
    }
  };

  function isFileStyle(style) {
    return !!FILE_STYLES[style];
  }

  function targetFileVolume() {
    if (!settings.music) return 0;
    const meta = FILE_STYLES[settings.style];
    const trim = meta ? meta.trim : 1;
    return Math.min(1, curve(settings.musicVol) * trim);
  }

  function clearFileFade() {
    if (fileFadeTimer) {
      clearInterval(fileFadeTimer);
      fileFadeTimer = null;
    }
  }

  function fadeFileTo(target, ms, done) {
    if (!fileAudio) {
      if (done) done();
      return;
    }
    clearFileFade();
    const to = Math.max(0, Math.min(1, target));
    if (!ms) {
      fileAudio.volume = to;
      if (done) done();
      return;
    }
    const from = fileAudio.volume;
    const started = Date.now();
    fileFadeTimer = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / ms);
      fileAudio.volume = Math.max(0, Math.min(1, from + (to - from) * p));
      if (p >= 1) {
        clearFileFade();
        if (done) done();
      }
    }, 40);
  }

  function ensureFileAudio() {
    if (fileAudio) return fileAudio;
    fileAudio = new window.Audio();
    fileAudio.loop = true;
    fileAudio.preload = "auto";
    fileAudio.volume = 0;
    return fileAudio;
  }

  function startFile() {
    const meta = FILE_STYLES[settings.style];
    if (!meta) return;
    const el = ensureFileAudio();
    const src = new URL(meta.src, document.baseURI).href;
    if (el.src !== src) el.src = src;
    el.loop = true;
    el.volume = 0;
    filePlaying = true;
    const play = el.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        // Autoplay was refused; retry on the next gesture.
        filePlaying = false;
        fileBlocked = true;
      });
    }
    fadeFileTo(targetFileVolume(), 1600);
  }

  function track(voice) {
    musicVoices.push(voice);
    if (musicVoices.length > 60) musicVoices = musicVoices.slice(-40);
    voice.onended = () => {
      musicVoices = musicVoices.filter((v) => v !== voice);
    };
  }

  function pluck(freq, t) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    filter.type = "lowpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(520, t + 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.075, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    osc.connect(filter); filter.connect(g); g.connect(musicBus);
    osc.start(t); osc.stop(t + 2.5);
    track(osc);
  }

  function pad(freqs, t, dur) {
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = STYLES[settings.style].padType;
      osc2.type = "sine";
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 2;
      osc.detune.value = -4 + i;
      osc2.detune.value = 3;
      filter.type = "lowpass";
      filter.frequency.value = STYLES[settings.style].cutoff;
      filter.Q.value = 0.4;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.022, t + 2.6);
      g.gain.setValueAtTime(0.022, t + dur - 3.2);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      g.connect(musicBus);
      osc.start(t); osc2.start(t);
      osc.stop(t + dur + 0.1); osc2.stop(t + dur + 0.1);
      track(osc); track(osc2);
    });
  }

  function buildDrone(style) {
    const t = ctx.currentTime;
    style.drone.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.detune.value = i === 1 ? 4 : -3;
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.012, t + 4);
      osc.connect(filter); filter.connect(g); g.connect(musicBus);
      osc.start(t);
      track(osc);
    });
  }

  function schedule() {
    if (!musicPlaying || !ctx) return;
    const style = STYLES[settings.style];
    if (!style) return;
    const horizon = ctx.currentTime + 1.3;
    while (nextPluck < horizon) {
      pluck(style.pattern[beat % style.pattern.length], nextPluck);
      nextPluck += style.pluckEvery;
      beat++;
      if (beat % 8 === 0) {
        pad(style.chords[chordIndex % style.chords.length], ctx.currentTime + 0.05, 15);
        chordIndex++;
      }
    }
  }

  function start() {
    if (!settings.music || settings.style === "silent") return;
    if (isFileStyle(settings.style)) {
      if (filePlaying) return;
      musicPlaying = true;
      startFile();
      return;
    }
    if (!init()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (musicPlaying) return;
    musicPlaying = true;
    nextPluck = ctx.currentTime + 0.15;
    beat = 0;
    chordIndex = 0;
    buildDrone(STYLES[settings.style]);
    musicOut.gain.cancelScheduledValues(ctx.currentTime);
    musicOut.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicOut.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);
    clearInterval(musicTimer);
    musicTimer = setInterval(schedule, 420);
    schedule();
    applyVolumes();
  }

  function stop() {
    const hadFile = filePlaying;
    filePlaying = false;
    musicPlaying = false;
    if (hadFile && fileAudio) {
      fadeFileTo(0, 500, () => {
        if (!filePlaying && fileAudio) {
          try { fileAudio.pause(); } catch (_) {}
        }
      });
    }
    if (!ctx) return;
    clearInterval(musicTimer);
    musicTimer = null;
    const t = ctx.currentTime;
    musicOut.gain.cancelScheduledValues(t);
    musicOut.gain.setTargetAtTime(0.0001, t, 0.25);
    const voices = musicVoices.slice();
    musicVoices = [];
    setTimeout(() => {
      voices.forEach((v) => {
        try { v.stop(); } catch (_) {}
      });
    }, 700);
  }

  function restart() {
    stop();
    setTimeout(() => {
      if (settings.music) start();
    }, 750);
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */
  function configure(next) {
    const wasMusic = settings.music;
    const wasStyle = settings.style;
    settings = Object.assign({}, settings, next || {});
    applyVolumes();
    if (!unlocked) return; // remember preferences until the first gesture
    if (settings.music && (!wasMusic || settings.style !== wasStyle)) {
      if (!wasMusic) start();
      else restart();
    } else if (!settings.music && wasMusic) {
      stop();
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    init();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (settings.music) start();
  }

  function getSettings() {
    return Object.assign({}, settings);
  }

  function isUnlocked() {
    return unlocked;
  }

  function status() {
    return {
      style: settings.style,
      music: settings.music,
      unlocked: unlocked,
      musicPlaying: musicPlaying,
      filePlaying: filePlaying,
      fileBlocked: fileBlocked,
      fileSrc: fileAudio ? fileAudio.src : null,
      fileVolume: fileAudio ? fileAudio.volume : null,
      filePaused: fileAudio ? fileAudio.paused : null,
      fileReadyState: fileAudio ? fileAudio.readyState : null,
      fileDuration: fileAudio ? fileAudio.duration : null,
      ctx: ctx ? ctx.state : null
    };
  }

  function boot() {
    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, unlock, { once: true, passive: true });
    });
    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, () => {
        if (fileBlocked && settings.music) {
          fileBlocked = false;
          start();
        }
      }, { passive: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (musicPlaying) {
          hiddenStop = true;
          stop();
        }
      } else if (hiddenStop) {
        hiddenStop = false;
        if (settings.music) start();
      }
    });
  }

  boot();

  return {
    play,
    configure,
    getSettings,
    unlock,
    isUnlocked,
    status,
    startMusic: start,
    stopMusic: stop,
    supports: !!(window.AudioContext || window.webkitAudioContext) || typeof window.Audio !== "undefined"
  };
})();
