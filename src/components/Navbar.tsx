import { Link, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { DistritoLogo } from "@/components/DistritoLogo";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const navLinks = [
  { to: "/treino", label: "Treino" },
  { to: "/dieta", label: "Dieta" },
  { to: "/agenda", label: "Agenda" },
  { to: "/checklist", label: "Checklist" },
  { to: "/comunidade", label: "Comunidade" },
  { to: "/perfil", label: "Perfil" },
];

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b border-primary/15 bg-background/80 backdrop-blur-xl">
      <Link to="/dashboard" className="flex items-center gap-3 font-display text-2xl text-primary tracking-widest hover:opacity-80 transition-opacity">
        <DistritoLogo size={24} className="text-primary" />
        <span>DISTRITO 1%</span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            activeClassName="text-primary"
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="text-muted-foreground hover:text-primary transition-colors"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Navbar;
