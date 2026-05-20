// JS-side typed views on the shared WebAssembly.Memory buffer.
// WASM and JS point at the same bytes — no serialisation, no copies.
//
// Byte-to-element index: Float32Array / Int32Array are 4 B per element,
// so byteOffset >> 2 converts to the correct array index.
//
// All constants must stay in sync with assembly/memory.ts.

const PLAYER_BASE  = 0;
const ENEMY_BASE   = 64;
const ENEMY_STRIDE = 80;
const PROJ_BASE    = 5184;
const PROJ_STRIDE  = 32;
const ITEM_BASE    = 7232;
const ITEM_STRIDE  = 16;
const RESULT_BASE  = 11328;

export const STAGING_BASE        = 11392;
export const ENEMY_STRIDE_EXPORT = ENEMY_STRIDE;

export const MAX_ENEMIES     = 64;
export const MAX_PROJECTILES = 64;
export const MAX_ITEMS       = 256;

export const EVT_DAMAGE      = 0x01;
export const EVT_ENEMY_DIED  = 0x02;
export const EVT_ITEM_PICKED = 0x04;
export const EVT_PLAYER_DEAD = 0x08;

export const ENEMY_TYPE_COMMON     = 0;
export const ENEMY_TYPE_BOSS       = 1;
export const ENEMY_TYPE_BOSS_EXTRA = 2;

export const ITEM_TYPE_COIN   = 0;
export const ITEM_TYPE_FOOD   = 1;
export const ITEM_TYPE_SCROLL = 2;

export class SimMemory {
  readonly f32: Float32Array;
  readonly i32: Int32Array;
  readonly u8:  Uint8Array;

  constructor(memory: WebAssembly.Memory) {
    this.f32 = new Float32Array(memory.buffer);
    this.i32 = new Int32Array(memory.buffer);
    this.u8  = new Uint8Array(memory.buffer);
  }

  // ── Player ────────────────────────────────────────────────────────────────

  get playerPosX():       number  { return this.f32[(PLAYER_BASE +  0) >> 2]!; }
  get playerPosY():       number  { return this.f32[(PLAYER_BASE +  4) >> 2]!; }
  get playerHealth():     number  { return this.i32[(PLAYER_BASE +  8) >> 2]!; }
  get playerMaxHealth():  number  { return this.i32[(PLAYER_BASE + 12) >> 2]!; }
  get playerDamage():     number  { return this.i32[(PLAYER_BASE + 16) >> 2]!; }
  get playerSpeed():      number  { return this.i32[(PLAYER_BASE + 20) >> 2]!; }
  get playerPoints():     number  { return this.i32[(PLAYER_BASE + 24) >> 2]!; }
  get playerKillCount():  number  { return this.i32[(PLAYER_BASE + 28) >> 2]!; }
  get playerThrowCount(): number  { return this.i32[(PLAYER_BASE + 32) >> 2]!; }
  get playerAlive():      boolean { return this.u8[PLAYER_BASE + 36]! !== 0; }
  get playerDeathSnd():   boolean { return this.u8[PLAYER_BASE + 37]! !== 0; }

  setPlayerPosX(v: number):      void { this.f32[(PLAYER_BASE +  0) >> 2] = v; }
  setPlayerPosY(v: number):      void { this.f32[(PLAYER_BASE +  4) >> 2] = v; }
  setPlayerHealth(v: number):    void { this.i32[(PLAYER_BASE +  8) >> 2] = v; }
  setPlayerDamage(v: number):    void { this.i32[(PLAYER_BASE + 16) >> 2] = v; }
  setPlayerPoints(v: number):    void { this.i32[(PLAYER_BASE + 24) >> 2] = v; }
  setPlayerDeathSnd(v: boolean): void { this.u8[PLAYER_BASE + 37] = v ? 1 : 0; }

  // ── Enemy slot i ──────────────────────────────────────────────────────────

  private eBase(i: number): number { return ENEMY_BASE + i * ENEMY_STRIDE; }

  getEnemyPosX(i: number):       number  { return this.f32[(this.eBase(i) +  0) >> 2]!; }
  getEnemyPosY(i: number):       number  { return this.f32[(this.eBase(i) +  4) >> 2]!; }
  getEnemySpeedX(i: number):     number  { return this.f32[(this.eBase(i) +  8) >> 2]!; }
  getEnemySpeedY(i: number):     number  { return this.f32[(this.eBase(i) + 12) >> 2]!; }
  getEnemyHealth(i: number):     number  { return this.i32[(this.eBase(i) + 16) >> 2]!; }
  getEnemyMaxHealth(i: number):  number  { return this.i32[(this.eBase(i) + 20) >> 2]!; }
  getEnemyDamage(i: number):     number  { return this.i32[(this.eBase(i) + 24) >> 2]!; }
  getEnemyType(i: number):       number  { return this.u8[this.eBase(i) + 28]!; }
  isEnemyAlive(i: number):       boolean { return this.u8[this.eBase(i) + 29]! !== 0; }
  isEnemyOnDeath(i: number):     boolean { return this.u8[this.eBase(i) + 30]! !== 0; }
  isEnemyDeathDone(i: number):   boolean { return this.u8[this.eBase(i) + 31]! !== 0; }
  getEnemyProjPosX(i: number):   number  { return this.f32[(this.eBase(i) + 32) >> 2]!; }
  getEnemyProjPosY(i: number):   number  { return this.f32[(this.eBase(i) + 36) >> 2]!; }
  isEnemyProjActive(i: number):  boolean { return this.u8[this.eBase(i) + 48]! !== 0; }
  getEnemyProjSheetX(i: number): number  { return this.i32[(this.eBase(i) + 52) >> 2]!; }
  getEnemyProjSheetY(i: number): number  { return this.i32[(this.eBase(i) + 56) >> 2]!; }
  getEnemyFrameIndex(i: number): number  { return this.i32[(this.eBase(i) + 60) >> 2]!; }
  isEnemyPlayOnce(i: number):    boolean { return this.u8[this.eBase(i) + 64]! !== 0; }
  isEnemyOnceDone(i: number):    boolean { return this.u8[this.eBase(i) + 65]! !== 0; }

  setEnemyAlive(i: number, v: boolean): void { this.u8[this.eBase(i) + 29] = v ? 1 : 0; }

  writeEnemyStaging(i: number, data: EnemyStagingData): void {
    const base = STAGING_BASE + i * ENEMY_STRIDE;
    this.f32[(base +  0) >> 2] = data.posX;
    this.f32[(base +  4) >> 2] = data.posY;
    this.f32[(base +  8) >> 2] = data.speedX;
    this.f32[(base + 12) >> 2] = data.speedY;
    this.i32[(base + 16) >> 2] = data.health;
    this.i32[(base + 20) >> 2] = data.maxHealth;
    this.i32[(base + 24) >> 2] = data.damage;
    this.u8[base + 28]         = data.type;
  }

  // ── Projectile slot i ─────────────────────────────────────────────────────

  private pBase(i: number): number { return PROJ_BASE + i * PROJ_STRIDE; }

  getProjPosX(i: number):  number  { return this.f32[(this.pBase(i) +  0) >> 2]!; }
  getProjPosY(i: number):  number  { return this.f32[(this.pBase(i) +  4) >> 2]!; }
  getProjDirX(i: number):  number  { return this.f32[(this.pBase(i) +  8) >> 2]!; }
  getProjDirY(i: number):  number  { return this.f32[(this.pBase(i) + 12) >> 2]!; }
  isProjActive(i: number): boolean { return this.u8[this.pBase(i) + 20]! !== 0; }

  // ── Item slot i ───────────────────────────────────────────────────────────

  private iBase(i: number): number { return ITEM_BASE + i * ITEM_STRIDE; }

  getItemPosX(i: number):  number  { return this.f32[(this.iBase(i) + 0) >> 2]!; }
  getItemPosY(i: number):  number  { return this.f32[(this.iBase(i) + 4) >> 2]!; }
  getItemType(i: number):  number  { return this.u8[this.iBase(i) + 8]!; }
  isItemActive(i: number): boolean { return this.u8[this.iBase(i) + 9]! !== 0; }

  // ── Result buffer ─────────────────────────────────────────────────────────

  get resultEventFlags():  number { return this.i32[(RESULT_BASE +  0) >> 2]!; }
  get resultPointsDelta(): number { return this.i32[(RESULT_BASE +  4) >> 2]!; }
  get resultHealthDelta(): number { return this.i32[(RESULT_BASE +  8) >> 2]!; }
  get resultDamageDelta(): number { return this.i32[(RESULT_BASE + 12) >> 2]!; }
  get resultKillsDelta():  number { return this.i32[(RESULT_BASE + 16) >> 2]!; }
}

export interface EnemyStagingData {
  posX:      number;
  posY:      number;
  speedX:    number;
  speedY:    number;
  health:    number;
  maxHealth: number;
  damage:    number;
  type:      number;
}
