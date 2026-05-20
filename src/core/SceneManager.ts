import { GameScene, VALID_TRANSITIONS } from '../types/GameScene';

export class SceneManager {
  private current: GameScene = GameScene.Loading;

  getCurrent(): GameScene {
    return this.current;
  }

  is(scene: GameScene): boolean {
    return this.current === scene;
  }

  isAny(...scenes: GameScene[]): boolean {
    return scenes.includes(this.current);
  }

  transitionTo(next: GameScene): boolean {
    const allowed = VALID_TRANSITIONS[this.current];
    if (!allowed?.includes(next)) {
      console.warn(`SceneManager: invalid transition ${this.current} → ${next}`);
      return false;
    }
    this.current = next;
    return true;
  }

  forceTransition(next: GameScene): void {
    this.current = next;
  }
}
