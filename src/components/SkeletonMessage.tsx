export function SkeletonMessage() {
  return (
    <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-4 shadow-md dark:bg-teal-950/80">
      <div className="animate-pulse space-y-2">
        <div className="h-3 w-full rounded bg-cream-100 dark:bg-teal-900" />
        <div className="h-3 w-[85%] rounded bg-cream-100 dark:bg-teal-900" />
        <div className="h-3 w-[60%] rounded bg-cream-100 dark:bg-teal-900" />
      </div>
    </div>
  );
}
