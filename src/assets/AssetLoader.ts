import { ImageKey, GameData } from '../types/AssetTypes';
import { AssetStore } from './AssetStore';

const IMAGE_PATHS: Record<ImageKey, string> = {
  [ImageKey.Texture]: 'img/texture.png',
  [ImageKey.SpriteSheet]: 'img/sheet_objects_heroes.png',
  [ImageKey.MenuBackground]: 'img/menu_800x600.jpg',
  [ImageKey.PauseIcon]: 'img/pause.png',
  [ImageKey.BoxBackground]: 'img/box_background.png',
  [ImageKey.Box]: 'img/box.png',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadGameData(): Promise<GameData> {
  const response = await fetch('./js/data.json');
  if (!response.ok) {
    throw new Error(`Failed to load game data: ${response.statusText}`);
  }
  return response.json() as Promise<GameData>;
}

export async function loadAllAssets(): Promise<AssetStore> {
  const [images, gameData] = await Promise.all([
    Promise.all(
      (Object.entries(IMAGE_PATHS) as [ImageKey, string][]).map(
        async ([key, path]) => [key, await loadImage(path)] as [ImageKey, HTMLImageElement],
      ),
    ),
    loadGameData(),
  ]);

  const imageMap = new Map<ImageKey, HTMLImageElement>(images);
  return new AssetStore(imageMap, gameData);
}
