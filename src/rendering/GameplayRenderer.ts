import { Renderer } from './Renderer';
import { PlayerEntity } from '../entities/PlayerEntity';
import { AssetStore } from '../assets/AssetStore';
import { ImageKey } from '../types/AssetTypes';
import { Vector2 } from '../math/Vector2';
import {
  SPRITE_CURSOR,
  SPRITE_ITEM_RENDER_SIZE,
  BULLET_WIDTH, BULLET_HEIGHT,
  SPRITE_BIRD, SPRITE_BIRD_FRAMES,
  SPRITE_BOSS, SPRITE_BOSS_FRAMES,
  SPRITE_BOSS_EXTRA,
  SPRITE_BIRD_DEATH,
  SPRITE_BOSS_DEATH, SPRITE_BOSS_DEATH_FRAMES,
  SPRITE_BOSS_EXTRA_DEATH,
  SPRITE_COIN, SPRITE_FOOD, SPRITE_SCROLL,
  SHOW_ENEMY_HP,
} from '../core/GameConfig';
import { SimMemory, ENEMY_TYPE_BOSS, ENEMY_TYPE_BOSS_EXTRA, MAX_ENEMIES, MAX_PROJECTILES, MAX_ITEMS } from '../wasm/SimMemory';
import { GameSimulator } from '../wasm/GameSimulator';
import { getCurrentFrameX, tickSprite } from './SpriteAnimator';

// Item sprite lookup by type index
const ITEM_SPRITES = [SPRITE_COIN, SPRITE_FOOD, SPRITE_SCROLL] as const;

// Enemy idle sprite lookup by type
function enemyIdleSprite(type: number) {
  if (type === ENEMY_TYPE_BOSS)       return SPRITE_BOSS;
  if (type === ENEMY_TYPE_BOSS_EXTRA) return SPRITE_BOSS_EXTRA;
  return SPRITE_BIRD;
}

function enemyDeathSprite(type: number) {
  if (type === ENEMY_TYPE_BOSS)       return SPRITE_BOSS_DEATH;
  if (type === ENEMY_TYPE_BOSS_EXTRA) return SPRITE_BOSS_EXTRA_DEATH;
  return SPRITE_BIRD_DEATH;
}

function enemyFrames(type: number): readonly number[] {
  if (type === ENEMY_TYPE_BOSS || type === ENEMY_TYPE_BOSS_EXTRA) return SPRITE_BOSS_FRAMES;
  return SPRITE_BIRD_FRAMES;
}

// Per-projectile rotation state (outside WASM — display only)
const projRotations = new Float32Array(MAX_PROJECTILES);

export class GameplayRenderer {
  constructor(
    private readonly renderer: Renderer,
    private readonly assets: AssetStore,
  ) {}

  renderPlayer(player: PlayerEntity, dt: number): void {
    tickSprite(player.sprite, dt);
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    const frameX = getCurrentFrameX(player.sprite);

    this.renderer.drawSprite({
      image: sheet,
      srcX: frameX,
      srcY: player.sprite.sheetY,
      srcW: player.sprite.frameWidth,
      srcH: player.sprite.frameHeight,
      dstX: player.position.x,
      dstY: player.position.y,
      dstW: player.sprite.frameHeight,
      dstH: player.sprite.frameHeight,
    });
  }

  renderAllEnemies(sim: GameSimulator, dt: number): void {
    const mem = sim.mem;
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);

    for (let i = 0; i < MAX_ENEMIES; i++) {
      if (!mem.isEnemyAlive(i)) continue;

      const x = mem.getEnemyPosX(i);
      const y = mem.getEnemyPosY(i);
      const type = mem.getEnemyType(i);
      const onDeath = mem.isEnemyOnDeath(i);
      const frameIdx = mem.getEnemyFrameIndex(i);

      const sprite = onDeath ? enemyDeathSprite(type) : enemyIdleSprite(type);
      const frames = onDeath ? SPRITE_BOSS_DEATH_FRAMES : enemyFrames(type);
      const clampedIdx = Math.min(Math.floor(frameIdx), frames.length - 1);
      const frameX = sprite.x + (frames[clampedIdx] ?? 0) * sprite.w;

      if (!onDeath && SHOW_ENEMY_HP) {
        this.renderer.drawText({
          text: `${mem.getEnemyHealth(i)}HP`,
          x: x - 5, y: y - 5,
          font: 'bold 12px Arial',
          fillStyle: 'red',
        });
      }

      if (onDeath) {
        // Advance death frame each ~10 ticks
        sim.advanceDeathFrame(i);
      }

      void dt;

      this.renderer.drawSprite({
        image: sheet,
        srcX: frameX,
        srcY: sprite.y,
        srcW: sprite.w,
        srcH: sprite.h,
        dstX: x,
        dstY: y,
        dstW: sprite.h,
        dstH: sprite.h,
      });

      // Draw enemy projectile
      if (mem.isEnemyProjActive(i)) {
        this.renderer.drawSprite({
          image: sheet,
          srcX: mem.getEnemyProjSheetX(i),
          srcY: mem.getEnemyProjSheetY(i),
          srcW: 30, srcH: 30,
          dstX: mem.getEnemyProjPosX(i),
          dstY: mem.getEnemyProjPosY(i),
          dstW: SPRITE_ITEM_RENDER_SIZE,
          dstH: SPRITE_ITEM_RENDER_SIZE,
        });
      }
    }
  }

  renderAllProjectiles(mem: SimMemory): void {
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      if (!mem.isProjActive(i)) {
        projRotations[i] = 0;
        continue;
      }
      const rot = projRotations[i]! + 2;
      projRotations[i] = rot;

      this.renderer.drawRotated(
        sheet,
        193, 31, 32, 36,
        mem.getProjPosX(i), mem.getProjPosY(i),
        BULLET_WIDTH, BULLET_HEIGHT,
        rot,
      );
    }
  }

  renderAllItems(mem: SimMemory): void {
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    for (let i = 0; i < MAX_ITEMS; i++) {
      if (!mem.isItemActive(i)) continue;
      const type = mem.getItemType(i);
      const sp = ITEM_SPRITES[type] ?? SPRITE_COIN;
      this.renderer.drawSprite({
        image: sheet,
        srcX: sp.x, srcY: sp.y,
        srcW: sp.w, srcH: sp.h,
        dstX: mem.getItemPosX(i),
        dstY: mem.getItemPosY(i),
        dstW: SPRITE_ITEM_RENDER_SIZE,
        dstH: SPRITE_ITEM_RENDER_SIZE,
      });
    }
  }

  renderCursor(mousePos: Vector2): void {
    const sheet = this.assets.getImage(ImageKey.SpriteSheet);
    this.renderer.drawSprite({
      image: sheet,
      srcX: SPRITE_CURSOR.x, srcY: SPRITE_CURSOR.y,
      srcW: SPRITE_CURSOR.w, srcH: SPRITE_CURSOR.h,
      dstX: mousePos.x - SPRITE_CURSOR.w / 2,
      dstY: mousePos.y - SPRITE_CURSOR.h / 2,
      dstW: SPRITE_CURSOR.w,
      dstH: SPRITE_CURSOR.h,
    });
  }
}
