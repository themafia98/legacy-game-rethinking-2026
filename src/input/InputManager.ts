import { Vector2 } from '../math/Vector2';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  escape: boolean;
}

export class InputManager {
  private keys: KeyState = {
    up: false,
    down: false,
    left: false,
    right: false,
    escape: false,
  };

  private mousePosition = Vector2.zero;
  private mouseOffset = Vector2.zero;
  private didFireThisFrame = false;
  private escapeConsumed = false;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onCanvasClick);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if ((e.target as HTMLElement).classList.contains('name')) return;
    this.setKeyState(e.code, true);
    if (e.code === 'Escape') {
      this.escapeConsumed = false;
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.setKeyState(e.code, false);
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.set(e.clientX - rect.left, e.clientY - rect.top);
  };

  private readonly onCanvasClick = (): void => {
    this.didFireThisFrame = true;
  };

  private setKeyState(code: string, pressed: boolean): void {
    switch (code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = pressed;
        break;
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = pressed;
        break;
      case 'Escape':
        this.keys.escape = pressed;
        break;
    }
  }

  getKeys(): Readonly<KeyState> {
    return this.keys;
  }

  getMousePosition(): Vector2 {
    return this.mousePosition;
  }

  getAimDirection(origin: Vector2): Vector2 {
    return this.mousePosition.subtract(origin).normalize();
  }

  consumeEscape(): boolean {
    if (this.keys.escape && !this.escapeConsumed) {
      this.escapeConsumed = true;
      return true;
    }
    return false;
  }

  consumeFire(): boolean {
    if (this.didFireThisFrame) {
      this.didFireThisFrame = false;
      return true;
    }
    return false;
  }

  setMouseOffset(offset: Vector2): void {
    this.mouseOffset = offset;
    this.mousePosition.set(this.mousePosition.x + offset.x, this.mousePosition.y + offset.y);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onCanvasClick);
    void this.mouseOffset;
  }
}
