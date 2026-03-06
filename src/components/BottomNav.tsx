import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Dumbbell, CheckSquare, Swords, User } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/treino", label: "Treino", icon: Dumbbell },
  { to: "/checklist", label: "Check", icon: CheckSquare },
  { to: "/desafios", label: "Desafios", icon: Swords },
  { to: "/perfil", label: "Perfil", icon: User },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[hsl(0,0%,3.9%)] border-t border-primary/15">
      <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
