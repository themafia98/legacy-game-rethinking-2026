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
import { LeaderboardEntry } from '../types/LeaderboardTypes';
import { SoundId } from '../types/AssetTypes';
import { Vector2 } from '../math/Vector2';
import { ScalarRng } from '../core/ScalarRng';
import { GameSimulator } from '../wasm/GameSimulator';
import {
  EVT_DAMAGE, EVT_ENEMY_DIED, EVT_ITEM_PICKED, EVT_PLAYER_DEAD,
  INPUT_UP, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_FIRED,
} from '../wasm/SimMemory';

import { updatePlayer, advanceStartAnimation } from '../systems/PlayerSystem';
import { spawnWave } from '../systems/SpawnSystem';

import {
  MUSIC_START_DELAY_MS,
  PLAYER_MAX_HEALTH, PLAYER_BASE_DAMAGE, PLAYER_SPEED,
} from '../core/GameConfig';

enum MenuLinkId {
  Play,
  Rating,
  Return,
  MenuGameOver,
  PauseMenu,
  PauseButton,
}

interface UILink {
  id: MenuLinkId;
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
  private readonly sim: GameSimulator;
  private readonly rng: ScalarRng;

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
  private readonly fallbackPlayerName = `player-${Date.now().toString(36)}`;

  constructor(
    canvas: HTMLCanvasElement,
    assets: AssetStore,
    audio: AudioManager,
    firebase: FirebaseService,
    sim: GameSimulator,
    isMobile: boolean,
    isDemoMode: boolean,
  ) {
    this.assets = assets;
    this.audio = audio;
    this.firebase = firebase;
    this.sim = sim;
    this.rng = new ScalarRng(Date.now());
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

    this.loop = new GameLoop({
      update: this.loopUpdate,
      render: this.loopRender,
    });
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
      { id: MenuLinkId.Play,         position: new Vector2(W / 2 - 160, H / 2.5 - 55),  size: new Vector2(320, 110), isHovered: false },
      { id: MenuLinkId.Rating,       position: new Vector2(W / 2 - 220, H / 1.8 - 55),  size: new Vector2(440, 110), isHovered: false },
      { id: MenuLinkId.Return,       position: new Vector2(W / 2 - 130, 130),            size: new Vector2(260, 80),  isHovered: false },
      { id: MenuLinkId.MenuGameOver, position: new Vector2(350, 430),                    size: new Vector2(110, 30),  isHovered: false },
      { id: MenuLinkId.PauseMenu,    position: new Vector2(350, 420),                    size: new Vector2(100, 30),  isHovered: false },
      { id: MenuLinkId.PauseButton,  position: new Vector2(W - 40, H - 48),              size: new Vector2(50, 50),   isHovered: false },
    ];
  }

  private readonly loopUpdate = (dt: number, now: number): void => {
    const mousePos = this.input.getMousePosition();
    this.updateLinkHovers(mousePos);
    this.update(dt, now);
  };

  private readonly loopRender = (dt: number, _now: number): void => {
    this.renderer.beginFrame();
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
      if (this.isLinkClicked(MenuLinkId.Return, fired)) {
        this.scene.transitionTo(GameScene.Menu);
      }
      return;
    }

    if (scene === GameScene.GameOver) {
      if (this.isLinkClicked(MenuLinkId.MenuGameOver, fired)) {
        this.audio.stopAll();
        this.scene.transitionTo(GameScene.Menu);
      }
      return;
    }

    if (scene === GameScene.Pause) {
      const escapePressed = this.input.consumeEscape();
      const menuLinkClicked = this.isLinkClicked(MenuLinkId.PauseMenu, fired);
      const pauseMenuClicked = this.isLinkClicked(MenuLinkId.PauseButton, fired);

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
      const pauseClicked = this.isLinkClicked(MenuLinkId.PauseButton, fired);

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
        (keys.up    ? INPUT_UP : 0) |
        (keys.down  ? INPUT_DOWN : 0) |
        (keys.left  ? INPUT_LEFT : 0) |
        (keys.right ? INPUT_RIGHT : 0) |
        (fired      ? INPUT_FIRED : 0);

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
    this.player.position.set(mem.playerPosX, mem.playerPosY);
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
      this.menuRenderer.render([this.menuLinks[MenuLinkId.Play]!, this.menuLinks[MenuLinkId.Rating]!], this.isDemoMode);
      return;
    }

    if (scene === GameScene.Rating) {
      this.ratingRenderer.render(this.leaderboard, this.menuLinks[MenuLinkId.Return]?.isHovered ?? false, this.isMobile);
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
      this.pauseRenderer.render(this.player, this.menuLinks[MenuLinkId.PauseMenu]?.isHovered ?? false);
      return;
    }

    if (scene === GameScene.GameOver) {
      this.gameOverRenderer.render(
        this.player,
        this.wave.isWinStage(),
        this.menuLinks[MenuLinkId.MenuGameOver]?.isHovered ?? false,
      );
      return;
    }
  }

  private spawnNextWave(): void {
    spawnWave(this.wave.stage, this.wave.bossCount, this.wave.extraBossCount, this.assets, this.sim, this.rng);
  }

  private startNewGame(): void {
    this.wave.reset();
    this.rng.reseed(Date.now());
    this.player = new PlayerEntity(this.renderer.width, this.renderer.height);
    this.player.position.set(this.player.startPosition.x, this.player.startPosition.y);
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
    if (this.isLinkClicked(MenuLinkId.Play, fired)) {
      if (!this.isDemoMode) {
        this.startNewGame();
      }
    }
    if (this.isLinkClicked(MenuLinkId.Rating, fired)) {
      this.scene.transitionTo(GameScene.Rating);
    }
  }

  private isLinkClicked(id: MenuLinkId, fired: boolean): boolean {
    if (!fired) return false;
    return this.menuLinks[id]?.isHovered ?? false;
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
    const name = this.player.playerName || this.fallbackPlayerName;
    await this.firebase.submitScore({ name, points: this.player.points });
  }
  destroy(): void {
    this.loop.stop();
    this.input.destroy();
    this.firebase.destroy();
  }
}
