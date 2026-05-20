import { SoundId } from '../types/AssetTypes';

const SOUND_PATHS: Record<SoundId, string> = {
  [SoundId.MainMusic]: 'audio/Fly_A_Kite.mp3',
  [SoundId.AdditionalMusic]: 'audio/main.mp3',
  [SoundId.LevelMusic]: 'audio/lvl.mp3',
  [SoundId.Shot]: 'audio/shot.mp3',
  [SoundId.Money]: 'audio/money.wav',
  [SoundId.Eat]: 'audio/eat.wav',
  [SoundId.Damage]: 'audio/damage.wav',
  [SoundId.DeathBoss]: 'audio/death_boss.wav',
  [SoundId.DeathBat]: 'audio/death-bat.mp3',
  [SoundId.DeathBossExtra]: 'audio/death-bossExtra.wav',
  [SoundId.GameOver]: 'audio/gameOver.wav',
  [SoundId.LevelUp]: 'audio/lvlUP.wav',
  [SoundId.Select]: 'audio/select.wav',
};

export class AudioManager {
  private readonly ctx: AudioContext;
  private gainNode: GainNode;
  private readonly buffers = new Map<SoundId, AudioBuffer>();
  private isLoaded = false;

  constructor() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  async loadAll(): Promise<void> {
    const entries = Object.entries(SOUND_PATHS) as [SoundId, string][];

    await Promise.allSettled(
      entries.map(async ([id, path]) => {
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(id, audioBuffer);
        } catch (err) {
          console.warn(`AudioManager: could not load "${path}"`, err);
        }
      }),
    );

    this.isLoaded = true;
  }

  play(id: SoundId, loop = false, volume = 1): void {
    if (!this.isLoaded) return;

    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.gainNode);
    this.gainNode.gain.value = volume;
    source.start(0);
  }

  getDuration(id: SoundId): number {
    return this.buffers.get(id)?.duration ?? 0;
  }

  stopAll(): void {
    this.gainNode.disconnect();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  resume(): void {
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }
}
