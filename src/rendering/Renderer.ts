export interface DrawImageParams {
  image: CanvasImageSource;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  dstX: number;
  dstY: number;
  dstW: number;
  dstH: number;
}

export interface TextParams {
  text: string;
  x: number;
  y: number;
  font: string;
  fillStyle: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  alpha?: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private readonly buffer: HTMLCanvasElement;
  private readonly bufferCtx: CanvasRenderingContext2D;
  private readonly patternCache = new WeakMap<HTMLImageElement, CanvasPattern>();

  readonly width: number;
  readonly height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from main canvas');
    this.ctx = ctx;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.width;
    this.buffer.height = this.height;

    const bufCtx = this.buffer.getContext('2d');
    if (!bufCtx) throw new Error('Could not get 2D context from buffer canvas');
    this.bufferCtx = bufCtx;
  }

  beginFrame(): void {
    this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.bufferCtx.clearRect(0, 0, this.width, this.height);
  }

  commitFrame(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.buffer, 0, 0, this.width, this.height);
  }

  drawSprite(p: DrawImageParams): void {
    this.bufferCtx.drawImage(p.image, p.srcX, p.srcY, p.srcW, p.srcH, p.dstX, p.dstY, p.dstW, p.dstH);
  }

  drawText(p: TextParams): void {
    const c = this.bufferCtx;
    c.save();
    c.font = p.font;
    c.fillStyle = p.fillStyle;
    c.textAlign = p.align ?? 'left';
    c.textBaseline = p.baseline ?? 'alphabetic';
    if (p.alpha !== undefined) c.globalAlpha = p.alpha;
    if (p.shadowColor) {
      c.shadowColor = p.shadowColor;
      c.shadowOffsetX = p.shadowOffsetX ?? 0;
      c.shadowOffsetY = p.shadowOffsetY ?? 0;
      c.shadowBlur = p.shadowBlur ?? 0;
    }
    c.fillText(p.text, p.x, p.y);
    c.restore();
  }

  fillRect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    const c = this.bufferCtx;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    c.restore();
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth = 1): void {
    const c = this.bufferCtx;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = lineWidth;
    c.strokeRect(x, y, w, h);
    c.restore();
  }

  drawPattern(image: HTMLImageElement, x: number, y: number, w: number, h: number): void {
    let pattern = this.patternCache.get(image);
    if (!pattern) {
      pattern = this.bufferCtx.createPattern(image, 'repeat') ?? undefined;
      if (!pattern) return;
      this.patternCache.set(image, pattern);
    }
    if (!pattern) return;
    this.bufferCtx.save();
    this.bufferCtx.fillStyle = pattern;
    this.bufferCtx.fillRect(x, y, w, h);
    this.bufferCtx.restore();
  }

  drawLinearGradientRect(
    x: number, y: number, w: number, h: number,
    stops: ReadonlyArray<{ offset: number; color: string }>,
  ): void {
    const gradient = this.bufferCtx.createLinearGradient(x, y, x + w, y);
    for (const s of stops) gradient.addColorStop(s.offset, s.color);
    this.bufferCtx.save();
    this.bufferCtx.fillStyle = gradient;
    this.bufferCtx.fillRect(x, y, w, h);
    this.bufferCtx.restore();
  }

  drawRotated(
    image: HTMLImageElement,
    srcX: number, srcY: number, srcW: number, srcH: number,
    dstX: number, dstY: number, dstW: number, dstH: number,
    angleDeg: number,
  ): void {
    const c = this.bufferCtx;
    c.save();
    c.translate(dstX, dstY);
    c.rotate((angleDeg * 2 * Math.PI) / 180);
    c.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);
    c.restore();
  }
}
