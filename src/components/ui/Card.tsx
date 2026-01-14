import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm backdrop-blur",
        "dark:border-zinc-800/60 dark:bg-zinc-950/40",
        className
      )}
    >
      {children}
    </div>
  );
}
