import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Users, Tent, CalendarDays, GlassWater } from "lucide-react";

interface Participant {
  email: string;
  prenom: string;
  nom: string;
  jours_presence: string;
  avatar_url: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export default function Guests() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .not('jours_presence', 'is', null)
        .neq('jours_presence', 'Je ne viens pas')
        .order('prenom', { ascending: true });
        
      if (data) setParticipants(data);
      setLoading(false);
    };

    fetchGuests();
  }, []);

  const getPresenceIcon = (presence: string) => {
    if (presence === "Tout le week-end") return <Tent size={14} className="text-emerald-500" />;
    if (presence === "Juste Samedi soir") return <GlassWater size={14} className="text-amber-500" />;
    return <CalendarDays size={14} className="text-blue-500" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500 animate-pulse">Chargement des invités...</div>;
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-5 md:px-8 flex flex-col gap-6 md:gap-8 pb-8"
    >
      <motion.div variants={itemVariants} className="text-center mt-4">
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight flex items-center justify-center gap-3">
          <Users size={28} className="text-emerald-500" />
          La Guestlist
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">
          Déjà {participants.length} personnes prêtes pour le week-end.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {participants.map((p) => (
          <div key={p.email} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-stone-200/50 dark:border-stone-800 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-1">
            <div className="w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-stone-100 dark:border-stone-800 shadow-inner">
              <img 
                src={p.avatar_url} 
                alt={p.prenom} 
                className="w-full h-full object-cover bg-stone-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-stone-100 leading-tight">
              {p.prenom} {p.nom ? p.nom.charAt(0) + '.' : ''}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wide bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
              {getPresenceIcon(p.jours_presence)}
              <span className="truncate">{p.jours_presence === "Tout le week-end" ? "Week-end" : p.jours_presence === "Juste Samedi soir" ? "Samedi Soir" : "Sam & Dim"}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}