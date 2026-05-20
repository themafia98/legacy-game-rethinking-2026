const DEFAULT_SEED = 0x92D68CA2;

export class ScalarRng {
  private state: number;

  constructor(seed: number = DEFAULT_SEED) {
    this.state = seed >>> 0 || DEFAULT_SEED;
  }

  reseed(seed: number): void {
    this.state = seed >>> 0 || DEFAULT_SEED;
  }

  nextU32(): number {
    let x = this.state >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  nextIndex(length: number): number {
    if (length <= 0) return 0;
    return this.nextU32() % length;
  }

  pick<T>(values: readonly T[]): T {
    return values[this.nextIndex(values.length)]!;
  }
}
