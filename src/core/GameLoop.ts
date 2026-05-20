export type FrameCallback = (dt: number, now: number) => void;

const MAX_DT = 0.1;

export class GameLoop {
  private rafHandle: number | null = null;
  private lastTime: number | null = null;
  private running = false;

  private readonly callback: FrameCallback;

  constructor(callback: FrameCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.lastTime = null;
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;

    if (this.lastTime === null) {
      this.lastTime = now;
    }

    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, MAX_DT);
    this.lastTime = now;

    this.callback(dt, now);
    this.rafHandle = requestAnimationFrame(this.tick);
  };
}
