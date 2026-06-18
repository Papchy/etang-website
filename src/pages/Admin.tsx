import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Shield, ShieldAlert, CheckCircle, XCircle, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";

interface Paiement {
  email: string;
  montant: number;
  methode: string;
  statut: string;
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [authorsMap, setAuthorsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Vérification du rôle admin
      const { data: participant } = await supabase
        .from('participants')
        .select('is_admin')
        .eq('email', session.user.email)
        .maybeSingle();

      if (!participant?.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      fetchAdminData();
    };

    checkAdminAndFetch();
  }, []);

  const fetchAdminData = async () => {
    const { data: paiementsData } = await supabase.from('paiements').select('*');
    if (paiementsData) setPaiements(paiementsData);

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

  const updateStatutPaiement = async (email: string, currentStatut: string) => {
    const nextStatut = currentStatut === 'Validé' ? 'En attente' : 'Validé';
    
    setPaiements(prev => prev.map(p => p.email === email ? { ...p, statut: nextStatut } : p));

    await supabase
      .from('paiements')
      .update({ statut: nextStatut })
      .eq('email', email);
  };

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Chargement de l'espace sécurité...</div>;
  if (isAdmin === false) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] text-stone-500 gap-4">
        <ShieldAlert size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Accès restreint</h2>
        <p className="text-sm max-w-xs">Tu dois disposer d'un compte administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  // Calculs financiers dynamiques
  const totalTotal = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalValide = paiements.filter(p => p.statut === 'Validé').reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalEnAttente = paiements.filter(p => p.statut === 'En attente').reduce((sum, p) => sum + (p.montant || 0), 0);

  return (
    <div className="px-5 md:px-8 flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mt-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-stone-800 text-white rounded-xl"><Shield size={22} /></span>
          <div className="text-left">
            <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">Panneau d'administration</h1>
            <p className="text-xs text-stone-500">Suivi comptable et validation des cagnottes.</p>
          </div>
        </div>
        <button onClick={fetchAdminData} className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-200 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* BLOCS DES TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm text-left">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Total Général</span>
          <div className="text-2xl font-black text-stone-800 dark:text-stone-100">{totalTotal} €</div>
          <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> Somme théorique déclarée</div>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl shadow-sm text-left">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Total Validé</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalValide} €</div>
          <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1 flex items-center gap-1"><ShieldCheck size={12} /> Argent reçu physiquement</div>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 p-5 rounded-2xl shadow-sm text-left">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Total En Attente</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalEnAttente} €</div>
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1 flex items-center gap-1"><RefreshCw size={12} /> Transactions à contrôler</div>
        </div>
      </div>

      {/* TABLEAU DE LISTE */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 font-bold text-sm text-stone-700 dark:text-stone-300 text-left">
          Transactions déclarées ({paiements.length})
        </div>
        
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {paiements.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-400">Aucune transaction financière déclarée pour l'instant.</div>
          ) : (
            paiements.map(p => (
              <div key={p.email} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                <div className="text-left">
                  <div className="text-sm font-bold text-stone-800 dark:text-stone-100">
                    {authorsMap[p.email.toLowerCase()] || p.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-stone-400 font-medium">{p.email}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-black text-stone-800 dark:text-stone-100">{p.montant} €</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{p.methode}</div>
                  </div>

                  <button
                    onClick={() => updateStatutPaiement(p.email, p.statut)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      p.statut === 'Validé' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-500/20' 
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 hover:border-emerald-500/20'
                    }`}
                  >
                    {p.statut === 'Validé' ? (
                      <><CheckCircle size={14} /> Validé</>
                    ) : (
                      <><XCircle size={14} /> En attente</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}