import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "../lib/supabase";
import { ShoppingBasket, Sparkles, ThumbsUp, Trash2, Plus, Lock } from "lucide-react";

interface CourseItem {
  id_course: number;
  article: string;
  categorie: string;
  email_auteur: string;
  votes: string[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
};

export default function ShoppingList() {
  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorsMap, setAuthorsMap] = useState<Record<string, string>>({});
  
  const [newSerious, setNewSerious] = useState("");
  const [newFun, setNewFun] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const fetchData = async () => {
      const { data: coursesData } = await supabase.from('courses').select('*').order('date_ajout', { ascending: false });
      if (coursesData) setItems(coursesData);

      const { data: participantsData } = await supabase.from('participants').select('email, prenom, nom');
      if (participantsData) {
        const map: Record<string, string> = {};
        participantsData.forEach(p => {
          map[p.email.toLowerCase()] = `${p.prenom} ${p.nom ? p.nom.charAt(0) + '.' : ''}`;
        });
        setAuthorsMap(map);
      }
      setLoading(false);
    };

    fetchData();

    const coursesSub = supabase.channel('courses_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchData)
      .subscribe();

    return () => {
      coursesSub.unsubscribe();
    };
  }, []);

  const handleAddItem = async (e: React.FormEvent, categorie: string) => {
    e.preventDefault();
    if (!session) return;

    const article = categorie === 'Sérieux' ? newSerious : newFun;
    if (!article.trim()) return;

    await supabase.from('courses').insert({
      article: article.trim(),
      categorie: categorie,
      email_auteur: session.user.email,
      votes: [session.user.email] // L'auteur vote automatiquement pour son idée
    });

    if (categorie === 'Sérieux') setNewSerious("");
    else setNewFun("");
  };

  const handleDelete = async (id: number) => {
    await supabase.from('courses').delete().eq('id_course', id);
  };

  const handleToggleVote = async (item: CourseItem) => {
    if (!session) return;
    const userEmail = session.user.email;
    const hasVoted = item.votes?.includes(userEmail);
    
    let newVotes = item.votes || [];
    if (hasVoted) {
      newVotes = newVotes.filter(email => email !== userEmail);
    } else {
      newVotes = [...newVotes, userEmail];
    }

    setItems(prev => prev.map(p => p.id_course === item.id_course ? { ...p, votes: newVotes } : p));
    await supabase.from('courses').update({ votes: newVotes }).eq('id_course', item.id_course);
  };

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Chargement de la liste...</div>;

  const seriousItems = items.filter(i => i.categorie === 'Sérieux').sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
  const funItems = items.filter(i => i.categorie === 'Fun').sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-5 md:px-8 flex flex-col gap-6 md:gap-8 pb-8">
      <motion.div variants={itemVariants} className="text-center mt-4">
        <h1 className="text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Boîte à Idées</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">Ce qu'il ne faut absolument pas oublier d'acheter.</p>
      </motion.div>

      {!session && (
        <motion.div variants={itemVariants} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-400 text-sm">
          <Lock size={18} className="shrink-0" />
          <p>Tu dois être connecté via le Check-in pour ajouter des idées ou voter.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* COLONNE SÉRIEUSE */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-emerald-500/20 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400"><ShoppingBasket size={24} /></span>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Les Essentiels</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Nourriture, boissons, logistique. Financé par la cagnotte par exemple les 10€.</p>

            {session && (
              <form onSubmit={(e) => handleAddItem(e, 'Sérieux')} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newSerious} 
                  onChange={(e) => setNewSerious(e.target.value)} 
                  placeholder="Ex: Du charbon, du Ketchup..." 
                  className="flex-1 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  maxLength={50}
                />
                <button type="submit" disabled={!newSerious.trim()} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                  <Plus size={20} />
                </button>
              </form>
            )}

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
              {seriousItems.length === 0 ? (
                <div className="text-center text-sm text-stone-400 py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">Aucune idée pour le moment.</div>
              ) : (
                seriousItems.map(item => (
                  <div key={item.id_course} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/50 p-3 rounded-2xl flex items-center justify-between group">
                    <div className="flex flex-col overflow-hidden pr-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-sm truncate">{item.article}</span>
                      <span className="text-[10px] text-stone-400 font-medium">Proposé par {authorsMap[item.email_auteur.toLowerCase()] || 'Inconnu'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {session?.user?.email === item.email_auteur && (
                        <button onClick={() => handleDelete(item.id_course)} className="p-2 text-stone-300 hover:text-red-500 transition-colors hidden md:block group-hover:block"><Trash2 size={16} /></button>
                      )}
                      <button 
                        onClick={() => handleToggleVote(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${item.votes?.includes(session?.user?.email) ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
                      >
                        {item.votes?.length || 0} <ThumbsUp size={14} className={item.votes?.includes(session?.user?.email) ? "fill-current" : ""} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* COLONNE FUN */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-purple-500/20 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400"><Sparkles size={24} /></span>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Le Fun & Bonus</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Bouées, jeux de cartes, déco. Acheté avec le budget de l'organisation (le PEA d'Hippolyte).</p>

            {session && (
              <form onSubmit={(e) => handleAddItem(e, 'Fun')} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newFun} 
                  onChange={(e) => setNewFun(e.target.value)} 
                  placeholder="Ex: Bouée flamant rose, Ventriglisse..." 
                  className="flex-1 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  maxLength={50}
                />
                <button type="submit" disabled={!newFun.trim()} className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors">
                  <Plus size={20} />
                </button>
              </form>
            )}

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
              {funItems.length === 0 ? (
                <div className="text-center text-sm text-stone-400 py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">Aucune idée pour le moment.</div>
              ) : (
                funItems.map(item => (
                  <div key={item.id_course} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/50 p-3 rounded-2xl flex items-center justify-between group">
                    <div className="flex flex-col overflow-hidden pr-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-sm truncate">{item.article}</span>
                      <span className="text-[10px] text-stone-400 font-medium">Proposé par {authorsMap[item.email_auteur.toLowerCase()] || 'Inconnu'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {session?.user?.email === item.email_auteur && (
                        <button onClick={() => handleDelete(item.id_course)} className="p-2 text-stone-300 hover:text-red-500 transition-colors hidden md:block group-hover:block"><Trash2 size={16} /></button>
                      )}
                      <button 
                        onClick={() => handleToggleVote(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${item.votes?.includes(session?.user?.email) ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
                      >
                        {item.votes?.length || 0} <ThumbsUp size={14} className={item.votes?.includes(session?.user?.email) ? "fill-current" : ""} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}