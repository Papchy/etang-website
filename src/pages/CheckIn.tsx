import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "../lib/supabase";
import { LogOut, CheckCircle2, CreditCard, CalendarDays, Send, Edit3, X, Receipt, Lock, Mail, Key, User, Shield } from "lucide-react";
import { Link } from "react-router-dom";

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

  // États pour le cycle de vie de l'inscription
  const [hasRegistered, setHasRegistered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Bien placé à l'intérieur du composant

  // Champs du formulaire de Check-in
  const [presence, setPresence] = useState("Tout le week-end");
  const [montant, setMontant] = useState("10");
  const [methode, setMethode] = useState("Lydia");

  // États pour l'authentification par email
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 1er useEffect : Gérer la session utilisateur (Connexion/Déconnexion)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2ème useEffect : Gestion de la synchronisation immédiate du profil à la connexion
  useEffect(() => {
    if (!session) return;

    const fetchAndPrepareUserData = async () => {
      const email = session.user.email;
      const baseName = session.user.user_metadata?.full_name || email.split('@')[0];
      
      let prenom = baseName;
      let nom = "";
      if (baseName.includes(' ')) {
        const nameParts = baseName.split(' ');
        prenom = nameParts[0];
        nom = nameParts.slice(1).join(' ');
      }

      // 1. On cherche si la ligne existe dans participants
      let { data: participantData } = await supabase
        .from('participants')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      // S'il n'existe pas du tout, on crée immédiatement sa ligne "fantôme" (sans présence)
      if (!participantData) {
        const avatarUrl = session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(prenom)}&backgroundColor=e7e5e4&textColor=1c1917`;
        
        const { data: insertedData } = await supabase
          .from('participants')
          .insert({
            email: email,
            prenom: prenom,
            nom: nom,
            jours_presence: null, // Reste null tant qu'il n'a pas validé le formulaire
            avatar_url: avatarUrl
          })
          .select()
          .single();
        
        participantData = insertedData;
      }

      // Analyse des données du participant
      if (participantData) {
        // Gérer l'affichage de la présence
        if (participantData.jours_presence) {
          setPresence(participantData.jours_presence);
          setHasRegistered(true);
        } else {
          setHasRegistered(false);
        }
        
        // Gérer le statut administrateur
        setIsAdmin(participantData.is_admin || false);
      }

      // 2. On récupère le paiement associé s'il existe
      const { data: paiementData } = await supabase
        .from('paiements')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (paiementData) {
        setMontant(paiementData.montant.toString());
        setMethode(paiementData.methode);
      }

      setDataFetched(true);
      setLoading(false);
    };

    fetchAndPrepareUserData();
  }, [session]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/checkin' }
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (isSignUp) {
        const generatedAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authName)}&backgroundColor=e7e5e4&textColor=1c1917`;
        
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName,
              avatar_url: generatedAvatarUrl
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        setAuthError("Email ou mot de passe incorrect.");
      } else if (error.message.includes("User already registered")) {
        setAuthError("Un compte existe déjà avec cet email.");
      } else if (error.message.includes("Password should be at least")) {
        setAuthError("Le mot de passe doit faire au moins 6 caractères.");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHasRegistered(false);
    setIsEditing(false);
    setIsAdmin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSubmitting(true);

    try {
      const email = session.user.email;

      // 1. Mise à jour de la présence dans la table participants (la ligne existe déjà forcément)
      await supabase
        .from('participants')
        .update({ jours_presence: presence })
        .eq('email', email);

      // 2. Gestion unique de la table paiements via UPSERT
      if (presence === "Je ne viens pas" || montant === "0" || montant === "") {
        // Si l'utilisateur choisit finalement de ne pas venir, on nettoie son paiement
        await supabase.from('paiements').delete().eq('email', email);
      } else {
        // Grâce à la contrainte d'unicité, l'upsert va écraser la ligne existante sans créer de doublon
        await supabase.from('paiements').upsert({
          email: email,
          montant: parseFloat(montant),
          methode: methode,
          statut: 'En attente'
        }, { onConflict: 'email' });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setHasRegistered(true);
        setIsEditing(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (session && !dataFetched)) {
    return <div className="p-8 text-center text-stone-500 flex justify-center items-center h-[50vh] animate-pulse">Vérification de ton profil...</div>;
  }

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
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center mt-4">
          <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
            <Lock size={24} className="text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Identification requise</h2>
          
          <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3 max-w-xs">
            {isSignUp && (
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Ton prénom / pseudo"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required={isSignUp}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                />
              </div>
            )}
            
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="email" 
                placeholder="Ton adresse email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
              />
            </div>
            
            <div className="relative">
              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="password" 
                placeholder="Mot de passe (min. 6 car.)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
              />
            </div>

            {authError && <p className="text-red-500 text-xs font-medium text-left px-1">{authError}</p>}

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className="mt-2 w-full bg-stone-800 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              {isAuthLoading ? "Chargement..." : (isSignUp ? "Créer mon compte" : "Se connecter")}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors mt-1"
            >
              {isSignUp ? "J'ai déjà un compte, me connecter" : "Pas de compte ? S'inscrire"}
            </button>
          </form>

          <div className="w-full flex items-center justify-center gap-4 my-6 opacity-50">
            <div className="h-px bg-stone-300 dark:bg-stone-700 flex-1"></div>
            <span className="text-xs font-bold text-stone-500">OU</span>
            <div className="h-px bg-stone-300 dark:bg-stone-700 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full max-w-xs gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 text-sm"
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
                src={session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}&backgroundColor=e7e5e4&textColor=1c1917`} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 object-cover"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100 leading-tight">
                  {session.user.user_metadata?.full_name || session.user.email.split('@')[0]}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{session.user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
              <LogOut size={20} />
            </button>
          </div>

          {/* Bouton Admin visible uniquement si is_admin est true */}
          {isAdmin && (
            <Link 
              to="/admin"
              className="flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition-all text-sm"
            >
              <Shield size={16} className="text-amber-500" /> Accéder au panneau d'administration
            </Link>
          )}

          {hasRegistered && !isEditing ? (
            // ÉCRAN DE RÉSUMÉ
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-500/20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 mb-2">Inscription validée</h2>
              <p className="text-stone-600 dark:text-stone-400 text-sm mb-6 max-w-sm">
                Tes informations sont bien enregistrées dans la base de données.
              </p>

              <div className="w-full flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700/50">
                  <div className="flex items-center gap-3 text-stone-800 dark:text-stone-200 font-bold">
                    <CalendarDays size={20} className="text-emerald-500" /> Présence
                  </div>
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400 text-right">{presence}</span>
                </div>

                {presence !== "Je ne viens pas" && montant !== "0" && montant !== "" && (
                  <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700/50">
                    <div className="flex items-center gap-3 text-stone-800 dark:text-stone-200 font-bold">
                      <Receipt size={20} className="text-amber-500" /> Participation
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-500">{montant} €</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wide">Via {methode}</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300 font-bold py-3.5 px-6 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all w-full md:w-auto"
              >
                <Edit3 size={18} /> Modifier mes infos
              </button>
            </div>
          ) : (
            // ÉCRAN FORMULAIRE
            <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col gap-6">
              
              {isEditing && (
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-stone-800 dark:text-stone-100">Modification</h3>
                  <button type="button" onClick={() => setIsEditing(false)} className="p-2 text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-full hover:text-stone-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

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
                  <><CheckCircle2 size={20} /> C'est noté !</>
                ) : (
                  <><Send size={18} /> {isEditing ? "Mettre à jour" : "Valider ma participation"}</>
                )}
              </button>
            </form>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}