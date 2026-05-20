import { Renderer } from './Renderer';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import { Vector2 } from '../math/Vector2';

export interface MenuLink {
  label: string;
  position: Vector2;
  size: Vector2;
  isHovered: boolean;
}

export class MenuRenderer {
  private blink = 1;
  private blinkIncreasing = false;

  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  render(links: readonly MenuLink[], isDemoMode: boolean): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    const bg = this.assets.getImage(ImageKey.MenuBackground);
    this.renderer.drawPattern(bg, 0, 0, W, H);

    this.updateBlink();

    this.renderer.drawText({
      text: 'ARENA',
      x: W / 2,
      y: 100,
      font: 'bold 100px PIXI',
      fillStyle: 'rgb(255,215,0)',
      align: 'center',
      baseline: 'middle',
      shadowColor: 'brown',
      shadowBlur: 3,
      shadowOffsetX: 6,
      shadowOffsetY: 7,
      alpha: this.blink,
    });

    const playLink = links[0];
    const ratingLink = links[1];

    if (playLink) {
      this.renderer.drawText({
        text: 'PLAY',
        x: W / 2,
        y: H / 2.5,
        font: '100px PIXI',
        fillStyle: playLink.isHovered ? 'rgb(255,140,0)' : 'red',
        align: 'center',
        shadowColor: 'black',
      });
    }

    if (ratingLink) {
      this.renderer.drawText({
        text: 'RATING',
        x: W / 2,
        y: H / 1.8,
        font: '100px PIXI',
        fillStyle: ratingLink.isHovered ? 'rgb(255,140,0)' : 'red',
        align: 'center',
        shadowColor: 'black',
      });
    }

    if (isDemoMode) {
      this.renderer.drawText({
        text: 'This is a demo game.',
        x: W / 2, y: H - 120,
        font: '20px bold Arial',
        fillStyle: 'lightblue',
        align: 'center',
      });
      this.renderer.drawText({
        text: "Your device doesn't support full mode :(",
        x: W / 2, y: H - 100,
        font: '20px bold Arial',
        fillStyle: 'lightblue',
        align: 'center',
      });
      this.renderer.drawText({
        text: 'Need width 760px+ for full experience.',
        x: W / 2, y: H - 80,
        font: '20px bold Arial',
        fillStyle: 'lightblue',
        align: 'center',
      });
    }

    this.renderer.drawText({
      text: '© 2019',
      x: 40, y: H - 20,
      font: 'bold 14px Arial',
      fillStyle: 'white',
    });
    this.renderer.drawText({
      text: 'v2.0.0',
      x: W - 40, y: H - 20,
      font: 'bold 14px Arial',
      fillStyle: 'white',
      align: 'right',
    });
  }

  private updateBlink(): void {
    if (this.blink <= 0.5) this.blinkIncreasing = true;
    if (this.blink >= 1.0) this.blinkIncreasing = false;
    this.blink += this.blinkIncreasing ? 0.01 : -0.01;
  }
}
