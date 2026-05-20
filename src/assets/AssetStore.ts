import { ImageKey, GameData } from '../types/AssetTypes';

export class AssetStore {
  private readonly images: ReadonlyMap<ImageKey, HTMLImageElement>;
  readonly gameData: GameData;

  constructor(images: Map<ImageKey, HTMLImageElement>, gameData: GameData) {
    this.images = images;
    this.gameData = gameData;
  }

  getImage(key: ImageKey): HTMLImageElement {
    const img = this.images.get(key);
    if (!img) throw new Error(`Asset not found: ${key}`);
    return img;
  }
}
