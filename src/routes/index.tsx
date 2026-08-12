import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ASSETS, EVENT, builderTitle } from "@/lib/brand";
import {
  canvasToBlob,
  downloadBlob,
  ensureFonts,
  readPhoto,
  renderCard,
  renderPfp,
  shareToX,
} from "@/lib/generate";

const TITLE = "Hacker House Goa 2026 — Frame & Builder ID Generator";
const DESC =
  "Upload one photo and get a branded Hacker House Goa 2026 profile frame or builder ID card, ready to download and post on X.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

type Mode = "pfp" | "card";
type FlowStep = "landing" | "adjust" | "output";

function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderChain = useRef<Promise<unknown>>(Promise.resolve());

  const [step, setStep] = useState<FlowStep>("landing");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<Mode>("pfp");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [handle, setHandle] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Drag & Pinch Gesture State
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 });
  const touchDistStart = useRef<number | null>(null);
  const zoomStart = useRef(1);

  const title = builderTitle((name || "builder") + (role || ""));

  useEffect(() => {
    ensureFonts().then(() => setReady(true));
  }, []);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    const next = renderChain.current
      .catch(() => undefined)
      .then(() =>
        mode === "pfp"
          ? renderPfp(canvas, photo, { zoom, offY, offX })
          : renderCard(
              canvas,
              photo,
              {
                name: name || "Your Name",
                role: role || "Builder",
                title,
                handle,
              },
              { zoom, offY, offX },
            ),
      );
    renderChain.current = next;
    await next;
  }, [photo, mode, name, role, handle, title, zoom, offY, offX]);

  useEffect(() => {
    if (photo && (step === "adjust" || step === "output")) {
      void draw();
    }
  }, [draw, photo, step]);

  async function onFile(file?: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      await ensureFonts();
      const img = await readPhoto(file);
      setZoom(1);
      setOffX(0);
      setOffY(0);
      setPhoto(img);
      if (step === "landing") {
        setStep("adjust");
      }
    } catch {
      toast.error("Couldn't read that photo. Try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  // --- Pointer & Touch Gesture Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!photo) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, offX, offY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) / (rect.width || 1);
    const dy = (e.clientY - dragStart.current.y) / (rect.height || 1);
    setOffX(Math.max(-0.6, Math.min(0.6, dragStart.current.offX + dx)));
    setOffY(Math.max(-0.6, Math.min(0.6, dragStart.current.offY + dy)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!photo) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) =>
      Math.max(0.8, Math.min(3.0, Number((z + delta).toFixed(2)))),
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]!;
      const t2 = e.touches[1]!;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchDistStart.current = dist;
      zoomStart.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistStart.current !== null) {
      const t1 = e.touches[0]!;
      const t2 = e.touches[1]!;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / touchDistStart.current;
      const newZoom = Math.max(0.8, Math.min(3.0, zoomStart.current * ratio));
      setZoom(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    touchDistStart.current = null;
  };

  const filename =
    mode === "pfp" ? "hh-goa-2026-pfp.png" : "hh-goa-2026-builder-id.png";
  const caption =
    mode === "pfp"
      ? `Framed up for HACKER HOUSE GOA 2026 🥷🥥 ${EVENT.dates} · ${EVENT.place}\n${EVENT.hashtag}`
      : `My builder pass for HACKER HOUSE GOA 2026 — ${title.toLowerCase()} reporting for duty 🥥\n${EVENT.dates} · ${EVENT.place}\n${EVENT.hashtag}`;

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

  return (
    <div className="brand-grain min-h-screen font-mono text-foreground">
      <Toaster />

      {/* Header Bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <button
          type="button"
          onClick={() => setStep("landing")}
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <img
            src={ASSETS.studio}
            alt="2:47 PM Studio"
            className="h-9 w-auto"
          />
        </button>
        <a
          href={`https://x.com/search?q=${encodeURIComponent(EVENT.hashtag)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-widest text-primary/80 underline-offset-4 hover:underline sm:text-sm"
        >
          CHECK HYPE
        </a>
      </header>

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {/* ================= STEP 1: LANDING ================= */}
      {step === "landing" && (
        <section className="mx-auto max-w-4xl px-5 pt-10 pb-20 text-center sm:pt-16">
          <img
            src={ASSETS.logo}
            alt="Hacker House Goa"
            className="mx-auto w-full max-w-48 sm:max-w-60"
          />
          <p className="mt-4 text-xs tracking-[0.35em] text-primary sm:text-sm">
            {EVENT.place} · {EVENT.dates} · {EVENT.studio}
          </p>

          <h1 className="display mt-8 text-4xl text-primary sm:text-6xl">
            FRAME YOURSELF IN GOA
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Create your custom profile frame or official builder ID badge for
            Hacker House Goa 2026 in seconds.
          </p>

          {/* Mode Selector Cards */}
          <div className="mx-auto mt-10 grid max-w-2xl gap-5 sm:grid-cols-2">
            <div
              onClick={() => setMode("pfp")}
              className={`cursor-pointer rounded-lg border-2 p-6 text-left transition-all ${
                mode === "pfp"
                  ? "border-primary bg-card/90 shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="display text-xl text-primary">PFP FRAME</span>
                <div
                  className={`h-4 w-4 rounded-full border ${
                    mode === "pfp"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Circular avatar overlay with curved event typography for X &
                Discord profiles.
              </p>
            </div>

            <div
              onClick={() => setMode("card")}
              className={`cursor-pointer rounded-lg border-2 p-6 text-left transition-all ${
                mode === "card"
                  ? "border-primary bg-card/90 shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="display text-xl text-primary">BUILDER ID</span>
                <div
                  className={`h-4 w-4 rounded-full border ${
                    mode === "card"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Full builder pass banner featuring your name, stack, handle, and
                generated hacker title.
              </p>
            </div>
          </div>

          {/* Primary CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                if (photo) {
                  setStep("adjust");
                } else {
                  fileRef.current?.click();
                }
              }}
              className="cursor-pointer rounded-md border border-primary bg-primary px-8 py-4 text-xs tracking-[0.25em] text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {photo ? "CONTINUE WITH PHOTO →" : "UPLOAD PHOTO TO START →"}
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 2: ADJUST & DETAILS ================= */}
      {step === "adjust" && (
        <main className="mx-auto max-w-6xl px-5 pt-8 pb-20">
          <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
            <button
              type="button"
              onClick={() => setStep("landing")}
              className="cursor-pointer text-xs tracking-widest text-muted-foreground hover:text-primary"
            >
              ← BACK TO HOME
            </button>
            <span className="text-xs tracking-[0.2em] text-primary">
              STEP 1 OF 2 · CUSTOMIZE GRAPHIC
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Left Controls Column */}
            <div className="space-y-6">
              <div className="tape-trim rounded-lg p-[3px]">
                <div className="rounded-md bg-card p-4 sm:p-6">
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["pfp", "PFP FRAME"],
                        ["card", "BUILDER ID"],
                      ] as [Mode, string][]
                    ).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`cursor-pointer rounded-sm border px-3 py-2.5 text-[11px] tracking-[0.2em] transition-colors sm:text-xs ${
                          mode === m
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-primary hover:bg-secondary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Upload photo trigger */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void onFile(e.dataTransfer.files?.[0]);
                    }}
                    className="w-full cursor-pointer rounded-md border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-secondary"
                  >
                    <span className="display block text-xl text-primary">
                      {photo ? "CHANGE PHOTO" : "UPLOAD YOUR PHOTO"}
                    </span>
                    <span className="mt-1 block text-[11px] tracking-widest text-muted-foreground">
                      JPG · PNG · HEIC · WEBP
                    </span>
                  </button>

                  {/* Drag & Pinch Instructions */}
                  {photo && (
                    <p className="mt-3 text-center text-[11px] tracking-wider text-accent">
                      💡 TIP: DRAG PHOTO TO MOVE & WHEEL/PINCH TO ZOOM
                    </p>
                  )}

                  {/* Adjustment Sliders */}
                  {photo && (
                    <div className="mt-5 space-y-4 rounded-md bg-background/50 p-4 border border-border/40">
                      <label className="block text-[11px] tracking-[0.2em] text-muted-foreground">
                        ZOOM ({zoom.toFixed(2)}x)
                        <input
                          type="range"
                          min={0.8}
                          max={3.0}
                          step={0.02}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="mt-2 w-full accent-[var(--color-accent)]"
                        />
                      </label>
                      <label className="block text-[11px] tracking-[0.2em] text-muted-foreground">
                        HORIZONTAL POSITION
                        <input
                          type="range"
                          min={-0.6}
                          max={0.6}
                          step={0.01}
                          value={offX}
                          onChange={(e) => setOffX(Number(e.target.value))}
                          className="mt-2 w-full accent-[var(--color-accent)]"
                        />
                      </label>
                      <label className="block text-[11px] tracking-[0.2em] text-muted-foreground">
                        VERTICAL POSITION
                        <input
                          type="range"
                          min={-0.6}
                          max={0.6}
                          step={0.01}
                          value={offY}
                          onChange={(e) => setOffY(Number(e.target.value))}
                          className="mt-2 w-full accent-[var(--color-accent)]"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setOffX(0);
                          setOffY(0);
                        }}
                        className="cursor-pointer text-[10px] tracking-widest text-muted-foreground underline hover:text-primary"
                      >
                        RESET POSITION & ZOOM
                      </button>
                    </div>
                  )}

                  {/* Builder Pass Info Fields */}
                  {mode === "card" && (
                    <div className="mt-5 grid gap-3">
                      <Field
                        label="NAME"
                        value={name}
                        onChange={setName}
                        placeholder="Aarav Mehta"
                      />
                      <Field
                        label="STACK / ROLE"
                        value={role}
                        onChange={setRole}
                        placeholder="Full-stack · TS + Rust"
                      />
                      <Field
                        label="X HANDLE (OPTIONAL)"
                        value={handle}
                        onChange={setHandle}
                        placeholder="@builder"
                      />
                      <p className="text-[11px] tracking-widest text-muted-foreground">
                        BUILDER TITLE:{" "}
                        <span className="text-accent">{title}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!photo}
                onClick={() => setStep("output")}
                className="w-full cursor-pointer rounded-sm border border-primary bg-primary px-4 py-4 text-xs tracking-[0.25em] text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                GENERATE GRAPHIC →
              </button>
            </div>

            {/* Right Interactive Canvas Column */}
            <div className="space-y-4">
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative rounded-lg border border-border bg-card p-3 sm:p-5 touch-none select-none"
              >
                {photo ? (
                  <canvas
                    ref={canvasRef}
                    className="h-auto w-full rounded-sm cursor-grab active:cursor-grabbing"
                    aria-label="Generated Hacker House Goa 2026 graphic"
                  />
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-border p-6 text-center text-xs tracking-[0.25em] text-muted-foreground transition-colors hover:bg-secondary/40"
                  >
                    {busy ? (
                      "COOKING…"
                    ) : (
                      <>
                        <span className="display text-2xl text-primary mb-2">
                          CLICK TO UPLOAD
                        </span>
                        <span>YOUR GRAPHIC PREVIEW APPEARS HERE</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= STEP 3: OUTPUT & SHARE ================= */}
      {step === "output" && (
        <main className="mx-auto max-w-4xl px-5 pt-8 pb-20 text-center">
          <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
            <button
              type="button"
              onClick={() => setStep("adjust")}
              className="cursor-pointer text-xs tracking-widest text-muted-foreground hover:text-primary"
            >
              ← EDIT DETAILS
            </button>
            <span className="text-xs tracking-[0.2em] text-primary">
              STEP 2 OF 2 · YOUR GRAPHIC IS READY
            </span>
          </div>

          <h2 className="display text-3xl text-primary sm:text-5xl">
            YOUR HACKER HOUSE GRAPHIC
          </h2>
          <p className="mt-2 text-xs tracking-widest text-muted-foreground">
            READY TO DOWNLOAD & POST ON X
          </p>

          {/* Rendered Preview Showcase */}
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-border/60 bg-card p-4 shadow-2xl shadow-primary/10">
            <canvas
              ref={canvasRef}
              className="h-auto w-full rounded-md shadow-md"
              aria-label="Final rendered Hacker House graphic"
            />
          </div>

          {/* Action Buttons */}
          <div className="mx-auto mt-8 grid max-w-md gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="cursor-pointer rounded-sm border border-primary bg-primary px-6 py-4 text-xs tracking-[0.25em] text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              DOWNLOAD PNG
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="cursor-pointer rounded-sm border border-accent bg-accent px-6 py-4 text-xs tracking-[0.25em] text-accent-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              SHARE TO X
            </button>
          </div>

          {/* Caption & Hashtag Preview */}
          <div className="mx-auto mt-6 max-w-md rounded-md bg-background/60 p-4 border border-border/40 text-left">
            <span className="text-[10px] tracking-widest text-accent font-semibold block mb-1">
              PRE-FILLED CAPTION (COPIED TO CLIPBOARD):
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {caption}
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setStep("landing");
              }}
              className="cursor-pointer text-xs tracking-widest text-muted-foreground underline hover:text-primary"
            >
              CREATE ANOTHER GRAPHIC
            </button>
          </div>
        </main>
      )}

      <footer className="border-t border-border py-6 text-center text-[11px] tracking-[0.3em] text-primary/70">
        HACKER HOUSE GOA · {EVENT.dates} · {EVENT.studio}
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-[11px] tracking-[0.2em] text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-sm border border-input bg-background px-3 py-3 text-sm tracking-normal text-primary placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
      />
    </label>
  );
}
