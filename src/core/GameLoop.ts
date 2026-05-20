export interface GameLoopCallbacks {
  update(dt: number, now: number): void;
  render(frameDt: number, now: number): void;
}

const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.25;
const MAX_UPDATE_STEPS = 5;

export class GameLoop {
  private rafHandle: number | null = null;
  private lastTime: number | null = null;
  private accumulator = 0;
  private running = false;

  private readonly callbacks: GameLoopCallbacks;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.accumulator = 0;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.lastTime = null;
    this.accumulator = 0;
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;

    if (this.lastTime === null) {
      this.lastTime = now;
    }

    const rawDt = (now - this.lastTime) / 1000;
    const frameDt = Math.min(rawDt, MAX_FRAME_DT);
    this.lastTime = now;
    this.accumulator += frameDt;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_UPDATE_STEPS) {
      this.callbacks.update(FIXED_DT, now);
      this.accumulator -= FIXED_DT;
      steps++;
    }

    if (steps === MAX_UPDATE_STEPS && this.accumulator > FIXED_DT) {
      this.accumulator = 0;
    }

    this.callbacks.render(frameDt, now);
    this.rafHandle = requestAnimationFrame(this.tick);
  };
}
