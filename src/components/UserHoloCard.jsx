import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Bot, Diamond, User } from "lucide-react";

export function UserHoloCard({
  user,
  nfDecimal,
  userRankInfo,
  elevated = false,
  showBotAverage = false,
  userRunningAvgKm,
  minSpinnerMs = 0,
  showBackOnly = false,
}) {
  const displayName = user?.name || "Utilisateur";
  const userShoeName = user?.shoe_name || "";
  const userShoeStart = user?.shoe_start_date || "";
  const userShoeTarget = user?.shoe_target_km;
  const userCardImage = user?.card_image || "";
  const userDescription = user?.description || "";
  const botAvgDistance = user?.avg_distance_m;
  const isBot = Boolean(user?.is_bot);
  const botColor = user?.bot_color || "";
  const botBorderColor = user?.bot_border_color || (isBot ? "#992929" : "");
  const showShoeDetails = Boolean(userShoeName);
  const showShoeTarget = !isBot && Number.isFinite(Number(userShoeTarget));
  const showDescription = Boolean(userDescription);
  const showBotAverageValue = showBotAverage && isBot && Number.isFinite(Number(botAvgDistance));
  const showUserAverageValue = !isBot && Number.isFinite(Number(userRunningAvgKm));
  const showAverage = showBotAverageValue || showUserAverageValue;
  const averageLabel = "Moyenne";
  const averageValue = showBotAverageValue ? Number(botAvgDistance) : Number(userRunningAvgKm);

  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0, active: false });
  const [cardImageReady, setCardImageReady] = useState(false);
  const [showCardSpinner, setShowCardSpinner] = useState(minSpinnerMs > 0);
  const isCardLoading = showCardSpinner;

  const cardRef = useRef(null);
  const holoRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const loadedImagesRef = useRef(new Set());
  const spinnerStartRef = useRef(0);
  const spinnerTimerRef = useRef(null);

  const MAX_TILT = 18;
  const PERSPECTIVE = 700;

  const toRgba = (hex, alpha) => {
    if (!hex) return "";
    const clean = hex.replace("#", "").trim();
    if (![3, 6].includes(clean.length)) return "";
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const num = Number.parseInt(full, 16);
    if (Number.isNaN(num)) return "";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const botGradient =
    isBot && botColor
      ? `linear-gradient(135deg, ${toRgba(botColor, 0.35)}, ${toRgba(botColor, 0.7)}, ${toRgba(botColor, 0.95)})`
      : "";
  const botBorderGradient =
    isBot && botBorderColor ? `linear-gradient(135deg, ${botBorderColor}, #000000)` : "";

  useEffect(() => {
    if (showBackOnly) {
      setCardImageReady(true);
      setShowCardSpinner(false);
      return;
    }
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current);
      spinnerTimerRef.current = null;
    }
    spinnerStartRef.current = Date.now();

    if (minSpinnerMs > 0) {
      setShowCardSpinner(true);
    }

    if (!userCardImage) {
      setCardImageReady(true);
      if (minSpinnerMs > 0) {
        spinnerTimerRef.current = setTimeout(() => setShowCardSpinner(false), minSpinnerMs);
      } else {
        setShowCardSpinner(false);
      }
      return;
    }

    if (loadedImagesRef.current.has(userCardImage)) {
      setCardImageReady(true);
      if (minSpinnerMs > 0) {
        spinnerTimerRef.current = setTimeout(() => setShowCardSpinner(false), minSpinnerMs);
      } else {
        setShowCardSpinner(false);
      }
      return;
    }

    setCardImageReady(false);
    const img = new Image();
    const handleDone = () => setCardImageReady(true);
    img.onload = handleDone;
    img.onerror = handleDone;
    img.src = userCardImage;
    if (img.complete) {
      setCardImageReady(true);
    }
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [userCardImage, minSpinnerMs, showBackOnly]);

  useEffect(() => {
    if (!cardImageReady) return;
    if (userCardImage) loadedImagesRef.current.add(userCardImage);
    if (minSpinnerMs <= 0) {
      setShowCardSpinner(false);
      return;
    }
    const elapsed = Date.now() - spinnerStartRef.current;
    const remaining = Math.max(minSpinnerMs - elapsed, 0);
    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    spinnerTimerRef.current = setTimeout(() => setShowCardSpinner(false), remaining);
    return () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }
    };
  }, [cardImageReady, userCardImage, minSpinnerMs, showBackOnly]);

  const handleTiltMove = (evt) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (!isPointerDownRef.current) return;
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    const percentX = (x / rect.width) * 2 - 1;
    const percentY = (y / rect.height) * 2 - 1;
    const rawX = -percentY * MAX_TILT;
    const rawY = percentX * MAX_TILT;
    const clampedX = Math.max(-MAX_TILT, Math.min(MAX_TILT, rawX));
    const clampedY = Math.max(-MAX_TILT, Math.min(MAX_TILT, rawY));

    setCardTilt({ x: clampedX, y: clampedY, active: true });

    const withinXBounds = Math.abs(rawY) <= MAX_TILT;
    const withinYBounds = Math.abs(rawX) <= MAX_TILT;
    if (holoRef.current) {
      const pX = (x / rect.width) * 100;
      const pY = (y / rect.height) * 100;
      const holoX = 50 + (pX - 50) / 1.5;
      const holoY = 50 + (pY - 50) / 1.5;
      const sparkX = 50 + (pX - 50) / 7;
      const sparkY = 50 + (pY - 50) / 7;
      const intensity = Math.min(1, Math.max(0.9, 0.9 + (Math.abs(50 - pX) + Math.abs(50 - pY)) / 200));
      if (withinXBounds) {
        holoRef.current.style.setProperty("--holo-x", `${holoX}%`);
        holoRef.current.style.setProperty("--spark-x", `${sparkX}%`);
      }
      if (withinYBounds) {
        holoRef.current.style.setProperty("--holo-y", `${holoY}%`);
        holoRef.current.style.setProperty("--spark-y", `${sparkY}%`);
      }
      holoRef.current.style.setProperty("--spark-opacity", `${intensity}`);
    }
  };

  const resetTilt = () => {
    setCardTilt({ x: 0, y: 0, active: false });
    if (holoRef.current) {
      holoRef.current.style.setProperty("--holo-x", "50%");
      holoRef.current.style.setProperty("--holo-y", "50%");
      holoRef.current.style.setProperty("--spark-x", "50%");
      holoRef.current.style.setProperty("--spark-y", "50%");
      holoRef.current.style.setProperty("--spark-opacity", "0.6");
    }
  };

  const showShadow = elevated || cardTilt.active;
  const showContent = !isCardLoading && !showBackOnly;
  const hideBrandMarks = isCardLoading || showBackOnly;

  return (
    <div
      className={`relative w-full max-w-[360px] ${cardTilt.active ? "z-30" : "z-0"}`}
      style={{ transformStyle: "preserve-3d", perspective: `${PERSPECTIVE}px` }}
    >
      <div
        ref={cardRef}
        onPointerDown={(evt) => {
          isPointerDownRef.current = true;
          evt.currentTarget.setPointerCapture?.(evt.pointerId);
          handleTiltMove(evt);
        }}
        onPointerMove={handleTiltMove}
        onPointerUp={(evt) => {
          isPointerDownRef.current = false;
          evt.currentTarget.releasePointerCapture?.(evt.pointerId);
          resetTilt();
        }}
        onPointerLeave={() => {
          if (!isPointerDownRef.current) resetTilt();
        }}
        onPointerCancel={() => {
          isPointerDownRef.current = false;
          resetTilt();
        }}
        className={`relative select-none rounded-[28px] bg-gradient-to-br from-emerald-300 via-lime-300 to-sky-400 p-2 ${
          showShadow ? "shadow-[0_28px_110px_rgba(0,0,0,0.75)] dark:shadow-[0_28px_110px_rgba(255,255,255,0.55)]" : ""
        }`}
        style={{
          backgroundImage: botBorderGradient || undefined,
          transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) translateZ(${cardTilt.active ? 18 : 0}px) scale(${cardTilt.active ? 1.03 : 1})`,
          transformStyle: "preserve-3d",
          transition: cardTilt.active ? "transform 50ms linear" : "transform 220ms ease",
          willChange: "transform",
        }}
      >
        <img
          src="/na-logo.png"
          alt="NaTrack"
          className={`pointer-events-none absolute right-3 top-[53%] z-20 h-14 w-auto -translate-y-1/2 grayscale-[0.15] drop-shadow-[0_10px_26px_rgba(16,185,129,0.65)] ${
            hideBrandMarks ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src="/nacards-logo.png"
          alt="NaCards"
          className={`pointer-events-none absolute -left-3 top-3 z-20 h-14 w-auto drop-shadow-[0_6px_16px_rgba(16,185,129,0.5)] ${
            hideBrandMarks ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          ref={holoRef}
          className="user-card-holo relative overflow-hidden rounded-[26px] bg-slate-950/95 p-3 text-white"
          style={{
            backgroundImage: botGradient || undefined,
            backgroundColor: isBot && botColor ? toRgba(botColor, 0.5) : undefined,
          }}
        >
          <div className={`transition-opacity duration-300 ${showContent ? "opacity-100" : "opacity-0"}`}>
            <div className="mt-2 flex items-center justify-end gap-2 text-right text-2xl font-black tracking-tight">
            {isBot ? (
              <Bot size={18} className="text-emerald-200" />
            ) : (
              <User size={18} className="text-emerald-200" />
            )}
            <span>{displayName}</span>
            </div>
            <div
            className="relative mt-3 aspect-[6/4] w-full overflow-hidden rounded-[22px] border border-emerald-200/40 bg-gradient-to-br from-slate-900 via-emerald-900/40 to-slate-900"
            style={
              userCardImage
                ? {
                    backgroundImage: `url(${userCardImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {userCardImage && (
              <img
                src={userCardImage}
                alt=""
                className="hidden"
                onLoad={() => setCardImageReady(true)}
                onError={() => setCardImageReady(true)}
              />
            )}
            {!userCardImage && (
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src="/big-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-auto opacity-70 drop-shadow-[0_8px_18px_rgba(16,185,129,0.5)]"
                />
              </div>
            )}
            </div>
            <div className="mt-3 min-h-[10rem] rounded-2xl border border-emerald-200/30 bg-emerald-950/50 px-3 py-2 text-sm flex flex-col">
            {showShoeDetails && (
              <div>
                <span className="text-xs uppercase tracking-wide text-emerald-200">Chaussures</span>
                <span className="ml-2 font-semibold">{userShoeName}</span>
              </div>
            )}
            {showAverage && (
              <div className={showShoeDetails ? "mt-2" : ""}>
                <span className="text-xs uppercase tracking-wide text-emerald-200">{averageLabel}</span>
                <span className="ml-2 text-[14px] font-semibold text-white">
                  {nfDecimal.format(averageValue)} km
                  {showUserAverageValue && (
                    <span className="ml-1 italic text-white font-normal text-[13px]">(3 derniers mois)</span>
                  )}
                  {showBotAverageValue && (
                    <span className="ml-1 italic text-white font-normal text-[13px]">(total)</span>
                  )}
                </span>
              </div>
            )}
            {showDescription && (
              <div className="mt-auto text-xs text-emerald-100/80 self-end text-right italic">
                {userDescription}
              </div>
            )}
            </div>
            <div className="mt-3 flex items-center rounded-2xl border border-emerald-200/20 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
            <div className="flex items-center gap-2 text-[10px]">
              NaTrack™ {dayjs().format("YYYY")}
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] opacity-70">
              {isBot ? (
                <Diamond size={10} className="text-emerald-200" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">★</span>
              )}
              {userRankInfo ? `${userRankInfo.index}/${userRankInfo.total}` : "—"}
            </span>
            </div>
          </div>
          {isCardLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-4 rounded-[22px] border border-emerald-200/30" aria-hidden="true" />
              <div className="relative flex flex-col items-center gap-4">
                <img
                  src="/nacards-logo.png"
                  alt="NaCards"
                  className="h-20 w-auto opacity-90 drop-shadow-[0_8px_18px_rgba(16,185,129,0.5)]"
                />
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200/70 border-t-transparent" />
              </div>
            </div>
          )}
          {showBackOnly && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-4 rounded-[22px] border border-emerald-200/30" aria-hidden="true" />
              <img
                src="/nacards-logo.png"
                alt="NaCards"
                className="h-20 w-auto opacity-90 drop-shadow-[0_8px_18px_rgba(16,185,129,0.5)]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
