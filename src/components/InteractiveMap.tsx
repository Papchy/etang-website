import { useState } from "react";
import { MapPin, Tent, Music, Car, Fish, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InteractiveMap() {
  const [activePin, setActivePin] = useState<string | null>(null);

  const points = [
    {
      id: "qg",
      top: "75%", 
      left: "15%", 
      icon: <Music size={18} />,
      title: "Le QG (Mobil-home)",
      description: "Le centre névralgique du week-end. C'est ici que se trouvent le barbecue, la tireuse à bière, la musique et l'électricité.",
      color: "bg-amber-500"
    },
    {
      id: "tents",
      top: "40%", 
      left: "85%", 
      icon: <Tent size={18} />,
      title: "Le Campement",
      description: "Zone pour planter les tentes. Espace plat et dégagé, à l'écart du gros de la musique pour ceux qui veulent dormir.",
      color: "bg-emerald-500"
    },
    {
      id: "fishing",
      top: "20%", 
      left: "50%", 
      icon: <Fish size={18} />,
      title: "Coin Pêche",
      description: "Spot tranquille de l'autre côté de l'étang pour se poser, pêcher, et profiter du calme.",
      color: "bg-blue-500"
    },
    {
      id: "parking",
      top: "85%", 
      left: "45%", 
      icon: <Car size={18} />,
      title: "Parking",
      description: "Garez-vous le long de ce chemin en file indienne pour ne pas bloquer l'accès aux véhicules de secours.",
      color: "bg-stone-500"
    }
  ];

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-md bg-stone-900 group">
      {/* L'image de fond */}
      <img 
        src="/map-bg.jpg" 
        alt="Carte de l'étang" 
        className="w-full h-auto aspect-[4/3] md:aspect-video object-cover opacity-90 transition-opacity duration-500"
      />

      {/* Les points d'intérêt */}
      {points.map((point) => (
        <div 
          key={point.id}
          className="absolute"
          style={{ top: point.top, left: point.left, transform: 'translate(-50%, -50%)' }}
        >
          {/* L'icône animée */}
          <button
            onClick={() => setActivePin(point.id)}
            className={`relative z-10 p-2 md:p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform ${point.color} ${activePin === point.id ? 'ring-4 ring-white/50 scale-110' : ''}`}
          >
            {point.icon}
          </button>
          
          {/* L'ombre/lueur derrière l'icône */}
          <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${point.color}`}></div>
        </div>
      ))}

      {/* La bulle d'information (Tooltip) */}
      <AnimatePresence>
        {activePin && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl z-20 border border-stone-200/50 dark:border-stone-700/50"
          >
            <button 
              onClick={() => setActivePin(null)}
              className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X size={16} />
            </button>
            
            {points.map(p => p.id === activePin && (
              <div key={`info-${p.id}`} className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg text-white ${p.color}`}>{p.icon}</span>
                  <h4 className="font-bold text-stone-800 dark:text-stone-100">{p.title}</h4>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Instructions */}
      {!activePin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold pointer-events-none tracking-wide">
          Touchez les icônes pour explorer
        </div>
      )}
    </div>
  );
}