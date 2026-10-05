/*
 * Son du vaisseau — Web Audio, désactivé par défaut.
 * Tous les sons sont synthétisés en temps réel par ce fichier : aucun enregistrement tiers, donc
 * aucun problème de droits (voir CREDITS.md). Seule exception prévue : le riff de basse enregistré par
 * Jérémy, `public/audio/bass-riff.mp3`, joué à la place de la note synthétisée s'il existe.
 */

export type SoundName =
  'click' | 'open' | 'close' | 'whoosh' | 'arrive' | 'chime' | 'rank' | 'board' | 'bass';

type Listener = () => void;

const RIFF_URL = `${import.meta.env.BASE_URL}audio/bass-riff.mp3`;
/** E grave d'une basse 4 cordes (Mi1). */
const LOW_E = 41.2;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: { stop: () => void } | null = null;
  private riff: AudioBuffer | null | undefined;
  private listeners = new Map<SoundName, Set<Listener>>();
  enabled = false;

  /** Les visuels (cordes de la basse…) peuvent réagir même son coupé. */
  on(name: SoundName, listener: Listener) {
    const set = this.listeners.get(name) ?? new Set();
    set.add(listener);
    this.listeners.set(name, set);
    return () => {
      set.delete(listener);
    };
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      const ctx = this.context();
      if (!ctx) return;
      void ctx.resume();
      if (!this.ambient) this.ambient = this.startAmbient(ctx);
      this.master!.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
    } else if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      // Une fois le fondu fini, on met le contexte en pause : plus aucun calcul audio.
      const ctx = this.ctx;
      window.setTimeout(() => {
        if (!this.enabled) void ctx.suspend();
      }, 600);
    }
  }

  play(name: SoundName) {
    this.listeners.get(name)?.forEach((l) => l());
    if (!this.enabled) return;
    const ctx = this.context();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    switch (name) {
      case 'click':
        return this.tone(ctx, {
          freq: 880,
          to: 660,
          dur: 0.06,
          type: 'triangle',
          gain: 0.08,
          at: t,
        });
      case 'open':
        return this.tone(ctx, { freq: 420, to: 840, dur: 0.22, type: 'sine', gain: 0.07, at: t });
      case 'close':
        return this.tone(ctx, { freq: 760, to: 380, dur: 0.18, type: 'sine', gain: 0.06, at: t });
      case 'whoosh':
        return this.noise(ctx, { dur: 1.2, from: 300, to: 2400, gain: 0.12, at: t });
      case 'arrive':
        this.noise(ctx, { dur: 0.08, from: 1800, to: 900, gain: 0.18, at: t });
        return this.tone(ctx, { freq: 90, to: 55, dur: 0.18, type: 'sine', gain: 0.25, at: t });
      case 'chime':
        this.tone(ctx, { freq: 659.3, dur: 0.5, type: 'sine', gain: 0.08, at: t });
        return this.tone(ctx, { freq: 987.8, dur: 0.7, type: 'sine', gain: 0.07, at: t + 0.12 });
      case 'rank':
        return [523.3, 659.3, 784, 1046.5].forEach((f, i) =>
          this.tone(ctx, { freq: f, dur: 0.9, type: 'triangle', gain: 0.07, at: t + i * 0.12 }),
        );
      case 'board':
        this.noise(ctx, { dur: 0.35, from: 4000, to: 600, gain: 0.12, at: t });
        return this.tone(ctx, { freq: 110, to: 220, dur: 0.4, type: 'sine', gain: 0.12, at: t });
      case 'bass':
        return void this.bass(ctx, t);
    }
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    // Navigateurs : le son ne démarre qu'après un geste ; on reprend au premier clic ou touche.
    const resume = () => {
      if (this.enabled) void this.ctx?.resume();
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return this.ctx;
  }

  private tone(
    ctx: AudioContext,
    o: { freq: number; to?: number; dur: number; type: OscillatorType; gain: number; at: number },
  ) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, o.at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, o.at + o.dur);
    env.gain.setValueAtTime(0.0001, o.at);
    env.gain.exponentialRampToValueAtTime(o.gain, o.at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur);
    osc.connect(env).connect(this.master!);
    osc.start(o.at);
    osc.stop(o.at + o.dur + 0.05);
  }

  private noiseBuffer(ctx: AudioContext, seconds: number) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noise(
    ctx: AudioContext,
    o: { dur: number; from: number; to: number; gain: number; at: number },
  ) {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, o.dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(o.from, o.at);
    filter.frequency.exponentialRampToValueAtTime(o.to, o.at + o.dur * 0.6);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, o.at);
    env.gain.exponentialRampToValueAtTime(o.gain, o.at + o.dur * 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur);
    src.connect(filter).connect(env).connect(this.master!);
    src.start(o.at);
  }

  /** Nappe spatiale : deux sinus graves légèrement désaccordés et un souffle filtré qui respire. */
  private startAmbient(ctx: AudioContext) {
    const bus = ctx.createGain();
    bus.gain.value = 0.06;
    bus.connect(this.master!);
    const oscs = [55, 55.6, 82.4].map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(bus);
      o.start();
      return o;
    });
    const air = ctx.createBufferSource();
    air.buffer = this.noiseBuffer(ctx, 4);
    air.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.07;
    depth.gain.value = 160;
    lfo.connect(depth).connect(filter.frequency);
    const airGain = ctx.createGain();
    airGain.gain.value = 0.35;
    air.connect(filter).connect(airGain).connect(bus);
    air.start();
    lfo.start();
    return {
      stop: () => {
        oscs.forEach((o) => o.stop());
        air.stop();
        lfo.stop();
      },
    };
  }

  /** Riff enregistré s'il est déployé, sinon une note de basse pincée synthétisée. */
  private async bass(ctx: AudioContext, at: number) {
    if (this.riff === undefined) {
      this.riff = null;
      try {
        const response = await fetch(RIFF_URL);
        if (response.ok && response.headers.get('content-type')?.includes('audio')) {
          this.riff = await ctx.decodeAudioData(await response.arrayBuffer());
        }
      } catch {
        /* pas de riff : note synthétisée */
      }
    }
    if (this.riff) {
      const src = ctx.createBufferSource();
      src.buffer = this.riff;
      src.connect(this.master!);
      src.start();
      return;
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, at);
    filter.frequency.exponentialRampToValueAtTime(160, at + 0.9);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.5, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 1.8);
    filter.connect(env).connect(this.master!);
    for (const [freq, type] of [
      [LOW_E, 'sawtooth'],
      [LOW_E * 2, 'square'],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = type === 'square' ? 0.25 : 0.6;
      osc.connect(g).connect(filter);
      osc.start(at);
      osc.stop(at + 1.9);
    }
  }
}

export const sound = new SoundEngine();
