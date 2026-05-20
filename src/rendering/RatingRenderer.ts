import { Renderer } from './Renderer';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import { LeaderboardEntry } from '../types/LeaderboardTypes';
import {
  LEADERBOARD_MAX_DISPLAY,
  LEADERBOARD_MAX_DISPLAY_MOBILE,
  LEADERBOARD_ROW_HEIGHT,
  LEADERBOARD_START_Y,
  LEADERBOARD_START_Y_MOBILE,
} from '../core/GameConfig';

export class RatingRenderer {
  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  render(entries: readonly LeaderboardEntry[], returnLinkHovered: boolean, isMobile: boolean): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    const bg = this.assets.getImage(ImageKey.MenuBackground);
    this.renderer.drawPattern(bg, 0, 0, W, H);

    const titleFont = isMobile ? 'bold 60px PIXI' : 'bold 80px PIXI';
    const titleY = isMobile ? 40 : 100;

    this.renderer.drawText({
      text: 'THE BEST',
      x: W / 2, y: titleY,
      font: titleFont,
      fillStyle: 'rgb(255,215,0)',
      align: 'center',
      shadowColor: 'brown',
      shadowBlur: 3,
      shadowOffsetX: 6,
      shadowOffsetY: 7,
    });

    const returnFont = isMobile ? 'bold 40px PIXI' : 'bold 50px PIXI';
    const returnY = isMobile ? 120 : 165;

    this.renderer.drawText({
      text: 'RETURN',
      x: W / 2, y: returnY,
      font: returnFont,
      fillStyle: returnLinkHovered ? 'rgb(255,140,0)' : 'red',
      align: 'center',
    });

    const tableX = W / 9.4;
    const tableY = isMobile ? 140 : 200;
    const tableW = W / 1.3;
    const tableH = H / 1.8;

    this.renderer.strokeRect(tableX, tableY, tableW, tableH, 'yellow');
    this.renderer.fillRect(tableX, tableY, tableW, tableH, 'black');

    if (!isMobile) {
      this.renderer.drawText({
        text: 'NAME', x: tableX + 10, y: tableY + 35,
        font: 'bold 45px PIXI', fillStyle: 'yellow', align: 'left',
      });
      this.renderer.drawText({
        text: 'POINTS', x: tableW - 70, y: tableY + 35,
        font: 'bold 45px PIXI', fillStyle: 'yellow', align: 'left',
      });
    }

    const maxRows = isMobile ? LEADERBOARD_MAX_DISPLAY_MOBILE : LEADERBOARD_MAX_DISPLAY;
    const displayCount = Math.min(entries.length, maxRows);
    const startY = isMobile ? LEADERBOARD_START_Y_MOBILE : LEADERBOARD_START_Y;

    for (let i = 0; i < displayCount; i++) {
      const entry = entries[entries.length - 1 - i];
      if (!entry) continue;
      const rowY = startY + i * LEADERBOARD_ROW_HEIGHT;

      this.renderer.drawText({
        text: `${i + 1}. ${entry.name}`,
        x: tableX + 10, y: rowY,
        font: 'bold 40px PIXI', fillStyle: 'yellow', align: 'left',
      });

      if (!isMobile) {
        this.renderer.drawText({
          text: String(entry.points),
          x: tableW - 50, y: rowY,
          font: 'bold 40px PIXI', fillStyle: 'yellow', align: 'left',
        });
      }
    }

    this.renderer.drawText({
      text: '© 2019', x: 40, y: H - 20,
      font: 'bold 14px Arial', fillStyle: 'white',
    });
    this.renderer.drawText({
      text: 'v2.0.0', x: W - 40, y: H - 20,
      font: 'bold 14px Arial', fillStyle: 'white', align: 'right',
    });
  }
}
