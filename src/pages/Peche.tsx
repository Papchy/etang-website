import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Fish, Plus } from "lucide-react";

interface Capture {
  id_peche: number;
  email_pecheur: string;
  taille_cm: number;
  participants: { prenom: string, photo_url: string };
}

export default function Peche() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [taille, setTaille] = useState("");

  useEffect(() => {
    fetchCaptures();
  }, []);

  const fetchCaptures = async () => {
    const { data } = await supabase
      .from('peche')
      .select('*, participants(prenom, photo_url)')
      .order('taille_cm', { ascending: false });
    if (data) setCaptures(data as any);
  };

  const addCapture = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !taille) return;
    await supabase.from('peche').insert({ email_pecheur: user.email, taille_cm: parseFloat(taille) });
    setTaille("");
    fetchCaptures();
  };

  // Calcul du podium et classement
  const stats = captures.reduce((acc: any, curr) => {
    const email = curr.email_pecheur;
    if (!acc[email]) acc[email] = { name: curr.participants?.prenom, photo: curr.participants?.photo_url, total: 0, max: 0 };
    acc[email].total += 1;
    acc[email].max = Math.max(acc[email].max, curr.taille_cm);
    return acc;
  }, {});

  const classement = Object.values(stats).sort((a: any, b: any) => b.max - a.max);

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Fish className="text-blue-500"/> Concours de Pêche</h1>
      
      {/* Podium */}
      <div className="flex justify-center items-end gap-4 mb-10 h-48">
        {classement.slice(1, 2).map((p: any, i) => <PodiumItem key={i} p={p} rank={2} height="h-24" />)}
        {classement.slice(0, 1).map((p: any, i) => <PodiumItem key={i} p={p} rank={1} height="h-32" />)}
        {classement.slice(2, 3).map((p: any, i) => <PodiumItem key={i} p={p} rank={3} height="h-20" />)}
      </div>

      {/* Formulaire ajout */}
      <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl mb-6 flex gap-2">
        <input type="number" placeholder="Taille (cm)" className="flex-1 bg-stone-100 dark:bg-stone-700 p-2 rounded-lg" onChange={e => setTaille(e.target.value)} />
        <button onClick={addCapture} className="bg-blue-500 text-white p-2 rounded-lg"><Plus/></button>
      </div>

      {/* Liste scrollable */}
      <div className="space-y-2">
        {classement.map((p: any, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-xl">
            <span className="font-bold">#{i + 1} {p.name}</span>
            <span>{p.total} poissons (Max: {p.max}cm)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumItem({ p, rank, height }: any) {
  return (
    <div className={`flex flex-col items-center ${height}`}>
      <img src={p.photo} className="w-12 h-12 rounded-full border-4 border-amber-400 mb-1" />
      <div className="w-16 bg-blue-500 rounded-t-lg flex-1 flex items-center justify-center text-white font-black">{rank}</div>
    </div>
  );
}