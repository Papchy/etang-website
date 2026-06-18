import { MapPin, Calendar, Tent, Camera, Navigation, Car, AlertCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import WeatherWidget from "../components/WeatherWidget";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", bounce: 0.4, duration: 0.8 } }
};

export default function Home() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 md:gap-8 pb-8"
    >
      <motion.div variants={itemVariants} className="group relative h-72 md:h-96 md:rounded-[2rem] rounded-b-[2rem] overflow-hidden shadow-2xl md:mx-4 mt-0 md:mt-4">
        <img 
          src="etang_front.jpg" 
          alt="L'étang" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/30 to-transparent flex flex-col justify-end p-6 md:p-10 transition-colors duration-500 group-hover:from-stone-900/95">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-md"
          >
            Week-end à l'Étang
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-stone-200 font-medium text-sm md:text-lg flex items-center gap-2"
          >
            <MapPin size={18} className="text-amber-400" /> La Retruère, Lys-Haut-Layon
          </motion.p>
        </div>
      </motion.div>

      <div className="px-5 md:px-8 flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
        <WeatherWidget />
        <motion.section 
          variants={itemVariants}
          className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl border border-white/40 dark:border-stone-700/40 transition-all duration-500 flex flex-col"
        >
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
            <span className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl"><Calendar size={24} className="text-amber-600 dark:text-amber-400" /></span>
            Le Programme
          </h2>
          <div className="text-sm md:text-base text-stone-600 dark:text-stone-300 space-y-5 flex-1">
            <p className="leading-relaxed">
              <strong className="text-stone-800 dark:text-stone-100">Organisation :</strong> Arrivée à partir de l'heure que vous voulez le samedi 11 juillet. Départ quand vous le souhaitez le dimanche, ou même le lundi.
            </p>
            <p className="leading-relaxed">
              <strong className="text-stone-800 dark:text-stone-100">Au menu :</strong> Grand barbecue le samedi soir et tireuse. Un Aldi est ouvert le dimanche matin à quelques minutes en voiture.
            </p>
            <p className="leading-relaxed">
              <strong className="text-stone-800 dark:text-stone-100">Sur place :</strong> Électricité, toilettes, de l'espace, et on va essayer de monter un truc stylé (tyrolienne ou autre).
            </p>
            
            <div className="bg-gradient-to-br from-emerald-50 to-stone-50 dark:from-stone-800 dark:to-stone-800 border border-emerald-100/50 dark:border-stone-700 p-5 rounded-2xl mt-6 text-stone-700 dark:text-stone-300 shadow-inner">
              <span className="font-bold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-base">
                <Tent size={20} /> À prévoir dans les sacs
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Tente & duvet</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Maillot de bain</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Anti-moustique</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Sièges/Tables camping</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <div className="flex flex-col gap-6 md:gap-8">
          
          <motion.a 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            href="https://photos.app.goo.gl/b39Ldh4XC3fq21th7" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative overflow-hidden w-full bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 text-white rounded-3xl p-6 flex items-center justify-between shadow-lg shadow-emerald-900/20"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500 translate-x-10 -translate-y-10"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                <Camera size={28} />
              </div>
              <div className="text-left flex flex-col">
                <span className="font-bold text-xl leading-tight">Album Partagé</span>
                <span className="text-sm text-emerald-100 font-medium mt-1">Pour déposer toutes vos photos</span>
              </div>
            </div>
            <Navigation size={26} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 relative z-10" />
          </motion.a>

          <motion.section 
            variants={itemVariants}
            className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-6 shadow-sm hover:shadow-xl border border-white/40 dark:border-stone-700/40 transition-all duration-500 flex-1"
          >
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-6 flex items-center gap-3">
              <span className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl"><Car size={24} className="text-amber-600 dark:text-amber-400" /></span>
              Accès & Parking
            </h2>
            
            <div className="space-y-6">
              <div className="group flex flex-col gap-3">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-300 uppercase tracking-wider">Itinéraire depuis Angers</h3>
                <a 
                  href="https://www.google.com/maps/dir/Angers/La+Retruère,+Lys-Haut-Layon/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-stone-100 dark:bg-stone-800"
                >
                  <div className="h-40 md:h-48 w-full relative overflow-hidden">
                    <img 
                      src="/trajet-angers.png" 
                      alt="Chemin Angers La Retruère" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 dark:opacity-80"
                    />
                    <div className="absolute inset-0 bg-stone-900/10 dark:bg-stone-900/30 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm text-stone-800 dark:text-stone-200 text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 group-hover:-translate-y-1 transition-transform duration-300">
                      <MapPin size={18} className="text-amber-500 animate-bounce" /> 
                      Ouvrir le GPS
                    </div>
                  </div>
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-300 uppercase tracking-wider">Plan du parking</h3>
                <div className="flex flex-col rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-700/50 hover:border-amber-300 dark:hover:border-amber-600/50 transition-colors duration-300">
                  <div className="h-48 md:h-56 w-full overflow-hidden relative">
                    <img 
                      src="/zoom-parking.png" 
                      alt="Zoom sur la zone de parking" 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000 ease-out dark:opacity-80"
                    />
                  </div>
                  <div className="bg-amber-50/80 dark:bg-amber-950/30 text-stone-800 dark:text-stone-300 text-xs md:text-sm font-medium p-3 md:p-4 flex items-start gap-3 border-t border-amber-100/50 dark:border-amber-900/30">
                    <AlertCircle size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Merci de vous garer dans la zone indiquée sur cette carte pour ne pas bloquer les chemins d'accès.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </motion.div>
  );
}