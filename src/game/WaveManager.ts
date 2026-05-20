import { STAGE_WIN, STAGE_BOSS_START, STAGE_EXTRA_BOSS_START } from '../core/GameConfig';

export class WaveManager {
  stage = 0;
  bossCount = 0;
  extraBossCount = 1;

  reset(): void {
    this.stage = 0;
    this.bossCount = 0;
    this.extraBossCount = 1;
  }

  advance(): void {
    this.stage++;

    if (this.stage >= STAGE_EXTRA_BOSS_START) {
      this.bossCount++;
      this.extraBossCount++;
    } else if (this.stage >= STAGE_BOSS_START) {
      this.bossCount++;
    }
  }

  isWinStage(): boolean {
    return this.stage >= STAGE_WIN;
  }
}
