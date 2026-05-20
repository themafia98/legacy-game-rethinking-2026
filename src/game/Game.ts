import { GameLoop } from '../core/GameLoop';
import { SceneManager } from '../core/SceneManager';
import { GameScene } from '../types/GameScene';
import { AssetStore } from '../assets/AssetStore';
import { AudioManager } from '../audio/AudioManager';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../rendering/Renderer';
import { GameplayRenderer } from '../rendering/GameplayRenderer';
import { HUDRenderer } from '../rendering/HUDRenderer';
import { MenuRenderer } from '../rendering/MenuRenderer';
import { PauseRenderer } from '../rendering/PauseRenderer';
import { GameOverRenderer } from '../rendering/GameOverRenderer';
import { RatingRenderer } from '../rendering/RatingRenderer';
import { FadeRenderer } from '../rendering/FadeRenderer';
import { ArenaRenderer } from '../rendering/ArenaRenderer';
import { PlayerEntity } from '../entities/PlayerEntity';
import { WaveManager } from './WaveManager';
import { FirebaseService } from '../services/FirebaseService';
import { NetworkService } from '../services/NetworkService';
import { LeaderboardEntry } from '../types/LeaderboardTypes';
import { SoundId } from '../types/AssetTypes';
import { Vector2 } from '../math/Vector2';
import { GameSimulator } from '../wasm/GameSimulator';
import { EVT_DAMAGE, EVT_ENEMY_DIED, EVT_ITEM_PICKED, EVT_PLAYER_DEAD } from '../wasm/SimMemory';

import { updatePlayer, advanceStartAnimation } from '../systems/PlayerSystem';
import { spawnWave } from '../systems/SpawnSystem';

import {
  MUSIC_START_DELAY_MS,
  PLAYER_MAX_HEALTH, PLAYER_BASE_DAMAGE, PLAYER_SPEED,
} from '../core/GameConfig';

interface UILink {
  label: string;
  position: Vector2;
  size: Vector2;
  isHovered: boolean;
}

export class Game {
  private readonly loop: GameLoop;
  private readonly scene: SceneManager;
  private readonly renderer: Renderer;
  private readonly audio: AudioManager;
  private readonly input: InputManager;
  private readonly assets: AssetStore;
  private readonly firebase: FirebaseService;
  private readonly network: NetworkService;
  private readonly sim: GameSimulator;

  private readonly gameplayRenderer: GameplayRenderer;
  private readonly hudRenderer: HUDRenderer;
  private readonly menuRenderer: MenuRenderer;
  private readonly pauseRenderer: PauseRenderer;
  private readonly gameOverRenderer: GameOverRenderer;
  private readonly ratingRenderer: RatingRenderer;
  private readonly fadeRenderer: FadeRenderer;
  private readonly arenaRenderer: ArenaRenderer;

  // Player entity — kept for sprite animation state only.
  // Position/health/stats are authoritative in WASM; we sync back each frame.
  private player: PlayerEntity;

  private wave: WaveManager;
  private leaderboard: LeaderboardEntry[] = [];
  private scoreSubmitted = false;

  private isMobile: boolean;
  private isDemoMode: boolean;
  private tutorialShown = false;

  private menuLinks: UILink[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    assets: AssetStore,
    audio: AudioManager,
    firebase: FirebaseService,
    network: NetworkService,
    sim: GameSimulator,
    isMobile: boolean,
    isDemoMode: boolean,
  ) {
    this.assets = assets;
    this.audio = audio;
    this.firebase = firebase;
    this.network = network;
    this.sim = sim;
    this.isMobile = isMobile;
    this.isDemoMode = isDemoMode;

    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.scene = new SceneManager();
    this.wave = new WaveManager();
    this.player = new PlayerEntity(this.renderer.width, this.renderer.height);

    this.gameplayRenderer = new GameplayRenderer(this.renderer, this.assets);
    this.hudRenderer = new HUDRenderer(this.renderer, this.assets);
    this.menuRenderer = new MenuRenderer(this.renderer, this.assets);
    this.pauseRenderer = new PauseRenderer(this.renderer, this.assets);
    this.gameOverRenderer = new GameOverRenderer(this.renderer);
    this.ratingRenderer = new RatingRenderer(this.renderer, this.assets);
    this.fadeRenderer = new FadeRenderer(this.renderer, this.assets);
    this.arenaRenderer = new ArenaRenderer(this.renderer, this.assets);

    this.buildMenuLinks();
    this.subscribeLeaderboard();

    this.loop = new GameLoop(this.tick);
  }

  start(): void {
    this.scene.forceTransition(GameScene.Menu);
    this.loop.start();
  }

  private subscribeLeaderboard(): void {
    this.firebase.subscribeLeaderboard((entries) => {
      this.leaderboard = entries;
    });
  }

  private buildMenuLinks(): void {
    const W = this.renderer.width;
    const H = this.renderer.height;

    this.menuLinks = [
      { label: 'PLAY',          position: new Vector2(W / 2 - 160, H / 2.5 - 55),  size: new Vector2(320, 110), isHovered: false },
      { label: 'RATING',        position: new Vector2(W / 2 - 220, H / 1.8 - 55),  size: new Vector2(440, 110), isHovered: false },
      { label: 'RETURN',        position: new Vector2(W / 2 - 130, 130),            size: new Vector2(260, 80),  isHovered: false },
      { label: 'MENU_GAMEOVER', position: new Vector2(350, 430),                    size: new Vector2(110, 30),  isHovered: false },
      { label: 'PAUSE_MENU',    position: new Vector2(350, 420),                    size: new Vector2(100, 30),  isHovered: false },
      { label: 'PAUSE_BTN',     position: new Vector2(W - 40, H - 48),              size: new Vector2(50, 50),   isHovered: false },
    ];
  }

  private readonly tick = (dt: number, now: number): void => {
    const mousePos = this.input.getMousePosition();
    this.updateLinkHovers(mousePos);

    this.renderer.beginFrame();
    this.update(dt, now);
    this.render(dt);
    this.renderer.commitFrame();
  };

  private update(dt: number, now: number): void {
    const scene = this.scene.getCurrent();
    const fired = this.input.consumeFire();

    if (scene === GameScene.PlayAnimation) {
      if (this.fadeRenderer.isDone()) {
        const animDone = advanceStartAnimation(this.player, dt);
        if (animDone) {
          this.scene.transitionTo(GameScene.Play);
          this.spawnNextWave();
        }
      }
      return;
    }

    if (scene === GameScene.Menu) {
      this.handleMenuInput(fired);
      return;
    }

    if (scene === GameScene.Rating) {
      if (this.isLinkClicked('RETURN', fired)) {
        this.scene.transitionTo(GameScene.Menu);
      }
      return;
    }

    if (scene === GameScene.GameOver) {
      if (this.isLinkClicked('MENU_GAMEOVER', fired)) {
        this.audio.stopAll();
        this.scene.transitionTo(GameScene.Menu);
      }
      return;
    }

    if (scene === GameScene.Pause) {
      const escapePressed = this.input.consumeEscape();
      const menuLinkClicked = this.isLinkClicked('PAUSE_MENU', fired);
      const pauseMenuClicked = this.isLinkClicked('PAUSE_BTN', fired);

      if (menuLinkClicked || pauseMenuClicked) {
        this.audio.stopAll();
        this.scene.forceTransition(GameScene.Menu);
        return;
      }
      if (escapePressed) {
        this.scene.forceTransition(GameScene.Play);
      }
      return;
    }

    if (scene === GameScene.Play) {
      const escapePressed = this.input.consumeEscape();
      const pauseClicked = this.isLinkClicked('PAUSE_BTN', fired);

      if (escapePressed || pauseClicked) {
        this.scene.transitionTo(GameScene.Pause);
        return;
      }

      if (!this.tutorialShown && this.input.getKeys().up) {
        this.tutorialShown = true;
      }

      // ── Update player sprite direction (JS responsibility, position in WASM) ──
      updatePlayer(this.player, this.input, dt);

      // ── Pack input for WASM ───────────────────────────────────────────────
      const keys = this.input.getKeys();
      const mousePos = this.input.getMousePosition();
      const inputFlags =
        (keys.up    ? 0x01 : 0) |
        (keys.down  ? 0x02 : 0) |
        (keys.left  ? 0x04 : 0) |
        (keys.right ? 0x08 : 0) |
        (fired      ? 0x10 : 0);

      // ── One WASM call handles all simulation ──────────────────────────────
      const result = this.sim.simulate(inputFlags, mousePos.x, mousePos.y, dt, now);

      // ── Sync WASM state back to PlayerEntity for rendering ────────────────
      this.syncPlayerFromWasm();

      // ── Audio events from WASM result buffer ─────────────────────────────
      if (result.eventFlags & EVT_DAMAGE)      this.audio.play(SoundId.Damage, false, 0.4);
      if (result.eventFlags & EVT_ENEMY_DIED)  this.audio.play(SoundId.DeathBat, false, 0.5);
      if (result.eventFlags & EVT_ITEM_PICKED) this.audio.play(SoundId.Money, false, 0.5);

      if (result.eventFlags & EVT_PLAYER_DEAD) {
        if (!this.player.deathSoundPlayed && !this.wave.isWinStage()) {
          this.audio.play(SoundId.GameOver, false, 0.5);
          this.player.deathSoundPlayed = true;
        }
        this.scene.transitionTo(GameScene.GameOver);
        void this.handleScoreSubmission();
        return;
      }

      if (this.sim.getAliveEnemyCount() === 0) {
        if (this.wave.isWinStage()) {
          this.sim.mem.setPlayerHealth(0);
          this.syncPlayerFromWasm();
          this.scene.transitionTo(GameScene.GameOver);
          return;
        }
        this.wave.advance();
        this.spawnNextWave();
      }
    }
  }

  private syncPlayerFromWasm(): void {
    const mem = this.sim.mem;
    this.player.position = new Vector2(mem.playerPosX, mem.playerPosY);
    this.player.health    = mem.playerHealth;
    this.player.points    = mem.playerPoints;
    this.player.damage    = mem.playerDamage;
    this.player.killCount = mem.playerKillCount;
    this.player.throwCount = mem.playerThrowCount;
  }

  private render(dt: number): void {
    const scene = this.scene.getCurrent();
    const mousePos = this.input.getMousePosition();

    if (scene === GameScene.Menu) {
      this.menuRenderer.render([this.menuLinks[0]!, this.menuLinks[1]!], this.isDemoMode);
      return;
    }

    if (scene === GameScene.Rating) {
      this.ratingRenderer.render(this.leaderboard, this.menuLinks[2]?.isHovered ?? false, this.isMobile);
      return;
    }

    if (scene === GameScene.PlayAnimation) {
      this.arenaRenderer.render(true);
      if (this.fadeRenderer.isDone()) {
        this.hudRenderer.render(this.player, this.wave.stage, this.isMobile);
        this.gameplayRenderer.renderPlayer(this.player, dt);
      } else {
        this.fadeRenderer.render();
      }
      return;
    }

    if (scene === GameScene.Play) {
      this.arenaRenderer.render(false);
      this.hudRenderer.render(this.player, this.wave.stage, this.isMobile);
      this.hudRenderer.renderTutorialOverlay(!this.tutorialShown);

      this.gameplayRenderer.renderAllEnemies(this.sim, dt);
      this.gameplayRenderer.renderPlayer(this.player, dt);
      this.gameplayRenderer.renderAllProjectiles(this.sim.mem);
      this.gameplayRenderer.renderAllItems(this.sim.mem);
      this.gameplayRenderer.renderCursor(mousePos);
      return;
    }

    if (scene === GameScene.Pause) {
      this.arenaRenderer.render(false);
      this.pauseRenderer.render(this.player, this.menuLinks[4]?.isHovered ?? false);
      return;
    }

    if (scene === GameScene.GameOver) {
      this.gameOverRenderer.render(
        this.player,
        this.wave.isWinStage(),
        this.menuLinks[3]?.isHovered ?? false,
      );
      return;
    }
  }

  private spawnNextWave(): void {
    spawnWave(this.wave.stage, this.wave.bossCount, this.wave.extraBossCount, this.assets, this.sim);
  }

  private startNewGame(): void {
    this.wave.reset();
    this.player = new PlayerEntity(this.renderer.width, this.renderer.height);
    this.player.position = this.player.startPosition;
    this.scoreSubmitted = false;
    this.tutorialShown = false;
    this.fadeRenderer.reset();
    this.arenaRenderer.resetGate();

    // Init WASM player state
    this.sim.initPlayer(
      this.player.startPosition.x,
      this.player.startPosition.y,
      PLAYER_MAX_HEALTH,
      PLAYER_BASE_DAMAGE,
      PLAYER_SPEED,
    );

    this.scene.transitionTo(GameScene.PlayAnimation);

    setTimeout(() => {
      this.audio.play(SoundId.MainMusic, true, 1);
    }, MUSIC_START_DELAY_MS);
  }

  private handleMenuInput(fired: boolean): void {
    if (this.isLinkClicked('PLAY', fired)) {
      if (!this.isDemoMode) {
        this.startNewGame();
      }
    }
    if (this.isLinkClicked('RATING', fired)) {
      this.scene.transitionTo(GameScene.Rating);
    }
  }

  private isLinkClicked(label: string, fired: boolean): boolean {
    if (!fired) return false;
    const link = this.menuLinks.find((l) => l.label === label);
    return link?.isHovered ?? false;
  }

  private updateLinkHovers(mousePos: Vector2): void {
    for (const link of this.menuLinks) {
      link.isHovered =
        mousePos.x > link.position.x &&
        mousePos.x < link.position.x + link.size.x &&
        mousePos.y > link.position.y &&
        mousePos.y < link.position.y + link.size.y;
    }
  }

  private async handleScoreSubmission(): Promise<void> {
    if (this.scoreSubmitted) return;
    this.scoreSubmitted = true;
    const name = this.player.playerName || `player${Math.random().toFixed(3)}`;
    const ip = this.network.getStoredIp();
    await this.firebase.submitScore({ name, points: this.player.points, ip });
  }
  destroy(): void {
    this.loop.stop();
    this.input.destroy();
    this.firebase.destroy();
  }
}
