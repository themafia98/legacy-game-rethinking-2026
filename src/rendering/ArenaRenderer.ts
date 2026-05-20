import { Renderer } from './Renderer';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import {
  SPRITE_GATE,
  GATE_RENDER_W, GATE_RENDER_H,
  GATE_POS_1_X, GATE_POS_2_X, GATE_POS_3_X,
  GATE_OPEN_LIMIT,
} from '../core/GameConfig';

export class ArenaRenderer {
  private gateOffset = 0;

  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  resetGate(): void {
    this.gateOffset = 0;
  }

  render(isAnimating: boolean): void {
    const texture = this.assets.getImage(ImageKey.Texture);
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    const W = this.renderer.width;
    const H = this.renderer.height;

    this.renderer.drawSprite({
      image: texture,
      srcX: 5, srcY: 610,
      srcW: W, srcH: H,
      dstX: 0, dstY: 0,
      dstW: W, dstH: H,
    });

    this.renderer.drawSprite({
      image: texture,
      srcX: 5, srcY: 5,
      srcW: W, srcH: H,
      dstX: 0, dstY: 0,
      dstW: W, dstH: H,
    });

    this.renderer.drawSprite({
      image: sheet,
      srcX: SPRITE_GATE.x, srcY: SPRITE_GATE.y,
      srcW: SPRITE_GATE.w, srcH: SPRITE_GATE.h,
      dstX: GATE_POS_1_X, dstY: 0,
      dstW: GATE_RENDER_W, dstH: GATE_RENDER_H,
    });

    if (isAnimating) {
      if (this.gateOffset > GATE_OPEN_LIMIT) this.gateOffset--;
    } else {
      if (this.gateOffset < 0) this.gateOffset++;
    }

    this.renderer.drawSprite({
      image: sheet,
      srcX: SPRITE_GATE.x, srcY: SPRITE_GATE.y,
      srcW: SPRITE_GATE.w, srcH: SPRITE_GATE.h,
      dstX: GATE_POS_2_X, dstY: this.gateOffset,
      dstW: GATE_RENDER_W, dstH: GATE_RENDER_H,
    });

    this.renderer.drawSprite({
      image: sheet,
      srcX: SPRITE_GATE.x, srcY: SPRITE_GATE.y,
      srcW: SPRITE_GATE.w, srcH: SPRITE_GATE.h,
      dstX: GATE_POS_3_X, dstY: 0,
      dstW: GATE_RENDER_W, dstH: GATE_RENDER_H,
    });
  }
}
