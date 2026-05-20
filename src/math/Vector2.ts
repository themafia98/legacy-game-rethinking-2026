export class Vector2 {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  static readonly zero = new Vector2(0, 0);

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    if (scalar === 0) return Vector2.zero;
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  length(): number {
    return Math.sqrt(this.dot(this));
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  normalize(): Vector2 {
    const len = this.length();
    return this.divide(len);
  }

  distanceTo(other: Vector2): number {
    return this.subtract(other).length();
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toString(): string {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
