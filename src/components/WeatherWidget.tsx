import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudLightning, Thermometer, CloudSun } from "lucide-react";

interface WeatherData {
  temperature_2m: number;
  weather_code: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Coordonnées de Lys-Haut-Layon (La Retruère)
    const url = "https://api.open-meteo.com/v1/forecast?latitude=47.1187&longitude=-0.4902&current=temperature_2m,weather_code&timezone=Europe%2FParis";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          setWeather(data.current);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur météo:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-16 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md rounded-2xl animate-pulse flex items-center justify-center text-xs text-stone-400">
        Chargement de la météo en direct...
      </div>
    );
  }

  if (!weather) return null;

  // Traduction des codes météo de l'OMM (Organisation météorologique mondiale) en icônes et textes
  const getWeatherDetails = (code: number) => {
    if (code === 0) return { icon: <Sun className="text-amber-500 animate-spin-slow" size={28} />, text: "Ciel dégagé" };
    if (code <= 3) return { icon: <CloudSun className="text-stone-400 dark:text-stone-300" size={28} />, text: "Nuageux" };
    if (code <= 48) return { icon: <Cloud className="text-stone-500" size={28} />, text: "Brumeux" };
    if (code <= 67 || (code >= 80 && code <= 82)) return { icon: <CloudRain className="text-blue-500" size={28} />, text: "Pluie" };
    return { icon: <CloudLightning className="text-purple-500" size={28} />, text: "Orageux" };
  };

  const details = getWeatherDetails(weather.weather_code);

  return (
    <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-stone-700/40 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
          {details.icon}
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">Sur place en direct</span>
          <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{details.text}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-xl font-black text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl">
        <Thermometer size={18} className="text-red-500" />
        <span>{Math.round(weather.temperature_2m)}°C</span>
      </div>
    </div>
  );
}