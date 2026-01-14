"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const { className, variant = "primary", ...rest } = props;

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm",
        variant === "primary"
          ? "bg-zinc-900 text-white hover:bg-zinc-800"
          : "bg-transparent text-zinc-900 hover:bg-zinc-100",
        "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
        className
      )}
      {...rest}
    />
  );
}
