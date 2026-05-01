export function SnowflakeDivider() {
  return (
    <div className="flex items-center justify-center my-6 select-none" aria-hidden="true">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-frost-700/50 to-transparent" />
      <span className="mx-3 text-frost-600 opacity-40 text-sm">❄ • ❄</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-frost-700/50 to-transparent" />
    </div>
  );
}