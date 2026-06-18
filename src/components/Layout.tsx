import { Outlet, NavLink } from "react-router-dom";
import { Home, MessageSquare, UserCheck, Moon, Sun, Users, ShoppingBasket, Fish } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "./UIContext";

export default function Layout() {
  const { isOverlayOpen } = useUI();
  const { theme, setTheme } = useTheme();
  const [participantCount, setParticipantCount] = useState(0);

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    // Fonction pour compter les inscrits (ceux dont jours_presence n'est pas vide et pas "Non")
    const fetchCount = async () => {
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .not('jours_presence', 'eq', 'Je ne viens pas')
        .not('jours_presence', 'is', null);
      
      if (count !== null) setParticipantCount(count);
    };

    fetchCount();

    // S'abonner aux changements en temps réel si quelqu'un s'inscrit
    const subscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20 md:pb-28 font-sans selection:bg-amber-200 transition-colors duration-500">
      
      {/* En-tête flottant avec le Compteur et le Mode Nuit */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center max-w-4xl mx-auto pointer-events-none">
        
        {/* Compteur de participants */}
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium text-sm">
          <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
          <span>{participantCount} présent{participantCount > 1 ? 's' : ''}</span>
        </div>

        {/* Bouton Mode Nuit */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="pointer-events-auto p-2.5 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:scale-110 active:scale-95 transition-all"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-stone-600" />}
        </button>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto relative overflow-x-hidden pt-20">
        <Outlet />
      </main>

<nav className={`fixed bottom-0 md:bottom-6 left-0 right-0 z-50 transition-all duration-500 ${isOverlayOpen ? 'hidden' : 'flex'}`}>
  <div className="w-full md:max-w-2xl mx-4 md:mx-auto bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-t md:border border-stone-200/50 dark:border-stone-700/50 rounded-t-2xl md:rounded-full shadow-2xl">
    <div className="flex justify-around items-center h-16 md:h-16 px-2">
      
      {/* Infos */}
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <Home size={20} className="mb-0.5" /> <span>Infos</span>
      </NavLink>
      
      {/* Le Mur */}
      <NavLink to="/wall" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <MessageSquare size={20} className="mb-0.5" /> <span>Mur</span>
      </NavLink>

      {/* Invités (Trombinoscope) */}
      <NavLink to="/guests" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <Users size={20} className="mb-0.5" /> <span>Invités</span>
      </NavLink>

      {/* Pêche 
      <NavLink to="/peche" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <Fish size={20} className="mb-0.5" /> <span>Pêche</span>
      </NavLink>
      */}

      {/* Listes */}
      <NavLink to="/shopping" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <ShoppingBasket size={20} className="mb-0.5" /> <span>Listes</span>
      </NavLink>

      {/* Check-in */}
      <NavLink to="/checkin" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[9px] md:text-xs transition-all ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
        <UserCheck size={20} className="mb-0.5" /> <span>Profil</span>
      </NavLink>

    </div>
  </div>
</nav>
    </div>
  );
}