import { Renderer } from './Renderer';
import { PlayerEntity } from '../entities/PlayerEntity';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import {
  HUD_PANEL_Y, HUD_PANEL_H, HUD_HP_BAR_W, HUD_HP_BAR_H,
  HUD_POINTS_ICON_DEST, HUD_PAUSE_BUTTON_SIZE,
  SPRITE_POINTS_ICON,
} from '../core/GameConfig';

export class HUDRenderer {
  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  render(player: PlayerEntity, stage: number, isMobile: boolean): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    this.renderer.drawLinearGradientRect(0, HUD_PANEL_Y, W, HUD_PANEL_H, [
      { offset: 0, color: 'rgb(105,105,105)' },
      { offset: 0.5, color: 'rgb(128,128,128)' },
      { offset: 1, color: 'rgb(169,169,169)' },
    ]);

    const hpBarX = isMobile ? W / 4 : W / 2.7;
    const hpBarY = 570;

    this.renderer.strokeRect(hpBarX, hpBarY, HUD_HP_BAR_W, HUD_HP_BAR_H, 'blue', 5);

    const healthWidth = Math.max(0, player.health);
    if (healthWidth > 0) {
      this.renderer.fillRect(hpBarX + 2, hpBarY + 2, healthWidth, 20, 'crimson');
    }

    if (!isMobile) {
      this.renderer.drawText({
        text: `${player.health}HP`,
        x: W / 3,
        y: 588,
        font: 'bold 15px PIXI',
        fillStyle: 'white',
      });
    }

    this.renderer.drawText({
      text: `${stage} LVL`,
      x: 10,
      y: 30,
      font: 'bold 30px PIXI',
      fillStyle: 'red',
      shadowColor: 'rgb(255,255,25)',
      shadowOffsetX: 2,
      shadowOffsetY: 3,
    });

    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    this.renderer.drawSprite({
      image: sheet,
      srcX: SPRITE_POINTS_ICON.x,
      srcY: SPRITE_POINTS_ICON.y,
      srcW: SPRITE_POINTS_ICON.w,
      srcH: SPRITE_POINTS_ICON.h,
      dstX: HUD_POINTS_ICON_DEST.x,
      dstY: HUD_POINTS_ICON_DEST.y,
      dstW: HUD_POINTS_ICON_DEST.w,
      dstH: HUD_POINTS_ICON_DEST.h,
    });

    this.renderer.drawText({
      text: String(player.points),
      x: 40,
      y: 592,
      font: 'bold 27px PIXI',
      fillStyle: 'gold',
    });

    const pauseIcon = this.assets.getImage(ImageKey.PauseIcon);
    this.renderer.drawSprite({
      image: pauseIcon,
      srcX: 0,
      srcY: 0,
      srcW: pauseIcon.width,
      srcH: pauseIcon.height,
      dstX: W - 40,
      dstY: H - 48,
      dstW: HUD_PAUSE_BUTTON_SIZE,
      dstH: HUD_PAUSE_BUTTON_SIZE,
    });
  }

  renderTutorialOverlay(showTutorial: boolean): void {
    if (!showTutorial) return;
    this.renderer.fillRect(0, 0, this.renderer.width, 100, 'black', 0.8);
    this.renderer.drawText({
      text: 'Move with the WASD keys',
      x: this.renderer.width / 2,
      y: 35,
      font: '30px PIXI bold',
      fillStyle: 'white',
      align: 'center',
    });
    this.renderer.drawText({
      text: 'Press any key',
      x: this.renderer.width / 2,
      y: 65,
      font: '20px PIXI bold',
      fillStyle: 'lightblue',
      align: 'center',
    });
  }
}
