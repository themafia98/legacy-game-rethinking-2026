import { Vector2 } from '../math/Vector2';

export class ProjectileEntity {
  position: Vector2;
  readonly direction: Vector2;
  readonly speed: number;
  rotation: number = 0;

  readonly sheetX: number;
  readonly sheetY: number;
  readonly frameWidth: number;
  readonly frameHeight: number;

  constructor(
    position: Vector2,
    direction: Vector2,
    speed: number,
    sheetX: number,
    sheetY: number,
    frameWidth: number,
    frameHeight: number,
  ) {
    this.position = position;
    this.direction = direction.normalize();
    this.speed = speed;
    this.sheetX = sheetX;
    this.sheetY = sheetY;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }
}
