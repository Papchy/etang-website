import { Outlet, NavLink } from "react-router-dom";
import { Home, MessageSquare, UserCheck, Moon, Sun, Users } from "lucide-react";
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

<nav className={`fixed bottom-0 md:bottom-6 left-0 right-0 w-full md:max-w-sm mx-auto bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-t md:border border-stone-200/50 dark:border-stone-700/50 z-50 md:rounded-full shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-2xl transition-all duration-500 ${isOverlayOpen ? 'hidden' : 'flex'}`}>
        <div className="flex justify-around items-center h-16 md:h-14 px-2">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] md:text-xs transition-all duration-300 ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold scale-110' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:scale-105'}`}>
            <Home size={22} className="mb-0.5" />
            <span>Infos</span>
          </NavLink>
          <NavLink to="/wall" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] md:text-xs transition-all duration-300 ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold scale-110' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:scale-105'}`}>
            <MessageSquare size={22} className="mb-0.5" />
            <span>Le Mur</span>
          </NavLink>
          <NavLink to="/checkin" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full text-[10px] md:text-xs transition-all duration-300 ${isActive ? 'text-amber-600 dark:text-amber-500 font-bold scale-110' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:scale-105'}`}>
            <UserCheck size={22} className="mb-0.5" />
            <span>Check-in</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}