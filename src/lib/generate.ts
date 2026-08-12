import { ASSETS, BRAND, EVENT } from "./brand";

export type Photo = { img: HTMLImageElement };

const imgCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(src);
  if (cached) return cached;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed: " + src));
    img.src = src;
  });
  imgCache.set(src, p);
  return p;
}

/** Turn any user file (incl. iPhone HEIC) into a decoded image. */
export async function readPhoto(file: File): Promise<HTMLImageElement> {
  let blob: Blob = file;
  const isHeic =
    /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    try {
      const heic2any = (await import("heic2any")).default as (o: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
      const out = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.94,
      });
      blob = (Array.isArray(out) ? out[0] : out) ?? file;
    } catch {
      /* some browsers decode HEIC natively — fall through */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

export async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const timeout = new Promise((resolve) => setTimeout(resolve, 1000));
  const fontLoads = Promise.all([
    document.fonts.load('700 120px "Bodoni Moda"'),
    document.fonts.load('400 40px "DM Mono"'),
    document.fonts.load('500 40px "DM Mono"'),
  ])
    .then(() => document.fonts.ready)
    .catch(() => undefined);

  await Promise.race([fontLoads, timeout]);
}

const display = (px: number, weight = 700) =>
  `${weight} ${px}px "Bodoni Moda", "Times New Roman", serif`;
const mono = (px: number, weight = 500) =>
  `${weight} ${px}px "DM Mono", ui-monospace, monospace`;

function grain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha = 0.05,
) {
  const n = document.createElement("canvas");
  const s = 220;
  n.width = s;
  n.height = s;
  const nctx = n.getContext("2d")!;
  const data = nctx.createImageData(s, s);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 200 + Math.random() * 55;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = Math.random() * 255;
  }
  nctx.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  for (let y = 0; y < h; y += s)
    for (let x = 0; x < w; x += s) ctx.drawImage(n, x, y);
  ctx.restore();
}

/** cover-crop draw: works for portrait, landscape, off-centre photos */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  offY = 0,
  offX = 0,
) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(
    img,
    x + (w - dw) / 2 + offX * w,
    y + (h - dh) / 2 + offY * h,
    dw,
    dh,
  );
}

function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  centerAngle: number,
  font: string,
  color: string,
  flip = false,
  letterSpace = 1.25,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width * letterSpace);
  const total = widths.reduce((a, b) => a + b, 0);
  const totalAngle = total / r;
  let angle = centerAngle - (flip ? -totalAngle / 2 : totalAngle / 2);
  chars.forEach((c, i) => {
    const step = (widths[i] ?? 0) / r;
    const a = angle + (flip ? -step / 2 : step / 2);
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(c, 0, 0);
    ctx.restore();
    angle += flip ? -step : step;
  });
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** yellow/pink zig-zag brocade tape, like Goan/Indian trim */
function tape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = BRAND.yellow;
  const step = h;
  ctx.beginPath();
  for (let i = 0; i * step < w; i++) {
    const sx = x + i * step;
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + step / 2, y);
    ctx.lineTo(sx + step, y + h);
  }
  ctx.fill();
  ctx.restore();
}

async function goaSticker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotate = -0.14,
) {
  const goa = await loadImage(ASSETS.goa);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);
  ctx.beginPath();
  const spikes = 11;
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.9;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = BRAND.pink;
  ctx.fill();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = BRAND.yellow;
  ctx.stroke();
  const s = r * 1.15;
  ctx.globalCompositeOperation = "source-atop";
  ctx.drawImage(goa, -s / 2, -s / 2, s, s);
  ctx.restore();
}

/** Lighten (+) or darken (-) a hex color by a percentage. Used for gradient/shadow depth. */
function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Manually letter-spaced text — canvas has no native tracking control. */
function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let cx = x;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = align;
  return cx - spacing;
}

/* ========================= NEW DESIGN HELPERS ========================= */

/** Draw a hexagonal path centered at (cx, cy) with the given radius. */
function hexPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotation = -Math.PI / 6,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = rotation + (Math.PI / 3) * i;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Neon glow stroke on the current path — bloom outward then a crisp inner line. */
function neonGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  innerColor: string,
  outerWidth: number,
  innerWidth: number,
  blur: number,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.lineWidth = outerWidth;
  ctx.stroke();
  // Second pass for extra bloom
  ctx.shadowBlur = blur * 0.5;
  ctx.stroke();
  ctx.restore();
  // Crisp inner line
  ctx.strokeStyle = innerColor;
  ctx.lineWidth = innerWidth;
  ctx.stroke();
}

/** Viewfinder / target reticle bracket at a corner. */
function reticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  corner: "tl" | "tr" | "bl" | "br",
  color: string,
  alpha = 0.4,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  const dx = corner.includes("r") ? -1 : 1;
  const dy = corner.includes("b") ? -1 : 1;
  ctx.moveTo(x + dx * size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * size);
  ctx.stroke();
  ctx.restore();
}

/** Faint dot grid — gives a "printed document" texture. */
function dotGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spacing: number,
  radius: number,
  color: string,
  alpha = 0.06,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let y = spacing; y < h; y += spacing) {
    for (let x = spacing; x < w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Film-strip sprocket holes decoration under a photo panel. */
function filmStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  alpha = 0.18,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const holeW = 14;
  const holeH = 10;
  const gap = 8;
  const totalStep = holeW + gap;
  const count = Math.floor(w / totalStep);
  const startX = x + (w - count * totalStep + gap) / 2;
  for (let i = 0; i < count; i++) {
    const hx = startX + i * totalStep;
    roundRect(ctx, hx, y, holeW, holeH, 3);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------- FORMAT A ------------------------------- */

/** Format A: "Neon Jungle Badge" PFP Frame (1080 x 1080) */
export async function renderPfp(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  opts: { zoom?: number; offY?: number; offX?: number } = {},
) {
  const S = 1080;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const cx = S / 2;

  // ── Deep layered radial gradient background ──
  const bg = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 1.05);
  bg.addColorStop(0, shade(BRAND.green, 6));
  bg.addColorStop(0.35, BRAND.green);
  bg.addColorStop(0.7, shade(BRAND.green, -12));
  bg.addColorStop(1, shade(BRAND.greenDeep, -6));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // ── Subtle dot grid across the whole background ──
  dotGrid(ctx, S, S, 28, 1.5, BRAND.yellow, 0.04);

  // ── Holographic scanline rings radiating outward ──
  const hexR = 370; // photo hex radius
  ctx.save();
  for (let i = 1; i <= 6; i++) {
    const ringR = hexR + 50 + i * 32;
    const alpha = 0.035 - i * 0.004;
    if (alpha <= 0) break;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = BRAND.yellow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cx, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ── Corner reticle brackets ──
  const m = 42; // margin from edge
  const rl = 60; // bracket arm length
  reticle(ctx, m, m, rl, "tl", BRAND.yellow, 0.5);
  reticle(ctx, S - m, m, rl, "tr", BRAND.yellow, 0.5);
  reticle(ctx, m, S - m, rl, "bl", BRAND.yellow, 0.5);
  reticle(ctx, S - m, S - m, rl, "br", BRAND.yellow, 0.5);

  // ── Hexagonal photo mask with cover-crop ──
  const hexBounds = hexR * 2;
  const photoX = cx - hexR;
  const photoY = cx - hexR;

  ctx.save();
  hexPath(ctx, cx, cx, hexR);
  ctx.clip();
  // Dark base behind photo
  ctx.fillStyle = "#000";
  ctx.fillRect(photoX, photoY, hexBounds, hexBounds);
  drawCover(
    ctx,
    photo,
    photoX,
    photoY,
    hexBounds,
    hexBounds,
    opts.zoom ?? 1,
    opts.offY ?? 0,
    opts.offX ?? 0,
  );
  // Inner vignette for depth
  const vig = ctx.createRadialGradient(cx, cx, hexR * 0.65, cx, cx, hexR);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(photoX, photoY, hexBounds, hexBounds);
  ctx.restore();

  // ── Neon glow border on hex ──
  hexPath(ctx, cx, cx, hexR);
  neonGlow(ctx, BRAND.pink, BRAND.yellow, 8, 2.5, 36);

  // ── Second outer hex hairline ──
  ctx.save();
  ctx.globalAlpha = 0.25;
  hexPath(ctx, cx, cx, hexR + 28);
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // ── "HACKER HOUSE" text lockup — straight, angular, with glitch shadow ──
  const textY = cx - hexR - 56;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Pink glitch-offset shadow
  ctx.save();
  ctx.fillStyle = BRAND.pink;
  ctx.globalAlpha = 0.45;
  ctx.font = display(84);
  ctx.fillText("HACKER HOUSE", cx + 3, textY + 3);
  ctx.restore();

  // Main yellow text
  ctx.fillStyle = BRAND.yellow;
  ctx.font = display(84);
  ctx.fillText("HACKER HOUSE", cx, textY);

  // Subtitle line below
  ctx.font = mono(26);
  ctx.fillStyle = BRAND.yellow;
  ctx.globalAlpha = 0.8;
  ctx.fillText(`GOA  ·  ${EVENT.dates}  ·  ${EVENT.studio}`, cx, textY + 38);
  ctx.globalAlpha = 1;

  // ── Bottom event line ──
  const btmY = cx + hexR + 72;
  ctx.font = mono(24);
  ctx.fillStyle = BRAND.cream;
  ctx.globalAlpha = 0.6;
  ctx.fillText(EVENT.hashtag.toUpperCase(), cx, btmY);
  ctx.globalAlpha = 1;

  // ── Decorative constellation dots at corners ──
  ctx.save();
  ctx.fillStyle = BRAND.yellow;
  ctx.globalAlpha = 0.3;
  const dots: [number, number][] = [
    [72, 72],
    [92, 56],
    [56, 96],
    [S - 72, 72],
    [S - 92, 56],
    [S - 56, 96],
    [72, S - 72],
    [92, S - 56],
    [56, S - 96],
    [S - 72, S - 72],
    [S - 92, S - 56],
    [S - 56, S - 96],
  ];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(dx, dy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── Goa sticker with glow halo ──
  ctx.save();
  ctx.shadowColor = BRAND.pink;
  ctx.shadowBlur = 22;
  await goaSticker(ctx, S - 148, S - 148, 120, 0.1);
  ctx.restore();

  grain(ctx, S, S, 0.05);
}

/* ------------------------------- FORMAT B ------------------------------- */

/** Format B: "Holo Passport" Builder ID Pass Banner (1600 x 900) */
export async function renderCard(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  data: { name: string; role: string; title: string; handle?: string },
  opts: { zoom?: number; offY?: number; offX?: number } = {},
) {
  const W = 1600;
  const H = 900;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND: deep gradient with subtle radial glow center-right
  // ═══════════════════════════════════════════════════════════════
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, shade(BRAND.greenDeep, -10));
  bg.addColorStop(0.5, shade(BRAND.green, -6));
  bg.addColorStop(1, shade(BRAND.greenDeep, -8));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial glow behind text area for depth
  const glow = ctx.createRadialGradient(W * 0.68, H * 0.45, 0, W * 0.68, H * 0.45, 500);
  glow.addColorStop(0, "rgba(4,103,53,0.5)");
  glow.addColorStop(1, "rgba(4,103,53,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ═══════════════════════════════════════════════════════════════
  // DIAGONAL PHOTO PANEL: full-bleed left side with angled slice
  // ═══════════════════════════════════════════════════════════════
  const sliceW = 580;      // base width of photo area
  const slant = 80;        // how far the diagonal leans
  const photoClip = new Path2D();
  photoClip.moveTo(0, 0);
  photoClip.lineTo(sliceW + slant, 0);
  photoClip.lineTo(sliceW - slant, H);
  photoClip.lineTo(0, H);
  photoClip.closePath();

  // Photo
  ctx.save();
  ctx.clip(photoClip);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, sliceW + slant, H);
  drawCover(
    ctx,
    photo,
    0, 0,
    sliceW + slant, H,
    opts.zoom ?? 1,
    opts.offY ?? 0,
    opts.offX ?? 0,
  );
  // Edge gradient that blends photo into background
  const edgeFade = ctx.createLinearGradient(sliceW - 160, 0, sliceW + slant, 0);
  edgeFade.addColorStop(0, "rgba(2,53,28,0)");
  edgeFade.addColorStop(1, "rgba(2,53,28,0.85)");
  ctx.fillStyle = edgeFade;
  ctx.fillRect(0, 0, sliceW + slant, H);
  // Bottom vignette on photo
  const btmFade = ctx.createLinearGradient(0, H - 180, 0, H);
  btmFade.addColorStop(0, "rgba(0,0,0,0)");
  btmFade.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = btmFade;
  ctx.fillRect(0, H - 180, sliceW + slant, 180);
  ctx.restore();

  // Diagonal neon edge line (the slice border)
  ctx.save();
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = 4;
  ctx.shadowColor = BRAND.pink;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(sliceW + slant, 0);
  ctx.lineTo(sliceW - slant, H);
  ctx.stroke();
  // Second pass for glow
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;
  ctx.strokeStyle = BRAND.yellow;
  ctx.stroke();
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════
  // BOLD ACCENT STRIPE: horizontal band across full width
  // ═══════════════════════════════════════════════════════════════
  const stripeY = 82;
  const stripeH = 6;
  const stripeGrad = ctx.createLinearGradient(0, 0, W, 0);
  stripeGrad.addColorStop(0, BRAND.pink);
  stripeGrad.addColorStop(0.3, BRAND.pink);
  stripeGrad.addColorStop(0.5, BRAND.yellow);
  stripeGrad.addColorStop(0.7, BRAND.pink);
  stripeGrad.addColorStop(1, BRAND.pink);
  ctx.fillStyle = stripeGrad;
  ctx.fillRect(0, stripeY, W, stripeH);

  // Thin yellow hairline below
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, stripeY + stripeH + 6);
  ctx.lineTo(W, stripeY + stripeH + 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Bottom stripe mirror
  const btmStripeY = H - 70;
  ctx.fillStyle = stripeGrad;
  ctx.fillRect(0, btmStripeY, W, stripeH);

  // ═══════════════════════════════════════════════════════════════
  // HEADER: wordmark on photo + pass info top-right (NO OVERLAP)
  // ═══════════════════════════════════════════════════════════════
  const wm = await loadImage(ASSETS.wordmark);
  const wmW = 360;
  const wmH = (wm.height / wm.width) * wmW;
  // Wordmark overlaid on the photo, bottom-left
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(wm, 40, H - wmH - 95, wmW, wmH);
  ctx.restore();

  // Pass info top-right with clear vertical hierarchy
  const rx = sliceW + 70; // text column start
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  // Line 1: Pass No (y = 42)
  const numStr = `NO. ${passNo(data.name)}`;
  ctx.font = mono(20, 700);
  const numW = ctx.measureText(numStr).width;
  ctx.fillStyle = BRAND.pink;
  ctx.fillText(numStr, W - 60, 42);
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText("OFFICIAL BUILDER PASS · ", W - 60 - numW, 42);

  // Line 2: Dates & Location (y = 68) — 26px below line 1
  ctx.font = mono(16, 500);
  ctx.fillStyle = BRAND.cream;
  ctx.globalAlpha = 0.75;
  ctx.fillText(`${EVENT.place}  ·  ${EVENT.dates}`, W - 60, 68);
  ctx.globalAlpha = 1;

  // ═══════════════════════════════════════════════════════════════
  // RIGHT COLUMN: hero name + role + title + credentials badge (VERTICALLY CENTERED)
  // ═══════════════════════════════════════════════════════════════
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const maxTextW = W - rx - 60;
  let y = 265;

  // ── HERO NAME ──
  const name = (data.name || "YOUR NAME").toUpperCase();
  let nameSize = 120;
  do {
    ctx.font = display(nameSize);
    nameSize -= 4;
  } while (ctx.measureText(name).width > maxTextW && nameSize > 40);

  // Neon glow behind name
  ctx.save();
  ctx.fillStyle = BRAND.pink;
  ctx.globalAlpha = 0.2;
  ctx.shadowColor = BRAND.pink;
  ctx.shadowBlur = 40;
  ctx.fillText(name, rx + 2, y + 2);
  ctx.restore();

  // Yellow main name
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText(name, rx, y);

  // Thin pink accent line under name
  const nameW = ctx.measureText(name).width;
  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rx, y + 16);
  ctx.lineTo(rx + Math.min(nameW, maxTextW), y + 16);
  ctx.stroke();

  // ── ROLE ──
  y += 62;
  ctx.fillStyle = BRAND.cream;
  const roleTxt = (data.role || "BUILDER").toUpperCase();
  let rsize = 32;
  do {
    ctx.font = mono(rsize);
    rsize -= 2;
  } while (ctx.measureText(roleTxt).width > maxTextW && rsize > 16);
  ctx.fillText(roleTxt, rx, y);

  // ── TITLE PILL BADGE ──
  const t = data.title.toUpperCase();
  let tsize = 26;
  do {
    ctx.font = mono(tsize, 700);
    tsize -= 2;
  } while (ctx.measureText(t).width + 56 > maxTextW && tsize > 14);
  const tw = ctx.measureText(t).width;
  const pillH = 56;
  const pillW = tw + 56;
  y += 38;
  const pillY = y;

  // Pill glow
  ctx.save();
  ctx.shadowColor = BRAND.pink;
  ctx.shadowBlur = 24;
  ctx.fillStyle = BRAND.pink;
  roundRect(ctx, rx, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();

  // Pill gradient
  const pillGrad = ctx.createLinearGradient(rx, pillY, rx + pillW, pillY + pillH);
  pillGrad.addColorStop(0, BRAND.pink);
  pillGrad.addColorStop(1, shade(BRAND.pink, 14));
  ctx.fillStyle = pillGrad;
  roundRect(ctx, rx, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  // Pill text
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText(t, rx + 28, pillY + pillH / 2 + tsize / 2);

  // ═══════════════════════════════════════════════════════════════
  // VIP CREDENTIALS CARD: fills middle/lower canvas beautifully
  // ═══════════════════════════════════════════════════════════════
  const cardY = pillY + pillH + 40;
  const cardW = maxTextW;
  const cardH = 190;

  ctx.save();
  // Card background with frosted dark green fill & border
  ctx.fillStyle = "rgba(2, 53, 28, 0.7)";
  roundRect(ctx, rx, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(252, 225, 0, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Card header label
  ctx.fillStyle = BRAND.pink;
  ctx.font = mono(14, 700);
  trackedText(ctx, "HACKER HOUSE GOA · BUILDER SPECIFICATION", rx + 24, cardY + 32, 2);

  // 3-Column Info Grid
  const col1 = rx + 24;
  const col2 = rx + cardW * 0.37;
  const col3 = rx + cardW * 0.70;

  // Column 1: Classification
  ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
  ctx.font = mono(12);
  ctx.fillText("CLASSIFICATION", col1, cardY + 72);
  ctx.fillStyle = BRAND.yellow;
  ctx.font = mono(16, 700);
  ctx.fillText("OFFICIAL BUILDER", col1, cardY + 98);

  // Column 2: Venue / Dates
  ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
  ctx.font = mono(12);
  ctx.fillText("EVENT WINDOW", col2, cardY + 72);
  ctx.fillStyle = BRAND.cream;
  ctx.font = mono(16, 700);
  ctx.fillText("28-31 OCT · GOA", col2, cardY + 98);

  // Column 3: Handle or Status
  ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
  ctx.font = mono(12);
  ctx.fillText("IDENTITY", col3, cardY + 72);
  ctx.fillStyle = BRAND.yellow;
  ctx.font = mono(16, 700);
  const handleDisplay = data.handle
    ? (data.handle.startsWith("@") ? data.handle : `@${data.handle}`)
    : "VERIFIED HACKER";
  ctx.fillText(handleDisplay, col3, cardY + 98);

  // Bottom badge strip inside card
  ctx.strokeStyle = "rgba(252, 225, 0, 0.15)";
  ctx.beginPath();
  ctx.moveTo(rx + 24, cardY + 128);
  ctx.lineTo(rx + cardW - 24, cardY + 128);
  ctx.stroke();

  ctx.fillStyle = BRAND.cream;
  ctx.font = mono(13);
  ctx.globalAlpha = 0.85;
  ctx.fillText("ACCESS LEVEL: FULL CO-WORKING + HACKATHON + WORKSHOPS", col1, cardY + 158);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ═══════════════════════════════════════════════════════════════
  // FOOTER & STICKER
  // ═══════════════════════════════════════════════════════════════
  ctx.textAlign = "left";
  ctx.fillStyle = BRAND.yellow;
  ctx.font = mono(22, 700);
  ctx.fillText(EVENT.hashtag.toUpperCase(), rx, H - 32);

  ctx.textAlign = "right";
  ctx.fillStyle = BRAND.cream;
  ctx.font = mono(20);
  ctx.globalAlpha = 0.75;
  ctx.fillText(EVENT.studio, W - 60, H - 32);
  ctx.globalAlpha = 1;

  // ── Goa sticker overlapping diagonal edge cleanly ──
  ctx.save();
  ctx.shadowColor = BRAND.pink;
  ctx.shadowBlur = 24;
  await goaSticker(ctx, sliceW - 35, H - 150, 95, -0.12);
  ctx.restore();

  grain(ctx, W, H, 0.04);
}

function passNo(seed: string) {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return String(1000 + (h % 8999));
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("export failed"))),
      "image/png",
    ),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function shareToX(blob: Blob, caption: string, filename: string) {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    }
  } catch {
    /* clipboard fallback */
  }

  downloadBlob(blob, filename);
  window.open(
    `https://x.com/intent/post?text=${encodeURIComponent(caption)}`,
    "_blank",
    "noopener,noreferrer",
  );
  return "intent" as const;
}
