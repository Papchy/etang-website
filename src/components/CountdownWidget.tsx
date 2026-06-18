import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export default function CountdownWidget() {
  const calculateTimeLeft = () => {
    // Cible : Samedi 11 Juillet 2026 à 10h00
    const difference = +new Date("2026-07-11T10:00:00") - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-2xl p-4 border border-white/10 shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl">
          <Timer className="text-amber-400 animate-pulse" size={24} />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Le grand départ</span>
          <span className="text-sm font-bold text-stone-100">Week-end à l'Étang</span>
        </div>
      </div>
      
      <div className="flex gap-3 text-center">
        <div className="flex flex-col"><span className="text-lg font-black text-amber-400 leading-tight">{timeLeft.days}</span><span className="text-[9px] uppercase tracking-wide text-stone-400 font-bold">Jours</span></div>
        <div className="flex flex-col"><span className="text-lg font-black leading-tight">{timeLeft.hours}</span><span className="text-[9px] uppercase tracking-wide text-stone-400 font-bold">H</span></div>
        <div className="flex flex-col"><span className="text-lg font-black leading-tight">{timeLeft.minutes}</span><span className="text-[9px] uppercase tracking-wide text-stone-400 font-bold">Min</span></div>
        <div className="flex flex-col"><span className="text-lg font-black leading-tight">{timeLeft.seconds}</span><span className="text-[9px] uppercase tracking-wide text-stone-400 font-bold">Sec</span></div>
      </div>
    </div>
  );
}