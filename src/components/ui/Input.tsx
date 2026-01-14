import clsx from "clsx";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none",
        "focus:ring-2 focus:ring-zinc-900/10",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
        className
      )}
      {...rest}
    />
  );
}
