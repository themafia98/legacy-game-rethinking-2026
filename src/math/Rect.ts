import { Vector2 } from './Vector2';

export class Rect {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number,
  ) {}

  get right(): number {
    return this.x + this.width;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get center(): Vector2 {
    return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
  }

  intersects(other: Rect): boolean {
    return !(
      this.right <= other.x ||
      this.x > other.right ||
      this.bottom <= other.y ||
      this.y > other.bottom
    );
  }

  contains(point: Vector2): boolean {
    return (
      point.x >= this.x &&
      point.x < this.right &&
      point.y >= this.y &&
      point.y < this.bottom
    );
  }

  static fromVectors(pos: Vector2, size: Vector2): Rect {
    return new Rect(pos.x, pos.y, size.x, size.y);
  }

  static fromArrays(pos: [number, number], size: [number, number]): Rect {
    return new Rect(pos[0], pos[1], size[0], size[1]);
  }
}
