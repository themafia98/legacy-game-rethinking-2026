import { Renderer } from './Renderer';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import { FADE_IN_SPEED, FADE_OUT_SPEED } from '../core/GameConfig';

export class FadeRenderer {
  private loadingPercent = 0;
  private alpha = 1;
  private done = false;

  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  reset(): void {
    this.loadingPercent = 0;
    this.alpha = 1;
    this.done = false;
  }

  isDone(): boolean {
    return this.done;
  }

  render(): void {
    const W = this.renderer.width;
    const H = this.renderer.height;
    const bg = this.assets.getImage(ImageKey.MenuBackground);

    this.renderer.drawSprite({
      image: bg,
      srcX: 0, srcY: 0,
      srcW: bg.width, srcH: bg.height,
      dstX: 0, dstY: 0,
      dstW: W, dstH: H,
    });

    if (this.loadingPercent < W / 2) {
      this.loadingPercent += FADE_IN_SPEED;
    } else if (this.alpha > 0) {
      this.alpha = Math.max(0, this.alpha - FADE_OUT_SPEED);
    } else {
      this.done = true;
      return;
    }

    const cof = (W / 2) / Math.max(1, this.loadingPercent);
    const percent = (100 / cof).toFixed(1);

    this.renderer.strokeRect(W / 4, H / 2.5, W / 2, H / 6, 'gold', 2);
    this.renderer.fillRect(W / 4, H / 2.5, this.loadingPercent, H / 6, 'brown', this.alpha);

    this.renderer.drawText({
      text: `Rendering... ${percent} %`,
      x: W / 2, y: H / 2,
      font: '30px PIXI',
      fillStyle: 'white',
      align: 'center',
      alpha: this.alpha,
    });
  }
}
