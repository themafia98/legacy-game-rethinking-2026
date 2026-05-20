import { AssetStore } from '../assets/AssetStore';
import { GameSimulator } from '../wasm/GameSimulator';
import { ENEMY_TYPE_COMMON, ENEMY_TYPE_BOSS, ENEMY_TYPE_BOSS_EXTRA } from '../wasm/SimMemory';
import { RANDOM_SIGN_VALUES, RANDOM_SPAWN_SCALE_VALUES } from '../core/GameConfig';

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomSpeed(): number {
  return randomFrom(RANDOM_SIGN_VALUES);
}

function randomSpawnScale(): number {
  return randomFrom(RANDOM_SPAWN_SCALE_VALUES);
}

interface EnemyTemplate {
  type: number;
  health: number;
  damage: number;
}

function writeEnemy(
  sim: GameSimulator,
  index: number,
  tmpl: EnemyTemplate,
  baseX: number,
  baseY: number,
): void {
  sim.mem.writeEnemyStaging(index, {
    posX:      baseX * randomSpawnScale(),
    posY:      baseY * randomSpawnScale(),
    speedX:    randomSpeed(),
    speedY:    randomSpeed(),
    health:    tmpl.health,
    maxHealth: tmpl.health,
    damage:    tmpl.damage,
    type:      tmpl.type,
  });
}

export function spawnWave(
  stage: number,
  bossCount: number,
  extraBossCount: number,
  assets: AssetStore,
  sim: GameSimulator,
): void {
  const data = assets.gameData.essenceSettings;
  const spawnPos = assets.gameData.enemyStartPosition;

  const birds:    EnemyTemplate = { type: ENEMY_TYPE_COMMON,     health: data.birds.health,     damage: data.birds.dmg };
  const boss:     EnemyTemplate = { type: ENEMY_TYPE_BOSS,       health: data.boss.health,      damage: data.boss.dmg };
  const bossExtra: EnemyTemplate = { type: ENEMY_TYPE_BOSS_EXTRA, health: data.bossExtra.health, damage: data.bossExtra.dmg };

  let idx = 0;

  if (stage < 7) {
    for (let i = 0; i < stage; i++) {
      writeEnemy(sim, idx++, birds, spawnPos.x, spawnPos.y);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      writeEnemy(sim, idx++, birds, spawnPos.x, spawnPos.y);
    }

    if (stage >= 7 && stage <= 15) {
      for (let j = 0; j < bossCount; j++) {
        writeEnemy(sim, idx++, boss, spawnPos.x, spawnPos.y);
      }
    }

    if (stage >= 10) {
      for (let j = 0; j < extraBossCount; j++) {
        writeEnemy(sim, idx++, bossExtra, spawnPos.x, spawnPos.y);
      }
    }

    if (stage > 15) {
      for (let i = 0; i < stage - 5; i++) {
        writeEnemy(sim, idx++, bossExtra, spawnPos.x, spawnPos.y);
      }
    }
  }

  sim.initEnemies(idx);
}
