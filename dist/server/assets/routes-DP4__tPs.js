import { useCallback, useEffect, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Toaster, toast } from "sonner";
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/assets/hh-logo.png
var hh_logo_default = "/assets/hh-logo-VpEnEURF.png";
//#endregion
//#region src/assets/hacker-house.png
var hacker_house_default = "/assets/hacker-house-DEQ5KjHG.png";
//#endregion
//#region src/assets/goa-hindi.svg
var goa_hindi_default = "/assets/goa-hindi-Cl0tx9AU.svg";
//#endregion
//#region src/assets/studio-247.svg
var studio_247_default = "/assets/studio-247-BpDW8K-t.svg";
//#endregion
//#region src/lib/brand.ts
var BRAND = {
	green: "#046735",
	greenDeep: "#02351C",
	yellow: "#FCE100",
	pink: "#F0176E",
	cream: "#FFF8E3"
};
var ASSETS = {
	logo: hh_logo_default,
	wordmark: hacker_house_default,
	goa: goa_hindi_default,
	studio: studio_247_default
};
var EVENT = {
	place: "GOA, INDIA",
	dates: "28-31 OCT 2026",
	studio: "2:47 PM STUDIO",
	hashtag: "#FrameInGoa"
};
var TITLES = [
	"MIDNIGHT SHIPPER",
	"CHAI-FUELLED DEBUGGER",
	"PROMPT ALCHEMIST",
	"LATENCY WHISPERER",
	"SUSEGAD SYSTEMS POET",
	"COMMIT MONSOON",
	"ZERO-TO-DEMO GREMLIN",
	"REGEX ROMANTIC",
	"TERMINAL TOURIST",
	"BEACHSIDE ARCHITECT",
	"FEATURE FLAG PIRATE",
	"SEGFAULT SURFER",
	"PIXEL PERFECTIONIST",
	"COCONUT CLOUD WRANGLER",
	"REFACTOR ROMEO",
	"VIBE COMPILER"
];
function builderTitle(seed) {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = h * 31 + seed.charCodeAt(i) >>> 0;
	return TITLES[h % TITLES.length] ?? "VIBE COMPILER";
}
//#endregion
//#region src/lib/generate.ts
var imgCache = /* @__PURE__ */ new Map();
function loadImage(src) {
	const cached = imgCache.get(src);
	if (cached) return cached;
	const p = new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("image failed: " + src));
		img.src = src;
	});
	imgCache.set(src, p);
	return p;
}
/** Turn any user file (incl. iPhone HEIC) into a decoded image. */
async function readPhoto(file) {
	let blob = file;
	if (/image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) try {
		const heic2any = (await import("heic2any")).default;
		const out = await heic2any({
			blob: file,
			toType: "image/jpeg",
			quality: .94
		});
		blob = (Array.isArray(out) ? out[0] : out) ?? file;
	} catch {}
	const url = URL.createObjectURL(blob);
	try {
		return await loadImage(url);
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 3e4);
	}
}
async function ensureFonts() {
	if (typeof document === "undefined" || !document.fonts) return;
	const timeout = new Promise((resolve) => setTimeout(resolve, 1e3));
	const fontLoads = Promise.all([
		document.fonts.load("700 120px \"Bodoni Moda\""),
		document.fonts.load("400 40px \"DM Mono\""),
		document.fonts.load("500 40px \"DM Mono\"")
	]).then(() => document.fonts.ready).catch(() => void 0);
	await Promise.race([fontLoads, timeout]);
}
var display = (px, weight = 700) => `${weight} ${px}px "Bodoni Moda", "Times New Roman", serif`;
var mono = (px, weight = 500) => `${weight} ${px}px "DM Mono", ui-monospace, monospace`;
function grain(ctx, w, h, alpha = .05) {
	const n = document.createElement("canvas");
	const s = 220;
	n.width = s;
	n.height = s;
	const nctx = n.getContext("2d");
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
	for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) ctx.drawImage(n, x, y);
	ctx.restore();
}
/** cover-crop draw: works for portrait, landscape, off-centre photos */
function drawCover(ctx, img, x, y, w, h, zoom = 1, offY = 0, offX = 0) {
	const scale = Math.max(w / img.width, h / img.height) * zoom;
	const dw = img.width * scale;
	const dh = img.height * scale;
	ctx.drawImage(img, x + (w - dw) / 2 + offX * w, y + (h - dh) / 2 + offY * h, dw, dh);
}
function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}
async function goaSticker(ctx, cx, cy, r, rotate = -.14) {
	const goa = await loadImage(ASSETS.goa);
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(rotate);
	ctx.beginPath();
	for (let i = 0; i < 22; i++) {
		const rr = i % 2 === 0 ? r : r * .9;
		const a = i / 22 * Math.PI * 2;
		const px = Math.cos(a) * rr;
		const py = Math.sin(a) * rr;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.fillStyle = BRAND.pink;
	ctx.fill();
	ctx.lineWidth = r * .06;
	ctx.strokeStyle = BRAND.yellow;
	ctx.stroke();
	const s = r * 1.15;
	ctx.globalCompositeOperation = "source-atop";
	ctx.drawImage(goa, -s / 2, -s / 2, s, s);
	ctx.restore();
}
/** Lighten (+) or darken (-) a hex color by a percentage. Used for gradient/shadow depth. */
function shade(hex, percent) {
	const n = parseInt(hex.replace("#", ""), 16);
	const amt = Math.round(2.55 * percent);
	const r = Math.min(255, Math.max(0, (n >> 16) + amt));
	const g = Math.min(255, Math.max(0, (n >> 8 & 255) + amt));
	const b = Math.min(255, Math.max(0, (n & 255) + amt));
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
/** Manually letter-spaced text — canvas has no native tracking control. */
function trackedText(ctx, text, x, y, spacing) {
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
/** Draw a hexagonal path centered at (cx, cy) with the given radius. */
function hexPath(ctx, cx, cy, r, rotation = -Math.PI / 6) {
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = rotation + Math.PI / 3 * i;
		const px = cx + r * Math.cos(angle);
		const py = cy + r * Math.sin(angle);
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
}
/** Neon glow stroke on the current path — bloom outward then a crisp inner line. */
function neonGlow(ctx, color, innerColor, outerWidth, innerWidth, blur) {
	ctx.save();
	ctx.shadowColor = color;
	ctx.shadowBlur = blur;
	ctx.strokeStyle = color;
	ctx.lineWidth = outerWidth;
	ctx.stroke();
	ctx.shadowBlur = blur * .5;
	ctx.stroke();
	ctx.restore();
	ctx.strokeStyle = innerColor;
	ctx.lineWidth = innerWidth;
	ctx.stroke();
}
/** Viewfinder / target reticle bracket at a corner. */
function reticle(ctx, x, y, size, corner, color, alpha = .4) {
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
function dotGrid(ctx, w, h, spacing, radius, color, alpha = .06) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;
	for (let y = spacing; y < h; y += spacing) for (let x = spacing; x < w; x += spacing) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}
/** Format A: "Neon Jungle Badge" PFP Frame (1080 x 1080) */
async function renderPfp(canvas, photo, opts = {}) {
	const S = 1080;
	canvas.width = S;
	canvas.height = S;
	const ctx = canvas.getContext("2d");
	const cx = S / 2;
	const bg = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 1.05);
	bg.addColorStop(0, shade(BRAND.green, 6));
	bg.addColorStop(.35, BRAND.green);
	bg.addColorStop(.7, shade(BRAND.green, -12));
	bg.addColorStop(1, shade(BRAND.greenDeep, -6));
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, S, S);
	dotGrid(ctx, S, S, 28, 1.5, BRAND.yellow, .04);
	const hexR = 370;
	ctx.save();
	for (let i = 1; i <= 6; i++) {
		const ringR = 420 + i * 32;
		const alpha = .035 - i * .004;
		if (alpha <= 0) break;
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = BRAND.yellow;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.arc(cx, cx, ringR, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.restore();
	const m = 42;
	const rl = 60;
	reticle(ctx, m, m, rl, "tl", BRAND.yellow, .5);
	reticle(ctx, 1038, m, rl, "tr", BRAND.yellow, .5);
	reticle(ctx, m, 1038, rl, "bl", BRAND.yellow, .5);
	reticle(ctx, 1038, 1038, rl, "br", BRAND.yellow, .5);
	const hexBounds = hexR * 2;
	const photoX = 170;
	const photoY = 170;
	ctx.save();
	hexPath(ctx, cx, cx, hexR);
	ctx.clip();
	ctx.fillStyle = "#000";
	ctx.fillRect(photoX, photoY, hexBounds, hexBounds);
	drawCover(ctx, photo, photoX, photoY, hexBounds, hexBounds, opts.zoom ?? 1, opts.offY ?? 0, opts.offX ?? 0);
	const vig = ctx.createRadialGradient(cx, cx, hexR * .65, cx, cx, hexR);
	vig.addColorStop(0, "rgba(0,0,0,0)");
	vig.addColorStop(1, "rgba(0,0,0,0.35)");
	ctx.fillStyle = vig;
	ctx.fillRect(photoX, photoY, hexBounds, hexBounds);
	ctx.restore();
	hexPath(ctx, cx, cx, hexR);
	neonGlow(ctx, BRAND.pink, BRAND.yellow, 8, 2.5, 36);
	ctx.save();
	ctx.globalAlpha = .25;
	hexPath(ctx, cx, cx, 398);
	ctx.strokeStyle = BRAND.yellow;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.restore();
	const textY = 114;
	ctx.textAlign = "center";
	ctx.textBaseline = "alphabetic";
	ctx.save();
	ctx.fillStyle = BRAND.pink;
	ctx.globalAlpha = .45;
	ctx.font = display(84);
	ctx.fillText("HACKER HOUSE", 543, 117);
	ctx.restore();
	ctx.fillStyle = BRAND.yellow;
	ctx.font = display(84);
	ctx.fillText("HACKER HOUSE", cx, textY);
	ctx.font = mono(26);
	ctx.fillStyle = BRAND.yellow;
	ctx.globalAlpha = .8;
	ctx.fillText(`GOA  ·  ${EVENT.dates}  ·  ${EVENT.studio}`, cx, 152);
	ctx.globalAlpha = 1;
	const btmY = 982;
	ctx.font = mono(24);
	ctx.fillStyle = BRAND.cream;
	ctx.globalAlpha = .6;
	ctx.fillText(EVENT.hashtag.toUpperCase(), cx, btmY);
	ctx.globalAlpha = 1;
	ctx.save();
	ctx.fillStyle = BRAND.yellow;
	ctx.globalAlpha = .3;
	for (const [dx, dy] of [
		[72, 72],
		[92, 56],
		[56, 96],
		[1008, 72],
		[988, 56],
		[1024, 96],
		[72, 1008],
		[92, 1024],
		[56, 984],
		[1008, 1008],
		[988, 1024],
		[1024, 984]
	]) {
		ctx.beginPath();
		ctx.arc(dx, dy, 3, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
	ctx.save();
	ctx.shadowColor = BRAND.pink;
	ctx.shadowBlur = 22;
	await goaSticker(ctx, 932, 932, 120, .1);
	ctx.restore();
	grain(ctx, S, S, .05);
}
/** Format B: "Holo Passport" Builder ID Pass Banner (1600 x 900) */
async function renderCard(canvas, photo, data, opts = {}) {
	const W = 1600;
	const H = 900;
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext("2d");
	const bg = ctx.createLinearGradient(0, 0, W, H);
	bg.addColorStop(0, shade(BRAND.greenDeep, -10));
	bg.addColorStop(.5, shade(BRAND.green, -6));
	bg.addColorStop(1, shade(BRAND.greenDeep, -8));
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, W, H);
	const glow = ctx.createRadialGradient(W * .68, H * .45, 0, W * .68, H * .45, 500);
	glow.addColorStop(0, "rgba(4,103,53,0.5)");
	glow.addColorStop(1, "rgba(4,103,53,0)");
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, W, H);
	const photoClip = new Path2D();
	photoClip.moveTo(0, 0);
	photoClip.lineTo(660, 0);
	photoClip.lineTo(500, H);
	photoClip.lineTo(0, H);
	photoClip.closePath();
	ctx.save();
	ctx.clip(photoClip);
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, 660, H);
	drawCover(ctx, photo, 0, 0, 660, H, opts.zoom ?? 1, opts.offY ?? 0, opts.offX ?? 0);
	const edgeFade = ctx.createLinearGradient(420, 0, 660, 0);
	edgeFade.addColorStop(0, "rgba(2,53,28,0)");
	edgeFade.addColorStop(1, "rgba(2,53,28,0.85)");
	ctx.fillStyle = edgeFade;
	ctx.fillRect(0, 0, 660, H);
	const btmFade = ctx.createLinearGradient(0, 720, 0, H);
	btmFade.addColorStop(0, "rgba(0,0,0,0)");
	btmFade.addColorStop(1, "rgba(0,0,0,0.5)");
	ctx.fillStyle = btmFade;
	ctx.fillRect(0, 720, 660, 180);
	ctx.restore();
	ctx.save();
	ctx.strokeStyle = BRAND.pink;
	ctx.lineWidth = 4;
	ctx.shadowColor = BRAND.pink;
	ctx.shadowBlur = 30;
	ctx.beginPath();
	ctx.moveTo(660, 0);
	ctx.lineTo(500, H);
	ctx.stroke();
	ctx.shadowBlur = 15;
	ctx.lineWidth = 2;
	ctx.strokeStyle = BRAND.yellow;
	ctx.stroke();
	ctx.restore();
	const stripeY = 82;
	const stripeH = 6;
	const stripeGrad = ctx.createLinearGradient(0, 0, W, 0);
	stripeGrad.addColorStop(0, BRAND.pink);
	stripeGrad.addColorStop(.3, BRAND.pink);
	stripeGrad.addColorStop(.5, BRAND.yellow);
	stripeGrad.addColorStop(.7, BRAND.pink);
	stripeGrad.addColorStop(1, BRAND.pink);
	ctx.fillStyle = stripeGrad;
	ctx.fillRect(0, stripeY, W, stripeH);
	ctx.strokeStyle = BRAND.yellow;
	ctx.lineWidth = 1;
	ctx.globalAlpha = .25;
	ctx.beginPath();
	ctx.moveTo(0, 94);
	ctx.lineTo(W, 94);
	ctx.stroke();
	ctx.globalAlpha = 1;
	const btmStripeY = 830;
	ctx.fillStyle = stripeGrad;
	ctx.fillRect(0, btmStripeY, W, stripeH);
	const wm = await loadImage(ASSETS.wordmark);
	const wmW = 360;
	const wmH = wm.height / wm.width * wmW;
	ctx.save();
	ctx.globalAlpha = .92;
	ctx.drawImage(wm, 40, H - wmH - 95, wmW, wmH);
	ctx.restore();
	const rx = 650;
	ctx.textAlign = "right";
	ctx.textBaseline = "alphabetic";
	const numStr = `NO. ${passNo(data.name)}`;
	ctx.font = mono(20, 700);
	const numW = ctx.measureText(numStr).width;
	ctx.fillStyle = BRAND.pink;
	ctx.fillText(numStr, 1540, 42);
	ctx.fillStyle = BRAND.yellow;
	ctx.fillText("OFFICIAL BUILDER PASS · ", 1540 - numW, 42);
	ctx.font = mono(16, 500);
	ctx.fillStyle = BRAND.cream;
	ctx.globalAlpha = .75;
	ctx.fillText(`${EVENT.place}  ·  ${EVENT.dates}`, 1540, 68);
	ctx.globalAlpha = 1;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	const maxTextW = 890;
	let y = 265;
	const name = (data.name || "YOUR NAME").toUpperCase();
	let nameSize = 120;
	do {
		ctx.font = display(nameSize);
		nameSize -= 4;
	} while (ctx.measureText(name).width > maxTextW && nameSize > 40);
	ctx.save();
	ctx.fillStyle = BRAND.pink;
	ctx.globalAlpha = .2;
	ctx.shadowColor = BRAND.pink;
	ctx.shadowBlur = 40;
	ctx.fillText(name, 652, y + 2);
	ctx.restore();
	ctx.fillStyle = BRAND.yellow;
	ctx.fillText(name, rx, y);
	const nameW = ctx.measureText(name).width;
	ctx.strokeStyle = BRAND.pink;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(rx, y + 16);
	ctx.lineTo(rx + Math.min(nameW, maxTextW), y + 16);
	ctx.stroke();
	y += 62;
	ctx.fillStyle = BRAND.cream;
	const roleTxt = (data.role || "BUILDER").toUpperCase();
	let rsize = 32;
	do {
		ctx.font = mono(rsize);
		rsize -= 2;
	} while (ctx.measureText(roleTxt).width > maxTextW && rsize > 16);
	ctx.fillText(roleTxt, rx, y);
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
	ctx.save();
	ctx.shadowColor = BRAND.pink;
	ctx.shadowBlur = 24;
	ctx.fillStyle = BRAND.pink;
	roundRect(ctx, rx, pillY, pillW, pillH, pillH / 2);
	ctx.fill();
	ctx.restore();
	const pillGrad = ctx.createLinearGradient(rx, pillY, rx + pillW, pillY + pillH);
	pillGrad.addColorStop(0, BRAND.pink);
	pillGrad.addColorStop(1, shade(BRAND.pink, 14));
	ctx.fillStyle = pillGrad;
	roundRect(ctx, rx, pillY, pillW, pillH, pillH / 2);
	ctx.fill();
	ctx.fillStyle = BRAND.yellow;
	ctx.fillText(t, 678, pillY + pillH / 2 + tsize / 2);
	const cardY = pillY + pillH + 40;
	const cardW = maxTextW;
	const cardH = 190;
	ctx.save();
	ctx.fillStyle = "rgba(2, 53, 28, 0.7)";
	roundRect(ctx, rx, cardY, cardW, cardH, 12);
	ctx.fill();
	ctx.strokeStyle = "rgba(252, 225, 0, 0.35)";
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.fillStyle = BRAND.pink;
	ctx.font = mono(14, 700);
	trackedText(ctx, "HACKER HOUSE GOA · BUILDER SPECIFICATION", 674, cardY + 32, 2);
	const col1 = 674;
	const col2 = 979.3;
	const col3 = 1273;
	ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
	ctx.font = mono(12);
	ctx.fillText("CLASSIFICATION", col1, cardY + 72);
	ctx.fillStyle = BRAND.yellow;
	ctx.font = mono(16, 700);
	ctx.fillText("OFFICIAL BUILDER", col1, cardY + 98);
	ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
	ctx.font = mono(12);
	ctx.fillText("EVENT WINDOW", col2, cardY + 72);
	ctx.fillStyle = BRAND.cream;
	ctx.font = mono(16, 700);
	ctx.fillText("28-31 OCT · GOA", col2, cardY + 98);
	ctx.fillStyle = "rgba(255, 248, 227, 0.6)";
	ctx.font = mono(12);
	ctx.fillText("IDENTITY", col3, cardY + 72);
	ctx.fillStyle = BRAND.yellow;
	ctx.font = mono(16, 700);
	const handleDisplay = data.handle ? data.handle.startsWith("@") ? data.handle : `@${data.handle}` : "VERIFIED HACKER";
	ctx.fillText(handleDisplay, col3, cardY + 98);
	ctx.strokeStyle = "rgba(252, 225, 0, 0.15)";
	ctx.beginPath();
	ctx.moveTo(674, cardY + 128);
	ctx.lineTo(1516, cardY + 128);
	ctx.stroke();
	ctx.fillStyle = BRAND.cream;
	ctx.font = mono(13);
	ctx.globalAlpha = .85;
	ctx.fillText("ACCESS LEVEL: FULL CO-WORKING + HACKATHON + WORKSHOPS", col1, cardY + 158);
	ctx.globalAlpha = 1;
	ctx.restore();
	ctx.textAlign = "left";
	ctx.fillStyle = BRAND.yellow;
	ctx.font = mono(22, 700);
	ctx.fillText(EVENT.hashtag.toUpperCase(), rx, 868);
	ctx.textAlign = "right";
	ctx.fillStyle = BRAND.cream;
	ctx.font = mono(20);
	ctx.globalAlpha = .75;
	ctx.fillText(EVENT.studio, 1540, 868);
	ctx.globalAlpha = 1;
	ctx.save();
	ctx.shadowColor = BRAND.pink;
	ctx.shadowBlur = 24;
	await goaSticker(ctx, 545, 750, 95, -.12);
	ctx.restore();
	grain(ctx, W, H, .04);
}
function passNo(seed) {
	let h = 7;
	for (let i = 0; i < seed.length; i++) h = h * 33 + seed.charCodeAt(i) >>> 0;
	return String(1e3 + h % 8999);
}
function canvasToBlob(canvas) {
	return new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("export failed")), "image/png"));
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
async function shareToX(blob, caption, filename) {
	try {
		if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	} catch {}
	downloadBlob(blob, filename);
	window.open(`https://x.com/intent/post?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
	return "intent";
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Index() {
	const canvasRef = useRef(null);
	const fileRef = useRef(null);
	const containerRef = useRef(null);
	const renderChain = useRef(Promise.resolve());
	const [step, setStep] = useState("landing");
	const [photo, setPhoto] = useState(null);
	const [mode, setMode] = useState("pfp");
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [handle, setHandle] = useState("");
	const [zoom, setZoom] = useState(1);
	const [offX, setOffX] = useState(0);
	const [offY, setOffY] = useState(0);
	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(false);
	const isDragging = useRef(false);
	const dragStart = useRef({
		x: 0,
		y: 0,
		offX: 0,
		offY: 0
	});
	const touchDistStart = useRef(null);
	const zoomStart = useRef(1);
	const title = builderTitle((name || "builder") + (role || ""));
	useEffect(() => {
		ensureFonts().then(() => setReady(true));
	}, []);
	const draw = useCallback(async () => {
		const canvas = canvasRef.current;
		if (!canvas || !photo) return;
		const next = renderChain.current.catch(() => void 0).then(() => mode === "pfp" ? renderPfp(canvas, photo, {
			zoom,
			offY,
			offX
		}) : renderCard(canvas, photo, {
			name: name || "Your Name",
			role: role || "Builder",
			title,
			handle
		}, {
			zoom,
			offY,
			offX
		}));
		renderChain.current = next;
		await next;
	}, [
		photo,
		mode,
		name,
		role,
		handle,
		title,
		zoom,
		offY,
		offX
	]);
	useEffect(() => {
		if (photo && (step === "adjust" || step === "output")) draw();
	}, [
		draw,
		photo,
		step
	]);
	async function onFile(file) {
		if (!file) return;
		setBusy(true);
		try {
			await ensureFonts();
			const img = await readPhoto(file);
			setZoom(1);
			setOffX(0);
			setOffY(0);
			setPhoto(img);
			if (step === "landing") setStep("adjust");
		} catch {
			toast.error("Couldn't read that photo. Try a JPG or PNG.");
		} finally {
			setBusy(false);
		}
	}
	const handlePointerDown = (e) => {
		if (!photo) return;
		isDragging.current = true;
		dragStart.current = {
			x: e.clientX,
			y: e.clientY,
			offX,
			offY
		};
		e.target.setPointerCapture?.(e.pointerId);
	};
	const handlePointerMove = (e) => {
		if (!isDragging.current || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const dx = (e.clientX - dragStart.current.x) / (rect.width || 1);
		const dy = (e.clientY - dragStart.current.y) / (rect.height || 1);
		setOffX(Math.max(-.6, Math.min(.6, dragStart.current.offX + dx)));
		setOffY(Math.max(-.6, Math.min(.6, dragStart.current.offY + dy)));
	};
	const handlePointerUp = (e) => {
		isDragging.current = false;
		e.target.releasePointerCapture?.(e.pointerId);
	};
	const handleWheel = (e) => {
		if (!photo) return;
		e.preventDefault();
		const delta = e.deltaY > 0 ? -.05 : .05;
		setZoom((z) => Math.max(.8, Math.min(3, Number((z + delta).toFixed(2)))));
	};
	const handleTouchStart = (e) => {
		if (e.touches.length === 2) {
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			touchDistStart.current = dist;
			zoomStart.current = zoom;
		}
	};
	const handleTouchMove = (e) => {
		if (e.touches.length === 2 && touchDistStart.current !== null) {
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const ratio = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) / touchDistStart.current;
			const newZoom = Math.max(.8, Math.min(3, zoomStart.current * ratio));
			setZoom(Number(newZoom.toFixed(2)));
		}
	};
	const handleTouchEnd = () => {
		touchDistStart.current = null;
	};
	const filename = mode === "pfp" ? "hh-goa-2026-pfp.png" : "hh-goa-2026-builder-id.png";
	const caption = mode === "pfp" ? `Framed up for HACKER HOUSE GOA 2026 🥷🥥 ${EVENT.dates} · ${EVENT.place}\n${EVENT.hashtag}` : `My builder pass for HACKER HOUSE GOA 2026 — ${title.toLowerCase()} reporting for duty 🥥\n${EVENT.dates} · ${EVENT.place}\n${EVENT.hashtag}`;
	async function handleDownload() {
		const canvas = canvasRef.current;
		if (!canvas || !photo) return;
		downloadBlob(await canvasToBlob(canvas), filename);
		toast.success("Saved to your device");
	}
	async function handleShare() {
		const canvas = canvasRef.current;
		if (!canvas || !photo) return;
		await shareToX(await canvasToBlob(canvas), caption, filename);
		toast.success("Image copied & saved! Paste (Ctrl+V) or attach on X");
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "brand-grain min-h-screen font-mono text-foreground",
		children: [
			/* @__PURE__ */ jsx(Toaster$1, {}),
			/* @__PURE__ */ jsxs("header", {
				className: "mx-auto flex max-w-6xl items-center justify-between px-5 pt-6",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setStep("landing"),
					className: "cursor-pointer transition-opacity hover:opacity-80",
					children: /* @__PURE__ */ jsx("img", {
						src: ASSETS.studio,
						alt: "2:47 PM Studio",
						className: "h-9 w-auto"
					})
				}), /* @__PURE__ */ jsx("a", {
					href: `https://x.com/search?q=${encodeURIComponent(EVENT.hashtag)}`,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "text-xs tracking-widest text-primary/80 underline-offset-4 hover:underline sm:text-sm",
					children: "CHECK HYPE"
				})]
			}),
			/* @__PURE__ */ jsx("input", {
				ref: fileRef,
				type: "file",
				accept: "image/*,.heic,.heif",
				className: "hidden",
				onChange: (e) => void onFile(e.target.files?.[0])
			}),
			step === "landing" && /* @__PURE__ */ jsxs("section", {
				className: "mx-auto max-w-4xl px-5 pt-10 pb-20 text-center sm:pt-16",
				children: [
					/* @__PURE__ */ jsx("img", {
						src: ASSETS.logo,
						alt: "Hacker House Goa",
						className: "mx-auto w-full max-w-md sm:max-w-xl"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-4 text-xs tracking-[0.35em] text-primary sm:text-sm",
						children: [
							EVENT.place,
							" · ",
							EVENT.dates,
							" · ",
							EVENT.studio
						]
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "display mt-8 text-4xl text-primary sm:text-6xl",
						children: "FRAME YOURSELF IN GOA"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base",
						children: "Create your custom profile frame or official builder ID badge for Hacker House Goa 2026 in seconds."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto mt-10 grid max-w-2xl gap-5 sm:grid-cols-2",
						children: [/* @__PURE__ */ jsxs("div", {
							onClick: () => setMode("pfp"),
							className: `cursor-pointer rounded-lg border-2 p-6 text-left transition-all ${mode === "pfp" ? "border-primary bg-card/90 shadow-lg shadow-primary/10" : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"}`,
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "display text-xl text-primary",
									children: "PFP FRAME"
								}), /* @__PURE__ */ jsx("div", { className: `h-4 w-4 rounded-full border ${mode === "pfp" ? "border-primary bg-primary" : "border-muted-foreground"}` })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Circular avatar overlay with curved event typography for X & Discord profiles."
							})]
						}), /* @__PURE__ */ jsxs("div", {
							onClick: () => setMode("card"),
							className: `cursor-pointer rounded-lg border-2 p-6 text-left transition-all ${mode === "card" ? "border-primary bg-card/90 shadow-lg shadow-primary/10" : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"}`,
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "display text-xl text-primary",
									children: "BUILDER ID"
								}), /* @__PURE__ */ jsx("div", { className: `h-4 w-4 rounded-full border ${mode === "card" ? "border-primary bg-primary" : "border-muted-foreground"}` })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Full builder pass banner featuring your name, stack, handle, and generated hacker title."
							})]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row",
						children: /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => {
								if (photo) setStep("adjust");
								else fileRef.current?.click();
							},
							className: "cursor-pointer rounded-md border border-primary bg-primary px-8 py-4 text-xs tracking-[0.25em] text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]",
							children: photo ? "CONTINUE WITH PHOTO →" : "UPLOAD PHOTO TO START →"
						})
					})
				]
			}),
			step === "adjust" && /* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-6xl px-5 pt-8 pb-20",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-6 flex items-center justify-between border-b border-border/40 pb-4",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setStep("landing"),
						className: "cursor-pointer text-xs tracking-widest text-muted-foreground hover:text-primary",
						children: "← BACK TO HOME"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs tracking-[0.2em] text-primary",
						children: "STEP 1 OF 2 · CUSTOMIZE GRAPHIC"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-6",
						children: [/* @__PURE__ */ jsx("div", {
							className: "tape-trim rounded-lg p-[3px]",
							children: /* @__PURE__ */ jsxs("div", {
								className: "rounded-md bg-card p-4 sm:p-6",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "mb-4 grid grid-cols-2 gap-2",
										children: [["pfp", "PFP FRAME"], ["card", "BUILDER ID"]].map(([m, label]) => /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setMode(m),
											className: `cursor-pointer rounded-sm border px-3 py-2.5 text-[11px] tracking-[0.2em] transition-colors sm:text-xs ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:bg-secondary"}`,
											children: label
										}, m))
									}),
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => fileRef.current?.click(),
										onDragOver: (e) => e.preventDefault(),
										onDrop: (e) => {
											e.preventDefault();
											onFile(e.dataTransfer.files?.[0]);
										},
										className: "w-full cursor-pointer rounded-md border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-secondary",
										children: [/* @__PURE__ */ jsx("span", {
											className: "display block text-xl text-primary",
											children: photo ? "CHANGE PHOTO" : "UPLOAD YOUR PHOTO"
										}), /* @__PURE__ */ jsx("span", {
											className: "mt-1 block text-[11px] tracking-widest text-muted-foreground",
											children: "JPG · PNG · HEIC · WEBP"
										})]
									}),
									photo && /* @__PURE__ */ jsx("p", {
										className: "mt-3 text-center text-[11px] tracking-wider text-accent",
										children: "💡 TIP: DRAG PHOTO TO MOVE & WHEEL/PINCH TO ZOOM"
									}),
									photo && /* @__PURE__ */ jsxs("div", {
										className: "mt-5 space-y-4 rounded-md bg-background/50 p-4 border border-border/40",
										children: [
											/* @__PURE__ */ jsxs("label", {
												className: "block text-[11px] tracking-[0.2em] text-muted-foreground",
												children: [
													"ZOOM (",
													zoom.toFixed(2),
													"x)",
													/* @__PURE__ */ jsx("input", {
														type: "range",
														min: .8,
														max: 3,
														step: .02,
														value: zoom,
														onChange: (e) => setZoom(Number(e.target.value)),
														className: "mt-2 w-full accent-[var(--color-accent)]"
													})
												]
											}),
											/* @__PURE__ */ jsxs("label", {
												className: "block text-[11px] tracking-[0.2em] text-muted-foreground",
												children: ["HORIZONTAL POSITION", /* @__PURE__ */ jsx("input", {
													type: "range",
													min: -.6,
													max: .6,
													step: .01,
													value: offX,
													onChange: (e) => setOffX(Number(e.target.value)),
													className: "mt-2 w-full accent-[var(--color-accent)]"
												})]
											}),
											/* @__PURE__ */ jsxs("label", {
												className: "block text-[11px] tracking-[0.2em] text-muted-foreground",
												children: ["VERTICAL POSITION", /* @__PURE__ */ jsx("input", {
													type: "range",
													min: -.6,
													max: .6,
													step: .01,
													value: offY,
													onChange: (e) => setOffY(Number(e.target.value)),
													className: "mt-2 w-full accent-[var(--color-accent)]"
												})]
											}),
											/* @__PURE__ */ jsx("button", {
												type: "button",
												onClick: () => {
													setZoom(1);
													setOffX(0);
													setOffY(0);
												},
												className: "cursor-pointer text-[10px] tracking-widest text-muted-foreground underline hover:text-primary",
												children: "RESET POSITION & ZOOM"
											})
										]
									}),
									mode === "card" && /* @__PURE__ */ jsxs("div", {
										className: "mt-5 grid gap-3",
										children: [
											/* @__PURE__ */ jsx(Field, {
												label: "NAME",
												value: name,
												onChange: setName,
												placeholder: "Aarav Mehta"
											}),
											/* @__PURE__ */ jsx(Field, {
												label: "STACK / ROLE",
												value: role,
												onChange: setRole,
												placeholder: "Full-stack · TS + Rust"
											}),
											/* @__PURE__ */ jsx(Field, {
												label: "X HANDLE (OPTIONAL)",
												value: handle,
												onChange: setHandle,
												placeholder: "@builder"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "text-[11px] tracking-widest text-muted-foreground",
												children: [
													"BUILDER TITLE:",
													" ",
													/* @__PURE__ */ jsx("span", {
														className: "text-accent",
														children: title
													})
												]
											})
										]
									})
								]
							})
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: !photo,
							onClick: () => setStep("output"),
							className: "w-full cursor-pointer rounded-sm border border-primary bg-primary px-4 py-4 text-xs tracking-[0.25em] text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
							children: "GENERATE GRAPHIC →"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-4",
						children: /* @__PURE__ */ jsx("div", {
							ref: containerRef,
							onPointerDown: handlePointerDown,
							onPointerMove: handlePointerMove,
							onPointerUp: handlePointerUp,
							onPointerCancel: handlePointerUp,
							onWheel: handleWheel,
							onTouchStart: handleTouchStart,
							onTouchMove: handleTouchMove,
							onTouchEnd: handleTouchEnd,
							className: "relative rounded-lg border border-border bg-card p-3 sm:p-5 touch-none select-none",
							children: photo ? /* @__PURE__ */ jsx("canvas", {
								ref: canvasRef,
								className: "h-auto w-full rounded-sm cursor-grab active:cursor-grabbing",
								"aria-label": "Generated Hacker House Goa 2026 graphic"
							}) : /* @__PURE__ */ jsx("div", {
								onClick: () => fileRef.current?.click(),
								className: "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-border p-6 text-center text-xs tracking-[0.25em] text-muted-foreground transition-colors hover:bg-secondary/40",
								children: busy ? "COOKING…" : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									className: "display text-2xl text-primary mb-2",
									children: "CLICK TO UPLOAD"
								}), /* @__PURE__ */ jsx("span", { children: "YOUR GRAPHIC PREVIEW APPEARS HERE" })] })
							})
						})
					})]
				})]
			}),
			step === "output" && /* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-4xl px-5 pt-8 pb-20 text-center",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-6 flex items-center justify-between border-b border-border/40 pb-4",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setStep("adjust"),
							className: "cursor-pointer text-xs tracking-widest text-muted-foreground hover:text-primary",
							children: "← EDIT DETAILS"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs tracking-[0.2em] text-primary",
							children: "STEP 2 OF 2 · YOUR GRAPHIC IS READY"
						})]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "display text-3xl text-primary sm:text-5xl",
						children: "YOUR HACKER HOUSE GRAPHIC"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-xs tracking-widest text-muted-foreground",
						children: "READY TO DOWNLOAD & POST ON X"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mx-auto mt-8 max-w-2xl rounded-xl border border-border/60 bg-card p-4 shadow-2xl shadow-primary/10",
						children: /* @__PURE__ */ jsx("canvas", {
							ref: canvasRef,
							className: "h-auto w-full rounded-md shadow-md",
							"aria-label": "Final rendered Hacker House graphic"
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto mt-8 grid max-w-md gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => void handleDownload(),
							className: "cursor-pointer rounded-sm border border-primary bg-primary px-6 py-4 text-xs tracking-[0.25em] text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]",
							children: "DOWNLOAD PNG"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => void handleShare(),
							className: "cursor-pointer rounded-sm border border-accent bg-accent px-6 py-4 text-xs tracking-[0.25em] text-accent-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]",
							children: "SHARE TO X"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto mt-6 max-w-md rounded-md bg-background/60 p-4 border border-border/40 text-left",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] tracking-widest text-accent font-semibold block mb-1",
							children: "PRE-FILLED CAPTION (COPIED TO CLIPBOARD):"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap",
							children: caption
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-8",
						children: /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => {
								setPhoto(null);
								setStep("landing");
							},
							className: "cursor-pointer text-xs tracking-widest text-muted-foreground underline hover:text-primary",
							children: "CREATE ANOTHER GRAPHIC"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("footer", {
				className: "border-t border-border py-6 text-center text-[11px] tracking-[0.3em] text-primary/70",
				children: [
					"HACKER HOUSE GOA · ",
					EVENT.dates,
					" · ",
					EVENT.studio
				]
			})
		]
	});
}
function Field({ label, value, onChange, placeholder }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "block text-[11px] tracking-[0.2em] text-muted-foreground",
		children: [label, /* @__PURE__ */ jsx("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder,
			className: "mt-2 w-full rounded-sm border border-input bg-background px-3 py-3 text-sm tracking-normal text-primary placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
		})]
	});
}
//#endregion
export { Index as component };
