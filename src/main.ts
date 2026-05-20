import './style/style.css';

import { loadAllAssets } from './assets/AssetLoader';
import { AudioManager } from './audio/AudioManager';
import { FirebaseService } from './services/FirebaseService';
import { NetworkService } from './services/NetworkService';
import { Game } from './game/Game';
import { promptPlayerName, getStoredPlayerName } from './ui/NameInputModal';
import { GameSimulator } from './wasm/GameSimulator';

const CANVAS_MOBILE_MAX_WIDTH = 800;
const CANVAS_MOBILE_MAX_HEIGHT = 620;

function detectViewport(): { width: number; height: number; isMobile: boolean; isDemoMode: boolean } {
  const availW = window.screen.availWidth;
  const availH = window.screen.availHeight;

  const isMobile = availW < CANVAS_MOBILE_MAX_WIDTH || availH < CANVAS_MOBILE_MAX_HEIGHT;
  const isDemoMode = availW < 760;

  const width = isMobile ? availW - 10 : CANVAS_MOBILE_MAX_WIDTH;
  const height = isMobile ? availH : CANVAS_MOBILE_MAX_HEIGHT;

  return { width, height, isMobile, isDemoMode };
}

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById('arena') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('Canvas element #arena not found');

  canvas.classList.add('canvasInit');

  const { width, height, isMobile, isDemoMode } = detectViewport();
  canvas.width = width;
  canvas.height = height;

  if (isMobile) canvas.classList.add('scale');

  const audio = new AudioManager();
  const firebase = new FirebaseService();
  const network = new NetworkService();

  const [assets, , , sim] = await Promise.all([
    loadAllAssets(),
    audio.loadAll(),
    network.fetchAndCacheIp(),
    GameSimulator.load('/game.wasm'),
  ]);

  audio.resume();

  if (!getStoredPlayerName()) {
    const name = await promptPlayerName(canvas);
    audio.resume();
    void name;
  }

  const game = new Game(canvas, assets, audio, firebase, network, sim, isMobile, isDemoMode);
  game.start();
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal bootstrap error:', err);
  setTimeout(() => window.location.reload(), 3000);
});
