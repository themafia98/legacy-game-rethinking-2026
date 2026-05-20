export enum ImageKey {
  Texture = 'texture',
  SpriteSheet = 'spriteSheet',
  MenuBackground = 'menuBackground',
  PauseIcon = 'pauseIcon',
  BoxBackground = 'boxBackground',
  Box = 'box',
}

export enum SoundId {
  MainMusic = 'mainMusic',
  AdditionalMusic = 'additionalMusic',
  LevelMusic = 'levelMusic',
  Shot = 'shot',
  Money = 'money',
  Eat = 'eat',
  Damage = 'damage',
  DeathBoss = 'deathBoss',
  DeathBat = 'deathBat',
  DeathBossExtra = 'deathBossExtra',
  GameOver = 'gameOver',
  LevelUp = 'levelUp',
  Select = 'select',
}

export interface EnemyConfig {
  type: string;
  name: string;
  dmg: number;
  health: number;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  frameCount: number;
  frameArray: number[];
}

export interface EnemyStartPosition {
  x: number;
  y: number;
}

export interface GameData {
  enemyStartPosition: EnemyStartPosition;
  essenceSettings: {
    birds: EnemyConfig;
    boss: EnemyConfig;
    bossExtra: EnemyConfig;
  };
}
