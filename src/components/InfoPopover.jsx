import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export function InfoPopover({
  open,
  onClose,
  title,
  items = [],
  align = "left",
  actionLabel = null,
  fullWidth = false,
  anchorRect,
  maxWidth = 520,
  headerImage,
}) {
  const ref = useRef(null);
  const [computedWidth, setComputedWidth] = useState(null);
  const [computedLeft, setComputedLeft] = useState(null);
  const [computedTop, setComputedTop] = useState(null);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth < 640;
    if (fullWidth) {
      const top = isMobile ? 12 : Math.round((anchorRect?.bottom || 64) + 8);
      setComputedWidth(null);
      setComputedLeft(null);
      setComputedTop(top);
    } else if (anchorRect?.width) {
      const width = Math.round(anchorRect.width);
      const padding = 0;
      const maxLeft = Math.max(padding, window.innerWidth - width - padding);
      const left = Math.min(Math.max(anchorRect.left, padding), maxLeft);
      setComputedWidth(width);
      setComputedLeft(left);
      setComputedTop(Math.round((anchorRect?.bottom || 64) + 8));
    } else {
      setComputedWidth(null);
      setComputedLeft(null);
      setComputedTop(Math.round((anchorRect?.bottom || 64) + 8));
    }
    const onDocClick = (evt) => {
      if (!ref.current) return;
      if (!ref.current.contains(evt.target)) onClose?.();
    };
    const onKey = (evt) => {
      if (evt.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {fullWidth ? (
            <div
              className="fixed z-[60]"
              style={{
                top: `${Math.round(computedTop ?? (anchorRect?.bottom || 64) + 8)}px`,
                left: "50%",
                width: `min(${maxWidth}px, calc(100% - 16px))`,
                transform: "translateX(-50%)",
              }}
            >
              <motion.div
                ref={ref}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="rounded-2xl border border-emerald-300/40 bg-white/95 shadow-lg backdrop-blur dark:border-emerald-400/20 dark:bg-slate-900/90 max-h-[80vh] overflow-y-auto"
              >
                <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-emerald-300/70 via-lime-300/60 to-sky-400/50" />
                <div className="p-6 text-sm text-slate-700 dark:text-slate-200">
                  {headerImage && (
                <div className="flex flex-col items-start gap-2">
                  <img src={headerImage} alt="" className="h-10 w-auto" />
                  <div className="text-[26px] font-semibold text-slate-900 dark:text-slate-100 mt-[50px]">
                    {title}
                  </div>
                </div>
              )}
              {!headerImage && (
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </div>
              )}
              {!!items.length && (
                <ul className="mt-2 space-y-3">
                  {items.map((item, idx) => (
                    <li
                      key={typeof item === "string" ? item : idx}
                      className={`leading-relaxed whitespace-pre-line [&_strong]:text-[18px] ${idx === 0 ? "" : "mt-[25px]"}`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-5 hidden"
                aria-hidden="true"
              >
                {actionLabel || ""}
              </button>
            </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed z-[60] mt-2 rounded-2xl border border-emerald-300/40 bg-white/95 shadow-lg backdrop-blur dark:border-emerald-400/20 dark:bg-slate-900/90 max-h-[80vh] overflow-y-auto"
              style={{
                top: `${Math.round(computedTop ?? (anchorRect?.bottom || 64) + 8)}px`,
                width: computedWidth ? `${computedWidth}px` : `min(92vw, ${maxWidth}px)`,
                left: computedLeft !== null ? `${computedLeft}px` : align === "right" ? undefined : "0px",
                right: computedLeft !== null ? undefined : align === "right" ? "0px" : undefined,
              }}
            >
              <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-emerald-300/70 via-lime-300/60 to-sky-400/50" />
              <div className="p-6 text-sm text-slate-700 dark:text-slate-200">
                {headerImage && (
                  <div className="mb-4 flex flex-col items-start gap-2">
                    <img src={headerImage} alt="" className="h-10 w-auto" />
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {title}
                    </div>
                  </div>
                )}
                {!headerImage && (
                  <div className="text-[26px] font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </div>
                )}
                {!!items.length && (
                  <ul className="mt-3 space-y-3">
                    {items.map((item, idx) => (
                      <li key={typeof item === "string" ? item : idx} className="leading-relaxed whitespace-pre-line">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 hidden"
                  aria-hidden="true"
                >
                  {actionLabel || ""}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
