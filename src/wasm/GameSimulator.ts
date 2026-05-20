import { SimMemory } from './SimMemory';

const WASM_PAGE_SIZE       = 64 * 1024;
const MIN_SIM_MEMORY_BYTES = WASM_PAGE_SIZE;

interface WasmExports {
  memory: WebAssembly.Memory;
  seedRng(seed: number): void;
  initPlayer(posX: number, posY: number, health: number, damage: number, speed: number): void;
  initEnemies(count: number): void;
  simulate(inputFlags: number, mouseX: number, mouseY: number, dt: number, now: number): void;
  getAliveEnemyCount(): number;
  getActiveProjectileCount(): number;
  getActiveItemCount(): number;
  advanceDeathFrame(i: number): void;
}

export interface SimulateResult {
  eventFlags:  number;
  pointsDelta: number;
  healthDelta: number;
  damageDelta: number;
  killsDelta:  number;
}

export class GameSimulator {
  readonly mem: SimMemory;
  private readonly exports: WasmExports;

  private constructor(exports: WasmExports) {
    const current = exports.memory.buffer.byteLength;
    if (current < MIN_SIM_MEMORY_BYTES) {
      exports.memory.grow(Math.ceil((MIN_SIM_MEMORY_BYTES - current) / WASM_PAGE_SIZE));
    }
    this.exports = exports;
    this.mem     = new SimMemory(exports.memory);
    exports.seedRng(Math.trunc(performance.now() * 1000) >>> 0);
  }

  static async load(wasmUrl: string): Promise<GameSimulator> {
    const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {
      env: {
        abort: (_msg: number, _file: number, line: number, col: number) => {
          console.error(`WASM abort at ${line}:${col}`);
        },
      },
    });
    return new GameSimulator(result.instance.exports as unknown as WasmExports);
  }

  initPlayer(posX: number, posY: number, health: number, damage: number, speed: number): void {
    this.exports.initPlayer(posX, posY, health, damage, speed);
  }

  initEnemies(count: number): void {
    this.exports.initEnemies(count);
  }

  simulate(inputFlags: number, mouseX: number, mouseY: number, dt: number, now: number): SimulateResult {
    this.exports.simulate(inputFlags, mouseX, mouseY, dt, now);
    return {
      eventFlags:  this.mem.resultEventFlags,
      pointsDelta: this.mem.resultPointsDelta,
      healthDelta: this.mem.resultHealthDelta,
      damageDelta: this.mem.resultDamageDelta,
      killsDelta:  this.mem.resultKillsDelta,
    };
  }

  getAliveEnemyCount(): number       { return this.exports.getAliveEnemyCount(); }
  getActiveProjectileCount(): number { return this.exports.getActiveProjectileCount(); }
  getActiveItemCount(): number       { return this.exports.getActiveItemCount(); }
  advanceDeathFrame(i: number): void { this.exports.advanceDeathFrame(i); }
}
