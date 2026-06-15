import { useEffect, useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { MessageCircle, Heart, X, Send, Lock, Trash2, GripHorizontal, MousePointerClick } from "lucide-react";

interface Post {
  id_post: number;
  email_auteur: string;
  categorie: string;
  contenu: string;
  date_publication: string;
  likes: string[];
  position_x: number;
  position_y: number;
}

interface Comment {
  id_commentaire: number;
  id_post: number;
  email_auteur: string;
  message: string;
  date_publication: string;
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

export default function Wall() {
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [newPostPosition, setNewPostPosition] = useState<{x: number, y: number} | null>(null);
  
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Fun");
  const [newCommentContent, setNewCommentContent] = useState("");

  const [authorsMap, setAuthorsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const fetchInitialData = async () => {
      const { data: postsData } = await supabase.from('deplacement_posts').select('*');
      if (postsData) setPosts(postsData);

      const { data: participantsData } = await supabase.from('participants').select('email, prenom, nom');
      if (participantsData) {
        const map: Record<string, string> = {};
        participantsData.forEach(p => {
          map[p.email] = `${p.prenom} ${p.nom.charAt(0)}.`;
        });
        setAuthorsMap(map);
      }
    };

    fetchInitialData();

    const postsSub = supabase.channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deplacement_posts' }, fetchInitialData)
      .subscribe();

    return () => {
      postsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedPost) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from('deplacement_commentaires')
        .select('*')
        .eq('id_post', selectedPost.id_post)
        .order('date_publication', { ascending: true });
      if (data) setComments(data);
    };

    fetchComments();

    const commentsSub = supabase.channel('comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deplacement_commentaires', filter: `id_post=eq.${selectedPost.id_post}` }, fetchComments)
      .subscribe();

    return () => {
      commentsSub.unsubscribe();
    };
  }, [selectedPost]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Si une modale est ouverte, on ignore totalement le clic sur le mur
    if (isComposeOpen || selectedPost) return;
    
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // Si une modale est ouverte, on ignore
    if (isComposeOpen || selectedPost) return;

    // SÉCURITÉ : Si l'élément cliqué (ou un de ses parents) possède la classe "post-it-element", on annule l'ajout
    if ((e.target as Element).closest('.post-it-element')) return;

    const distance = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
    if (distance < 5) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setNewPostPosition({ x, y });
      setIsComposeOpen(true);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newPostContent.trim()) return;

    const finalX = newPostPosition ? newPostPosition.x - 80 : 1500;
    const finalY = newPostPosition ? newPostPosition.y - 80 : 1500;

    const { data } = await supabase.from('deplacement_posts').insert({
      email_auteur: session.user.email,
      categorie: newPostCategory,
      contenu: newPostContent,
      position_x: finalX,
      position_y: finalY
    }).select().single();

    if (data) {
      setPosts(prev => [...prev, data]);
    }

    setNewPostContent("");
    setIsComposeOpen(false);
    setNewPostPosition(null);
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newCommentContent.trim() || !selectedPost) return;

    const { data } = await supabase.from('deplacement_commentaires').insert({
      id_post: selectedPost.id_post,
      email_auteur: session.user.email,
      message: newCommentContent
    }).select().single();

    if (data) {
      setComments(prev => [...prev, data]);
    }

    setNewCommentContent("");
  };

  const handleDeletePost = async (idPost: number) => {
    setPosts(prev => prev.filter(p => p.id_post !== idPost));
    setSelectedPost(null);
    await supabase.from('deplacement_posts').delete().eq('id_post', idPost);
  };

  const handleDeleteComment = async (idCommentaire: number) => {
    setComments(prev => prev.filter(c => c.id_commentaire !== idCommentaire));
    await supabase.from('deplacement_commentaires').delete().eq('id_commentaire', idCommentaire);
  };

  const handleToggleLike = async (post: Post) => {
    if (!session) return;
    const userEmail = session.user.email;
    const hasLiked = post.likes?.includes(userEmail);
    
    let newLikes = post.likes || [];
    if (hasLiked) {
      newLikes = newLikes.filter(email => email !== userEmail);
    } else {
      newLikes = [...newLikes, userEmail];
    }

    setPosts(prev => prev.map(p => p.id_post === post.id_post ? { ...p, likes: newLikes } : p));
    if (selectedPost?.id_post === post.id_post) {
      setSelectedPost({ ...selectedPost, likes: newLikes });
    }

    await supabase.from('deplacement_posts').update({ likes: newLikes }).eq('id_post', post.id_post);
  };

  const handleDragEnd = async (post: Post, offset: { x: number, y: number }) => {
    const newX = Math.round(post.position_x + offset.x);
    const newY = Math.round(post.position_y + offset.y);
    
    setPosts(prev => prev.map(p => p.id_post === post.id_post ? { ...p, position_x: newX, position_y: newY } : p));
    await supabase.from('deplacement_posts').update({ position_x: newX, position_y: newY }).eq('id_post', post.id_post);
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Covoiturage': return 'bg-blue-100 text-blue-900 shadow-blue-900/20';
      case 'Important': return 'bg-amber-100 text-amber-900 shadow-amber-900/20';
      default: return 'bg-pink-100 text-pink-900 shadow-pink-900/20';
    }
  };

  const getDecoration = (index: number, category: string) => {
    if (category === 'Covoiturage') {
      return <img src="/scotch.png" alt="scotch" className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 opacity-80 z-10 pointer-events-none" />;
    }
    const pinNumber = (index % 3) + 1;
    return <img src={`/punaise${pinNumber}.png`} alt="punaise" className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 drop-shadow-md z-10 pointer-events-none" />;
  };

  const getRotation = (index: number) => {
    const rotations = ['rotate-[-2deg]', 'rotate-[3deg]', 'rotate-[-4deg]', 'rotate-[1deg]', 'rotate-[4deg]'];
    return rotations[index % rotations.length];
  };

  return (
    <div className="fixed inset-0 pt-20 pb-16 z-0 overflow-hidden bg-stone-900">
      
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full px-4 flex justify-center">
        <div className="bg-stone-900/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 border border-white/10">
          <MousePointerClick size={18} className="text-amber-400" />
          <span className="text-xs md:text-sm font-medium">Cliquez sur le mur pour épingler un mot</span>
        </div>
      </div>

      <motion.div
        drag
        dragConstraints={{ left: -3000 + window.innerWidth, right: 0, top: -3000 + window.innerHeight, bottom: 0 }}
        initial={{ x: -1500 + window.innerWidth / 2, y: -1500 + window.innerHeight / 2 }}
        className="absolute w-[3000px] h-[3000px] cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: "url('/liege.png')", backgroundRepeat: 'repeat', backgroundSize: '400px' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {posts.map((post, index) => (
          <motion.div 
            key={post.id_post} 
            initial={{ x: post.position_x, y: post.position_y }}
            animate={{ x: post.position_x, y: post.position_y }}
            drag
            dragMomentum={false}
            onDragStart={(e) => e.stopPropagation()}
            onDragEnd={(_e, info) => handleDragEnd(post, info.offset)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPost(post);
            }}
            // AJOUT DE LA CLASSE ICI ("post-it-element")
            className={`post-it-element absolute top-0 left-0 w-40 md:w-48 h-40 md:h-48 p-4 rounded-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer flex flex-col group/post ${getCategoryStyles(post.categorie)} ${getRotation(index)}`}
          >
            {getDecoration(index, post.categorie)}
            
            <div className="flex items-center justify-between mt-1">
              <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{post.categorie}</div>
              <GripHorizontal size={14} className="opacity-0 group-hover/post:opacity-30 transition-opacity" />
            </div>
            
            <p className="flex-1 mt-2 text-sm font-medium overflow-hidden text-ellipsis whitespace-pre-wrap leading-tight text-stone-900">
              {post.contenu}
            </p>
            
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold opacity-75 border-t border-black/10 pt-2 pointer-events-none text-stone-900">
              <span>{authorsMap[post.email_auteur] || "Inconnu"}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <Heart size={12} className={post.likes?.includes(session?.user?.email) ? "fill-red-500 text-red-500" : ""} /> 
                  {post.likes?.length || 0}
                </span>
                <MessageCircle size={12} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {isComposeOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => { setIsComposeOpen(false); setNewPostPosition(null); }} />
            <motion.div 
              variants={modalVariants} initial="hidden" animate="show" exit="exit"
              className="bg-stone-100 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-stone-800">Écrire sur le mur</h3>
                <button onClick={() => { setIsComposeOpen(false); setNewPostPosition(null); }} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X size={18} /></button>
              </div>
              
              {!session ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Lock size={32} className="text-stone-400 mb-4" />
                  <p className="font-medium text-stone-800 mb-2">Connexion requise</p>
                  <p className="text-sm text-stone-500">Passe par le panneau "Check-in" pour te connecter avec Google avant de pouvoir écrire.</p>
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="p-5 flex flex-col gap-4">
                  <div className="flex gap-2">
                    {['Fun', 'Covoiturage', 'Important'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewPostCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${newPostCategory === cat ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Message, blague, info... Les emojis sont les bienvenus !"
                    className="w-full h-32 p-4 rounded-2xl bg-white border border-stone-200 resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 font-medium text-stone-800"
                    maxLength={200}
                    required
                  />
                  <button type="submit" className="w-full bg-stone-800 text-white font-bold py-3.5 rounded-xl hover:bg-stone-700 transition-all flex items-center justify-center gap-2">
                    <Send size={18} /> Épingler ici
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
            <motion.div 
              variants={modalVariants} initial="hidden" animate="show" exit="exit"
              className="bg-white w-full max-w-md h-[85vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 md:rounded-t-3xl shrink-0 border-b border-black/5 ${getCategoryStyles(selectedPost.categorie)}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-xs font-black uppercase tracking-widest opacity-60 text-stone-900">{selectedPost.categorie}</div>
                  <div className="flex items-center gap-2">
                    {session?.user?.email === selectedPost.email_auteur && (
                      <button onClick={() => handleDeletePost(selectedPost.id_post)} className="p-1.5 bg-red-500/10 text-red-700 rounded-full hover:bg-red-500/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => setSelectedPost(null)} className="p-1.5 bg-black/5 rounded-full hover:bg-black/10 transition-colors"><X size={18} className="text-stone-900" /></button>
                  </div>
                </div>
                <p className="text-lg font-medium whitespace-pre-wrap mb-4 text-stone-900">{selectedPost.contenu}</p>
                <div className="flex justify-between items-center text-sm font-bold opacity-75 text-stone-900">
                  <span>Par {authorsMap[selectedPost.email_auteur] || "Inconnu"}</span>
                  <button 
                    onClick={() => handleToggleLike(selectedPost)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${selectedPost.likes?.includes(session?.user?.email) ? 'bg-red-500/20 text-red-700' : 'bg-black/5 hover:bg-black/10'}`}
                  >
                    <Heart size={16} className={selectedPost.likes?.includes(session?.user?.email) ? "fill-current" : ""} /> 
                    {selectedPost.likes?.length || 0}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center text-stone-400 text-sm mt-4">Aucun commentaire pour l'instant.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id_commentaire} className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 flex flex-col relative group">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-stone-800 mb-1">{authorsMap[comment.email_auteur] || "Inconnu"}</span>
                        {session?.user?.email === comment.email_auteur && (
                          <button onClick={() => handleDeleteComment(comment.id_commentaire)} className="text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-stone-600">{comment.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t border-stone-100 md:rounded-b-3xl">
                {!session ? (
                  <p className="text-xs text-center text-stone-500 bg-stone-100 py-3 rounded-xl">
                    Connecte-toi via le panneau Check-in pour commenter.
                  </p>
                ) : (
                  <form onSubmit={handleCreateComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 p-3 rounded-xl bg-stone-100 border-none focus:ring-2 focus:ring-stone-300 text-sm text-stone-800"
                      required
                    />
                    <button type="submit" className="p-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors">
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}