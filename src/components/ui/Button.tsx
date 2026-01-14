"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "ghost";
};

export function Button({ className, variant = "primary", ...rest }: Props) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        variant === "primary"
          ? "bg-white text-black hover:bg-white/90"
          : "bg-transparent text-white border border-white/15 hover:bg-white/5",
        className
      )}
      {...rest}
    />
  );
}
