import { Renderer } from './Renderer';
import { PlayerEntity } from '../entities/PlayerEntity';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';

export class PauseRenderer {
  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  render(player: PlayerEntity, menuLinkHovered: boolean): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    const bg = this.assets.getImage(ImageKey.MenuBackground);
    const rectX = W / 6;
    const rectY = 40;
    const rectW = W / 1.5;
    const rectH = H / 1.4;

    this.renderer.drawSprite({
      image: bg,
      srcX: rectX, srcY: rectY,
      srcW: rectW, srcH: rectH,
      dstX: rectX, dstY: rectY,
      dstW: rectW, dstH: rectH,
    });

    this.renderer.strokeRect(rectX + 10, rectY + 10, rectW - 20, rectH - 20, 'gold');

    this.renderer.drawText({
      text: 'PAUSE',
      x: W / 2.1, y: 100,
      font: '50px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'rgb(50,50,50)',
      shadowOffsetX: 2,
      shadowOffsetY: 3,
    });

    this.renderer.drawText({
      text: 'If you leave the game, all saves will be lost.',
      x: W / 2 - 5, y: 135,
      font: '25px PIXI',
      fillStyle: 'gold',
      align: 'center',
      shadowColor: 'rgb(50,80,50)',
      shadowOffsetX: 2,
      shadowOffsetY: 3,
    });

    this.renderer.drawText({
      text: `Throws: ${player.throwCount}`,
      x: W / 2 - 20, y: 200,
      font: '35px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'brown',
    });

    this.renderer.drawText({
      text: `Kills: ${player.killCount}`,
      x: W / 2 - 20, y: 260,
      font: '35px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'brown',
    });

    this.renderer.drawText({
      text: 'MENU',
      x: W / 2.1, y: 450,
      font: '40px PIXI',
      fillStyle: menuLinkHovered ? 'rgb(255,140,0)' : 'red',
      align: 'center',
      shadowColor: 'brown',
      shadowOffsetX: 2,
      shadowOffsetY: 3,
    });
  }
}
