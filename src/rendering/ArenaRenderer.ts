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
  private staticLayer: HTMLCanvasElement | null = null;
  private staticLayerCtx: CanvasRenderingContext2D | null = null;

  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {
    this.createStaticLayer();
  }

  resetGate(): void {
    this.gateOffset = 0;
  }

  private createStaticLayer(): void {
    this.staticLayer = document.createElement('canvas');
    this.staticLayer.width = this.renderer.width;
    this.staticLayer.height = this.renderer.height;
    this.staticLayerCtx = this.staticLayer.getContext('2d');
    if (!this.staticLayerCtx) {
      this.staticLayer = null;
      return;
    }

    const texture = this.assets.getImage(ImageKey.Texture);
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    const W = this.renderer.width;
    const H = this.renderer.height;

    this.staticLayerCtx.drawImage(texture, 5, 610, W, H, 0, 0, W, H);
    this.staticLayerCtx.drawImage(texture, 5, 5, W, H, 0, 0, W, H);
    this.staticLayerCtx.drawImage(
      sheet,
      SPRITE_GATE.x, SPRITE_GATE.y,
      SPRITE_GATE.w, SPRITE_GATE.h,
      GATE_POS_1_X, 0,
      GATE_RENDER_W, GATE_RENDER_H,
    );
    this.staticLayerCtx.drawImage(
      sheet,
      SPRITE_GATE.x, SPRITE_GATE.y,
      SPRITE_GATE.w, SPRITE_GATE.h,
      GATE_POS_3_X, 0,
      GATE_RENDER_W, GATE_RENDER_H,
    );
  }

  render(isAnimating: boolean): void {
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    if (this.staticLayer) {
      this.renderer.drawSprite({
        image: this.staticLayer,
        srcX: 0, srcY: 0,
        srcW: this.renderer.width, srcH: this.renderer.height,
        dstX: 0, dstY: 0,
        dstW: this.renderer.width, dstH: this.renderer.height,
      });
    }

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
  }
}
