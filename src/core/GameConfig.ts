export const CANVAS_WIDTH_DESKTOP = 800;
export const CANVAS_HEIGHT_DESKTOP = 620;
export const CANVAS_MOBILE_BREAKPOINT_WIDTH = 800;
export const CANVAS_MOBILE_BREAKPOINT_HEIGHT = 620;

export const PLAYER_MAX_HEALTH = 200;
export const PLAYER_SPEED = 200;
export const PLAYER_BASE_DAMAGE = 25;

export const BULLET_SPEED = 320;
export const BULLET_FIRE_DELAY_MS = 300;
export const BULLET_WIDTH = 25;
export const BULLET_HEIGHT = 27;
export const BULLET_BOUNDS_LEFT = 35;
export const BULLET_BOUNDS_RIGHT = 727;
export const BULLET_BOUNDS_TOP = 50;
export const BULLET_BOUNDS_BOTTOM = 440;

export const PLAYER_BOUNDS_LEFT = 35;
export const PLAYER_BOUNDS_RIGHT = 727;
export const PLAYER_BOUNDS_TOP = 55;
export const PLAYER_BOUNDS_BOTTOM = 440;

export const ENEMY_BOUNDS_LEFT = 70;
export const ENEMY_BOUNDS_RIGHT = 700;
export const ENEMY_BOUNDS_TOP = 70;
export const ENEMY_BOUNDS_BOTTOM = 400;

export const ENEMY_PROJECTILE_SPEED = 150;
export const ENEMY_PROJECTILE_UPDATE_DELAY_MS = 10;
export const ENEMY_PROJECTILE_BOUNDS_LEFT = 40;
export const ENEMY_PROJECTILE_BOUNDS_RIGHT = 755;
export const ENEMY_PROJECTILE_BOUNDS_TOP = 60;
export const ENEMY_PROJECTILE_BOUNDS_BOTTOM = 440;

export const COLLISION_BOX_PLAYER: [number, number] = [32, 32];
export const COLLISION_BOX_ENEMY: [number, number] = [30, 30];
export const COLLISION_BOX_ITEM: [number, number] = [26, 26];
export const COLLISION_BOX_UPGRADE: [number, number] = [30, 30];
export const COLLISION_BOX_BULLET: [number, number] = [35, 35];

export const ITEM_HEALTH_RESTORE_RATIO = 0.16;
export const ITEM_DAMAGE_UPGRADE = 5;
export const ITEM_COIN_POINTS = 10;
export const ITEM_DROP_CHANCE = 0.5;
export const ITEM_COIN_CHANCE = 0.7;
export const ITEM_FOOD_CHANCE = 0.5;
export const ITEM_SCROLL_CHANCE = 0.2;

export const ENEMY_DEATH_POINTS = 25;
export const ENEMY_HIT_SPRITE_RESET_MS = 200;
export const DAMAGE_SOUND_COOLDOWN_MS = 200;

export const STAGE_WIN = 20;
export const STAGE_BOSS_START = 7;
export const STAGE_EXTRA_BOSS_START = 10;

export const FADE_IN_SPEED = 2.5;
export const FADE_OUT_SPEED = 0.05;

export const LEADERBOARD_MAX_DISPLAY = 8;
export const LEADERBOARD_MAX_DISPLAY_MOBILE = 5;
export const LEADERBOARD_ROW_HEIGHT = 32;
export const LEADERBOARD_START_Y = 275;
export const LEADERBOARD_START_Y_MOBILE = 233;

export const DB_MAX_WRITES_PER_MINUTE = 3;
export const DB_WRITE_RESET_INTERVAL_MS = 60000;

export const MUSIC_START_DELAY_MS = 2500;
export const GAME_START_DELAY_MS = 3000;

// ──────────────────────────────────────────────
// Sprite sheet coordinates (all from sheet_objects_heroes.png)
// ──────────────────────────────────────────────

export const SPRITE_PLAYER_DOWN = { x: 700, y: 0, w: 34, h: 34 };
export const SPRITE_PLAYER_RIGHT = { x: 572, y: 0, w: 34, h: 34 };
export const SPRITE_PLAYER_LEFT = { x: 828, y: 0, w: 33, h: 34 };
export const SPRITE_PLAYER_UP = { x: 444, y: 0, w: 34, h: 34 };
export const SPRITE_PLAYER_UP_RIGHT = { x: 510, y: 0, w: 33, h: 34 };
export const SPRITE_PLAYER_UP_LEFT = { x: 891, y: 0, w: 34, h: 34 };
export const SPRITE_PLAYER_DOWN_LEFT = { x: 766, y: 0, w: 33, h: 34 };
export const SPRITE_PLAYER_DOWN_RIGHT = { x: 637, y: 0, w: 33, h: 34 };
export const SPRITE_PLAYER_HIT = { x: 956, y: 0, w: 34, h: 34 };
export const SPRITE_PLAYER_FRAMES = [0, 1];
export const SPRITE_PLAYER_ANIM_SPEED = 2;
export const SPRITE_PLAYER_START_X = 700;

export const SPRITE_PLAYER_BULLET = { x: 193, y: 31, w: 32, h: 36 };

export const SPRITE_BIRD = { x: 446, y: 100, w: 32, h: 20 };
export const SPRITE_BIRD_ANIM_SPEED = 5;
export const SPRITE_BIRD_FRAMES = [0, 1, 2, 3, 4, 5];

export const SPRITE_BOSS = { x: 964, y: 226, w: 60, h: 60 };
export const SPRITE_BOSS_LEFT = { x: 712, y: 226, w: 60, h: 60 };
export const SPRITE_BOSS_RIGHT = { x: 1226, y: 226, w: 60, h: 60 };
export const SPRITE_BOSS_UP = { x: 964, y: 226, w: 60, h: 60 };
export const SPRITE_BOSS_DOWN = { x: 452, y: 226, w: 60, h: 60 };
export const SPRITE_BOSS_DEATH = { x: 1540, y: 232, w: 60, h: 60 };
export const SPRITE_BOSS_ANIM_SPEED = 2;
export const SPRITE_BOSS_FRAMES = [0, 1];
export const SPRITE_BOSS_DEATH_FRAMES = [0, 1, 2];

export const SPRITE_BOSS_EXTRA = { x: 964, y: 288, w: 60, h: 60 };
export const SPRITE_BOSS_EXTRA_DEATH = { x: 1542, y: 298, w: 60, h: 60 };

export const SPRITE_BIRD_DEATH = { x: 960, y: 102, w: 32, h: 20 };
export const SPRITE_BIRD_DEATH_FRAMES = [0, 1, 2];

export const SPRITE_ENEMY_BULLET_COMMON = { x: 324, y: 0, w: 30, h: 30 };
export const SPRITE_ENEMY_BULLET_BOSS = { x: 192, y: 2, w: 30, h: 30 };
export const SPRITE_ENEMY_BULLET_BOSS_EXTRA = { x: 354, y: 2, w: 30, h: 30 };

export const SPRITE_COIN = { x: 69, y: 30, w: 26, h: 37 };
export const SPRITE_FOOD = { x: 95, y: 30, w: 39, h: 40 };
export const SPRITE_SCROLL = { x: 128, y: 192, w: 42, h: 44 };
export const SPRITE_ITEM_RENDER_SIZE = 15;

export const SPRITE_CURSOR = { x: 255, y: 192, w: 65, h: 65 };
export const SPRITE_POINTS_ICON = { x: -12, y: 20, w: 45, h: 45 };

export const SPRITE_GATE = { x: -14, y: 190, w: 85, h: 65 };
export const GATE_RENDER_W = 95;
export const GATE_RENDER_H = 65;
export const GATE_POS_1_X = 109;
export const GATE_POS_2_X = 349;
export const GATE_POS_3_X = 588;
export const GATE_OPEN_LIMIT = -50;

export const HUD_PANEL_Y = 542;
export const HUD_PANEL_H = 80;
export const HUD_HP_BAR_W = 204;
export const HUD_HP_BAR_H = 25;
export const HUD_POINTS_ICON_DEST = { x: 0, y: 560, w: 35, h: 35 };
export const HUD_PAUSE_BUTTON_SIZE = 20;

export const RANDOM_SIGN_VALUES: readonly number[] = [-1.2, -1, 1, 1.2];
export const RANDOM_SPAWN_SCALE_VALUES: readonly number[] = [0.3, 0.6, 0.8, 0.9, 1.2];
