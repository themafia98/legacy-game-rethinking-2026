import { Vector2 } from '../math/Vector2';
import { ItemType } from '../types/EntityTypes';

export class ItemEntity {
  readonly type: ItemType;
  position: Vector2;
  active: boolean = true;

  readonly sheetX: number;
  readonly sheetY: number;
  readonly frameWidth: number;
  readonly frameHeight: number;

  frameIndex: number = 0;
  animationSpeed: number = 0;

  constructor(
    type: ItemType,
    position: Vector2,
    sheetX: number,
    sheetY: number,
    frameWidth: number,
    frameHeight: number,
  ) {
    this.type = type;
    this.position = position;
    this.sheetX = sheetX;
    this.sheetY = sheetY;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }
}
