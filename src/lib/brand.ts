import logoAsset from "@/assets/hh-logo.png";
import wordmarkAsset from "@/assets/hacker-house.png";
import goaAsset from "@/assets/goa-hindi.svg";
import studioAsset from "@/assets/studio-247.svg";

export const BRAND = {
  green: "#046735",
  greenDeep: "#02351C",
  yellow: "#FCE100",
  pink: "#F0176E",
  cream: "#FFF8E3",
};

export const ASSETS = {
  logo: logoAsset,
  wordmark: wordmarkAsset,
  goa: goaAsset,
  studio: studioAsset,
};

export const EVENT = {
  place: "GOA, INDIA",
  dates: "28-31 OCT 2026",
  studio: "2:47 PM STUDIO",
  hashtag: "#FrameInGoa",
};

const TITLES = [
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
  "VIBE COMPILER",
];

export function builderTitle(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TITLES[h % TITLES.length] ?? "VIBE COMPILER";
}

export function allTitles() {
  return TITLES;
}
