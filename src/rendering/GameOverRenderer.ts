import { Renderer } from './Renderer';
import { PlayerEntity } from '../entities/PlayerEntity';

export class GameOverRenderer {
  constructor(private readonly renderer: Renderer) {}

  render(player: PlayerEntity, isWin: boolean, menuLinkHovered: boolean): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    this.renderer.fillRect(0, 0, W, H - 75, 'grey', 0.8);

    if (isWin) {
      this.renderer.drawText({
        text: 'W I N',
        x: W / 2, y: 100,
        font: '100px PIXI',
        fillStyle: 'gold',
        align: 'center',
      });
    } else {
      this.renderer.drawText({
        text: 'GAME OVER',
        x: W / 2, y: 100,
        font: '100px PIXI',
        fillStyle: 'red',
        align: 'center',
      });
    }

    this.renderer.drawText({
      text: `Points: ${player.points}`,
      x: W / 2, y: 150,
      font: '40px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'brown',
      shadowOffsetX: 2,
      shadowOffsetY: 3,
    });

    this.renderer.drawText({
      text: `Throws: ${player.throwCount}`,
      x: W / 2, y: 200,
      font: '40px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'brown',
    });

    this.renderer.drawText({
      text: `Kills: ${player.killCount}`,
      x: W / 2, y: 250,
      font: '40px PIXI',
      fillStyle: 'yellow',
      align: 'center',
      shadowColor: 'brown',
    });

    this.renderer.drawText({
      text: 'MENU',
      x: W / 2.02, y: 450,
      font: '50px PIXI',
      fillStyle: menuLinkHovered ? 'rgb(255,140,0)' : 'red',
      align: 'center',
    });
  }
}
