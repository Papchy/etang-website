import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion"; // Ajout de Variants ici
import { supabase } from "../lib/supabase";
import { LogIn, LogOut, CheckCircle2, CreditCard, CalendarDays, Send, UserCheck } from "lucide-react";

// Ajout de ": Variants" sur ces deux constantes
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export default function CheckIn() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Champs du formulaire
  const [presence, setPresence] = useState("Tout le week-end");
  const [montant, setMontant] = useState("10");
  const [methode, setMethode] = useState("Lydia");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/checkin'
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSubmitting(true);

    try {
      const email = session.user.email;
      const fullName = session.user.user_metadata?.full_name || "Invité";
      const avatarUrl = session.user.user_metadata?.avatar_url || "";
      
      // Séparation simple du prénom et du nom
      const nameParts = fullName.split(' ');
      const prenom = nameParts[0];
      const nom = nameParts.slice(1).join(' ');

      // 1. Mettre à jour le profil du participant
      await supabase.from('participants').upsert({
        email: email,
        prenom: prenom,
        nom: nom,
        jours_presence: presence,
        avatar_url: avatarUrl
      });

      // 2. Enregistrer le paiement (si la personne vient)
      if (presence !== "Je ne viens pas" && montant !== "0") {
        await supabase.from('paiements').insert({
          email: email,
          montant: parseFloat(montant),
          methode: methode,
          statut: 'En attente'
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-500">Chargement...</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-5 md:px-8 flex flex-col gap-6 md:gap-8 pb-8"
    >
      <motion.div variants={itemVariants} className="text-center mt-4">
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Check-in</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Confirme ta présence et gère ta participation.</p>
      </motion.div>

      {!session ? (
        // ÉCRAN NON CONNECTÉ
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center mt-8">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6">
            <UserCheck size={32} className="text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Identification requise</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-8 max-w-xs">Connecte-toi avec ton compte Google pour confirmer ta présence et voir les covoiturages.</p>
          
          <button 
            onClick={handleLogin}
            className="flex items-center gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 px-6 py-3 rounded-full font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continuer avec Google
          </button>
        </motion.div>
      ) : (
        // ÉCRAN CONNECTÉ
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex items-center justify-between bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/50 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <img 
                src={session.user.user_metadata?.avatar_url} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 object-cover"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100 leading-tight">
                  {session.user.user_metadata?.full_name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{session.user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
              <LogOut size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col gap-6">
            
            {/* Section Présence */}
            <div className="flex flex-col gap-3">
              <label className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-500" />
                Quand seras-tu là ?
              </label>
              <select 
                value={presence}
                onChange={(e) => setPresence(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="Tout le week-end">Tout le week-end (Samedi au Lundi)</option>
                <option value="Samedi et Dimanche">Samedi et Dimanche</option>
                <option value="Juste Samedi soir">Juste Samedi soir</option>
                <option value="Je ne viens pas">Je ne viens pas</option>
              </select>
            </div>

            {/* Section Paiement (cachée si la personne ne vient pas) */}
            {presence !== "Je ne viens pas" && (
              <div className="flex flex-col gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-500" />
                  Participation financière
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-stone-500 font-medium">Montant (€)</span>
                    <input 
                      type="number" 
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-stone-500 font-medium">Moyen</span>
                    <select 
                      value={methode}
                      onChange={(e) => setMethode(e.target.value)}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    >
                      <option value="Lydia">Lydia</option>
                      <option value="Paylib">Paylib</option>
                      <option value="Espèces">Espèces</option>
                      <option value="Virement">Virement</option>
                    </select>
                  </div>
                </div>
                
                {methode === "Virement" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    Je t'envoie mon RIB en privé sur le groupe pour sécuriser la transaction.
                  </p>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className={`mt-4 w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all ${success ? 'bg-emerald-500' : 'bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 dark:hover:bg-stone-600 active:scale-[0.98]'} ${submitting ? 'opacity-70' : ''}`}
            >
              {success ? (
                <>
                  <CheckCircle2 size={20} /> C'est noté !
                </>
              ) : (
                <>
                  <Send size={18} /> Valider ma participation
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}