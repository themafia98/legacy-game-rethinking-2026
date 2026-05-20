import { AssetStore } from '../assets/AssetStore';
import { ScalarRng } from '../core/ScalarRng';
import { GameSimulator } from '../wasm/GameSimulator';
import { ENEMY_TYPE_COMMON, ENEMY_TYPE_BOSS, ENEMY_TYPE_BOSS_EXTRA } from '../wasm/SimMemory';
import { RANDOM_SIGN_VALUES, RANDOM_SPAWN_SCALE_VALUES } from '../core/GameConfig';

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
  rng: ScalarRng,
): void {
  sim.mem.writeEnemyStaging(index, {
    posX:      baseX * rng.pick(RANDOM_SPAWN_SCALE_VALUES),
    posY:      baseY * rng.pick(RANDOM_SPAWN_SCALE_VALUES),
    speedX:    rng.pick(RANDOM_SIGN_VALUES),
    speedY:    rng.pick(RANDOM_SIGN_VALUES),
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
  rng: ScalarRng,
): void {
  const data = assets.gameData.essenceSettings;
  const spawnPos = assets.gameData.enemyStartPosition;

  const birds:    EnemyTemplate = { type: ENEMY_TYPE_COMMON,     health: data.birds.health,     damage: data.birds.dmg };
  const boss:     EnemyTemplate = { type: ENEMY_TYPE_BOSS,       health: data.boss.health,      damage: data.boss.dmg };
  const bossExtra: EnemyTemplate = { type: ENEMY_TYPE_BOSS_EXTRA, health: data.bossExtra.health, damage: data.bossExtra.dmg };

  let idx = 0;

  if (stage < 7) {
    for (let i = 0; i < stage; i++) {
      writeEnemy(sim, idx++, birds, spawnPos.x, spawnPos.y, rng);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      writeEnemy(sim, idx++, birds, spawnPos.x, spawnPos.y, rng);
    }

    if (stage >= 7 && stage <= 15) {
      for (let j = 0; j < bossCount; j++) {
        writeEnemy(sim, idx++, boss, spawnPos.x, spawnPos.y, rng);
      }
    }

    if (stage >= 10) {
      for (let j = 0; j < extraBossCount; j++) {
        writeEnemy(sim, idx++, bossExtra, spawnPos.x, spawnPos.y, rng);
      }
    }

    if (stage > 15) {
      for (let i = 0; i < stage - 5; i++) {
        writeEnemy(sim, idx++, bossExtra, spawnPos.x, spawnPos.y, rng);
      }
    }
  }

  sim.initEnemies(idx);
}
