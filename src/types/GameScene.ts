export enum GameScene {
  Loading = 'loading',
  Menu = 'menu',
  PlayAnimation = 'play-animation',
  Play = 'play',
  Pause = 'pause',
  GameOver = 'gameover',
  Rating = 'rating',
}

export type SceneTransitionMap = Partial<Record<GameScene, readonly GameScene[]>>;

export const VALID_TRANSITIONS: SceneTransitionMap = {
  [GameScene.Loading]: [GameScene.Menu],
  [GameScene.Menu]: [GameScene.PlayAnimation, GameScene.Rating],
  [GameScene.PlayAnimation]: [GameScene.Play],
  [GameScene.Play]: [GameScene.Pause, GameScene.GameOver],
  [GameScene.Pause]: [GameScene.Play, GameScene.Menu],
  [GameScene.GameOver]: [GameScene.Menu, GameScene.Rating],
  [GameScene.Rating]: [GameScene.Menu],
};
