import { NavLink } from "react-router-dom";
import { MessageSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: MessageSquare, label: "Chat" },
  { to: "/evaluate", icon: BarChart2, label: "Evaluate" },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-cream-100 bg-cream-50/95 py-2 backdrop-blur dark:border-teal-900 dark:bg-teal-950/95 md:hidden">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} aria-label={label}>
            {({ isActive }) => (
              <div
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  isActive ? "text-teal-600" : "text-gray-500"
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
                {isActive && <span className="h-1 w-1 rounded-full bg-teal-600" />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }
  return (
    <nav className="hidden flex-col gap-1 border-t border-cream-100 pt-3 dark:border-teal-800 md:flex">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
              isActive ? "bg-teal-600 text-cream-50" : "text-gray-600 hover:bg-teal-50 dark:text-cream-200 dark:hover:bg-teal-900/50"
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
