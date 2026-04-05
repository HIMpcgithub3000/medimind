import { Menu, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-cream-100 bg-cream-50 px-3 dark:border-teal-900 dark:bg-teal-950 md:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-cream-100"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <Logo size="sm" showTagline={false} />
      <div className="relative">
        <details className="group">
          <summary className="list-none cursor-pointer rounded-lg p-2 text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-cream-100">
            <MoreVertical className="h-5 w-5" aria-hidden />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-cream-100 bg-white py-1 shadow-lg dark:border-teal-800 dark:bg-teal-950">
            <Link to="/evaluate" className="block px-3 py-2 text-sm hover:bg-cream-50 dark:hover:bg-teal-900">
              Evaluate
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
