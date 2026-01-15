import React, { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

export function AnimatedNumber({ value, format, duration = 0.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => {
    if (format) return format(latest);
    return Math.round(latest).toString();
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [inView, motionValue, value, duration]);

  return <motion.span ref={ref}>{text}</motion.span>;
}
