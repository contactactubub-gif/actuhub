import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageSquare, Bookmark, Share2, Volume2, VolumeX, 
  Play, Pause, ChevronUp, ChevronDown, Tv, Send, X, Music, Check,
  Edit, RotateCcw, Settings, AlertCircle, Shuffle, Sparkles, Flame, UserPlus, UserCheck
} from 'lucide-react';
import { ShortVideo } from '../types';
import { SHORT_CHANNELS, SHORTS_VIDEO_SEEDS, PRESEEDED_COMMENTS } from '../data/shortsData';
import { calculateRelevanceScore } from '../utils/searchEngine';

interface ShortTvSectionProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  openShareModal: (article: any) => void;
  searchQuery?: string;
  allShorts?: (ShortVideo & { videoId: string })[];
}

const getChannelIcon = (iconStr: string) => {
  if (iconStr === '📡') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '☀️') return <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '📰') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '📺') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '👩') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '💼') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '📈') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '💎') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (iconStr === '🌿') return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  return <Tv className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
};

function ShortTvSection({ 
  favorites, 
  toggleFavorite, 
  openShareModal,
  searchQuery = '',
  allShorts = []
}: ShortTvSectionProps) {
  const [customVideoIds, setCustomVideoIds] = useState<{ [key: string]: string }>({});
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  
  // Custom states for TikTok clone
  const [isShuffleMode, setIsShuffleMode] = useState<boolean>(true);
  const [shuffleKey, setShuffleKey] = useState<number>(0);
  const [videos, setVideos] = useState<(ShortVideo & { videoId: string })[]>(() => {
    const list = allShorts && allShorts.length > 0 ? allShorts : SHORTS_VIDEO_SEEDS;
    const arr = list.map(v => ({ ...v }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [currentIdx, setCurrentIdx] = useState(0);

  const filteredVideos = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return videos;
    const q = searchQuery.trim();
    return videos
      .map(v => {
        const { score } = calculateRelevanceScore(q, {
          title: v.title,
          description: v.description,
          sourceOrCategory: v.channelName || v.channel,
        });
        return { video: v, score };
      })
      .filter(item => item.score > 2)
      .sort((a, b) => b.score - a.score)
      .map(item => item.video);
  }, [videos, searchQuery]);

  useEffect(() => {
    setCurrentIdx(0);
  }, [searchQuery]);

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true); // default to true since browsers block unmuted autoplay
  const [isPaused, setIsPaused] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});
  const [followedChannels, setFollowedChannels] = useState<string[]>([]);
  const [localComments, setLocalComments] = useState<{ [key: string]: { name: string; text: string; date: string }[] }>({});
  const [newComment, setNewComment] = useState('');
  
  // Gestures state for vertical swiping/dragging mechanism
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [isSwipingVisual, setIsSwipingVisual] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Double-tap heart coordinates
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const videoRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Helper function to shuffle array
  const shuffleArray = (arr: any[]) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Helper function for deterministic mock values (keeps stats looking unique per video)
  const getMockMetrics = (vidId: string) => {
    let hash = 0;
    for (let i = 0; i < vidId.length; i++) {
      hash = vidId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseLikes = Math.abs((hash % 1200) + 420);
    const baseComments = Math.abs((hash % 60) + 12);
    const baseShares = Math.abs((hash % 180) + 24);
    const viewsCount = Math.abs((hash % 85000) + 2400);
    return { 
      likesCount: baseLikes,
      commentsCount: baseComments,
      sharesCount: baseShares,
      viewsCount
    };
  };

  // Load preseeded comments on init (No localStorage)
  useEffect(() => {
    setLocalComments(PRESEEDED_COMMENTS);
  }, []);

  // Filter & Order source video seeds
  useEffect(() => {
    const list = allShorts && allShorts.length > 0 ? allShorts : SHORTS_VIDEO_SEEDS;
    let mapped = list.map(v => ({
      ...v,
      videoId: customVideoIds[v.id] || v.videoId
    }));

    if (selectedChannel) {
      mapped = mapped.filter(v => v.handle === selectedChannel);
    }

    if (isShuffleMode) {
      mapped = shuffleArray(mapped);
    }

    setVideos(mapped);
    setCurrentIdx(0);
    setIsPaused(false);
  }, [selectedChannel, customVideoIds, isShuffleMode, allShorts, shuffleKey]);

  // Handle keys for desktop (Up/Down arrow swipe, Space play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingVideoId || commentsOpen) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleTogglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, filteredVideos, editingVideoId, commentsOpen]);

  const handleSaveCustomOverride = (shortId: string, inputUrlOrId: string) => {
    let extractedId = inputUrlOrId.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = extractedId.match(regExp);
    if (match && match[2].length === 11) {
      extractedId = match[2];
    } else if (extractedId.length !== 11) {
      try {
        if (extractedId.includes('youtube.com/') || extractedId.includes('youtu.be/')) {
          const parts = extractedId.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.length >= 11) {
            extractedId = lastPart.substring(0, 11);
          }
        }
      } catch (_) {}
    }

    const updated = { ...customVideoIds, [shortId]: extractedId };
    setCustomVideoIds(updated);
    setEditingVideoId(null);
  };

  const handleResetVideoId = (shortId: string) => {
    const updated = { ...customVideoIds };
    delete updated[shortId];
    setCustomVideoIds(updated);
    setEditingVideoId(null);
  };

  const toggleLike = (vidId: string) => {
    const updated = { ...likes, [vidId]: !likes[vidId] };
    setLikes(updated);
  };

  const toggleFollow = (handle: string) => {
    const isFollowing = followedChannels.includes(handle);
    let updated;
    if (isFollowing) {
      updated = followedChannels.filter(h => h !== handle);
    } else {
      updated = [...followedChannels, handle];
    }
    setFollowedChannels(updated);
  };

  const currentVideo = filteredVideos[currentIdx];

  const handleNextVideo = () => {
    if (currentIdx < filteredVideos.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setIsPaused(false);
    }
  };

  const handlePrevVideo = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setIsPaused(false);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentVideo) return;

    const key = currentVideo.id;
    const commentsList = localComments[key] || [];
    const added = {
      name: "Vous",
      text: newComment,
      date: "À l'instant"
    };

    const updated = {
      ...localComments,
      [key]: [...commentsList, added]
    };

    setLocalComments(updated);
    setNewComment('');
  };

  const activeComments = currentVideo ? (localComments[currentVideo.id] || []) : [];

  const postToPlayer = (func: string, args: any[] = []) => {
    if (!currentVideo) return;
    const iframe = videoRefs.current[currentVideo.id];
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: func, args: args }),
          '*'
        );
      } catch (err) {
        console.error('Error posting controller message:', err);
      }
    }
  };

  const handleTogglePlayPause = (targetState?: boolean) => {
    const newPaused = targetState !== undefined ? targetState : !isPaused;
    setIsPaused(newPaused);
    postToPlayer(newPaused ? 'pauseVideo' : 'playVideo');
  };

  const handleToggleMute = (targetMute?: boolean) => {
    const newMute = targetMute !== undefined ? targetMute : !isMuted;
    setIsMuted(newMute);
    if (newMute) {
      postToPlayer('mute');
    } else {
      postToPlayer('unMute');
      postToPlayer('setVolume', [100]);
      // Synchronously call playVideo to override browser's autoplay restrictions
      postToPlayer('playVideo');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMuted) {
        postToPlayer('mute');
      } else {
        postToPlayer('unMute');
        postToPlayer('setVolume', [100]);
        setTimeout(() => {
          if (!isPaused) {
            postToPlayer('playVideo');
          }
        }, 80);
      }
      postToPlayer(isPaused ? 'pauseVideo' : 'playVideo');
    }, 350);
    return () => clearTimeout(timer);
  }, [currentVideo]);

  // Touch gesture callbacks
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
    setSwipeOffset(0);
    setIsSwipingVisual(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentY = e.targetTouches[0].clientY;
    setTouchEnd(currentY);
    setSwipeOffset(currentY - touchStart);
  };

  const handleTouchEnd = () => {
    setIsSwipingVisual(false);
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    const distance = touchStart - touchEnd;
    const minDistance = 55;
    if (distance > minDistance) {
      handleNextVideo();
    } else if (distance < -minDistance) {
      handlePrevVideo();
    }
    setSwipeOffset(0);
  };

  // Mouse gesture callbacks (Dragging simulation on non-touch devices)
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientY);
    setIsSwipingVisual(true);
    setSwipeOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStart === null) return;
    const diff = e.clientY - mouseStart;
    setSwipeOffset(diff);
  };

  const handleMouseUp = () => {
    setIsSwipingVisual(false);
    if (mouseStart === null) return;
    const minDistance = 55;
    if (swipeOffset < -minDistance) {
      handleNextVideo();
    } else if (swipeOffset > minDistance) {
      handlePrevVideo();
    }
    setMouseStart(null);
    setSwipeOffset(0);
  };

  const handleMouseLeave = () => {
    if (mouseStart !== null) {
      handleMouseUp();
    }
  };

  // Double Click / Double Tap on player overlay
  const handleOverlayDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Trigger floating heart
    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x, y }]);
    
    if (currentVideo && !likes[currentVideo.id]) {
      toggleLike(currentVideo.id);
    }

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 800);
  };

  const metrics = currentVideo ? getMockMetrics(currentVideo.id) : { likesCount: 0, commentsCount: 0, sharesCount: 0, viewsCount: 0 };
  const totalLikes = metrics.likesCount + (likes[currentVideo?.id] ? 1 : 0);

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      <div id="shorttv-container" className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full text-white overflow-hidden flex-1 p-0 sm:p-2 md:p-4">
      
      {/* Immersive Mobile Device Frame mockup */}
      <div 
        id="shorttv-viewer-area" 
        className="flex-1 bg-zinc-950 relative flex items-center justify-center overflow-hidden shadow-2xl h-full select-none w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top bar removed/simplified */}



        {/* Global Swipe Drag Layer Wrapper */}
        <div 
          className="w-full h-full absolute inset-0 z-0 select-none origin-center"
          style={{ 
            transform: `translateY(${swipeOffset}px)`,
            transition: isSwipingVisual ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          {filteredVideos.length === 0 ? (
            <div id="shorts-empty" className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm mx-auto">
              <Tv className="w-12 h-12 text-zinc-600 animate-bounce" />
              <h3 className="text-base font-bold text-zinc-300">Aucune vidéo active</h3>
              <p className="text-xs text-zinc-500 leading-normal">
                Aucun Short n'a pu être chargé dans cette sélection. Réessayez avec une autre chaîne ou réinitialisez!
              </p>
            </div>
          ) : (
            <div id="shorts-player" className="w-full h-full relative">
              {/* YouTube Background Stream */}
              <iframe
                id={`short-iframe-${currentVideo.id}`}
                ref={el => { videoRefs.current[currentVideo.id] = el; }}
                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&mute=1&loop=1&playlist=${currentVideo.videoId}&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1`}
                title={currentVideo.title}
                className="w-full h-full scale-[1.05] pointer-events-none object-cover transition-opacity duration-300 select-none brightness-90 saturate-105"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />

              {/* Click / Native Double Click Overlay layer for interactive events */}
              <div 
                id="short-interact-overlay" 
                onClick={(e) => {
                  // Single click toggles play/pause, double click likes
                  if (e.detail === 2) {
                    handleOverlayDoubleClick(e);
                  } else {
                    const timer = setTimeout(() => {
                      handleTogglePlayPause();
                    }, 200);
                    return () => clearTimeout(timer);
                  }
                }}
                className="absolute inset-0 cursor-pointer z-10 select-none bg-gradient-to-b from-black/35 via-transparent to-black/60"
              />

              {/* Double-tap Floating heart animations overlay */}
              {floatingHearts.map(heart => (
                <div 
                  key={heart.id}
                  className="absolute pointer-events-none z-20 text-rose-500 scale-animation opacity-out"
                  style={{ left: heart.x - 24, top: heart.y - 24 }}
                >
                  <Heart className="w-12 h-12 fill-rose-500 filter drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-ping" />
                </div>
              ))}

              {/* Benign system warning banner if audio is muted initially */}
              {isMuted && (
                <div className="absolute top-[75px] left-1/2 -translate-x-1/2 z-25 bg-rose-600/90 text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full animate-bounce shadow-lg pointer-events-none flex items-center gap-1">
                  <VolumeX className="w-3 h-3" />
                  <span>Son Muet • Appuyez pour Activer</span>
                </div>
              )}

              {/* Paused state play indicator */}
              {isPaused && (
                <div id="shorts-paused-icon" className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
                  <span className="p-5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 scale-125 animate-scale-heart">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </span>
                </div>
              )}

              {/* Bottom Channel Select and Refresh Toolbar */}
              <div className="absolute bottom-16 left-4 right-16 z-25 flex items-center gap-2 pointer-events-auto">
                <div className="relative">
                  <button
                    id="shorttv-channel-select"
                    onClick={(e) => { e.stopPropagation(); setChannelDropdownOpen(!channelDropdownOpen); }}
                    className="bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-xs font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 text-white active:scale-95 transition-all cursor-pointer shadow-xl"
                  >
                    <Tv className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span className="max-w-[120px] truncate-ellipsis overflow-hidden whitespace-nowrap">
                      {selectedChannel ? SHORT_CHANNELS.find(c => c.handle === selectedChannel)?.name : 'Toutes les chaînes'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>
                  
                  {channelDropdownOpen && (
                    <div id="channel-dropdown-card" className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-40 animate-fade-in divide-y divide-zinc-800">
                      <button
                        id="opt-ch-all"
                        onClick={(e) => { e.stopPropagation(); setSelectedChannel(null); setChannelDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-800 flex items-center justify-between ${!selectedChannel ? 'text-rose-500 bg-rose-500/10' : 'text-neutral-300'}`}
                      >
                        <span className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Toutes les chaînes (YouTube Live)</span>
                        </span>
                        {!selectedChannel && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="max-h-52 overflow-y-auto">
                        {SHORT_CHANNELS.map(ch => (
                          <button
                            id={`opt-ch-${ch.name.replace(/\s+/g, '-').toLowerCase()}`}
                            key={ch.handle}
                            onClick={(e) => { e.stopPropagation(); setSelectedChannel(ch.handle); setChannelDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-805 flex items-center justify-between ${selectedChannel === ch.handle ? 'text-rose-500 bg-rose-500/10 font-bold' : 'text-neutral-400'}`}
                          >
                            <span className="flex items-center gap-2">
                              {getChannelIcon(ch.icon)}
                              <span>{ch.name}</span>
                            </span>
                            {selectedChannel === ch.handle && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShuffleMode(true);
                    setShuffleKey(prev => prev + 1);
                  }}
                  title="Actualiser les flux YouTube en direct"
                  className="bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-2xl text-rose-400 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[11px] font-bold px-3 shadow-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="hidden sm:inline">Flux Directs</span>
                </button>
              </div>

              {/* Bottom Details/Channel info & tags */}
              <div id="shorts-bottom-details" className="absolute bottom-6 left-4 right-16 z-25 pointer-events-none space-y-2 select-none">
                {/* Title */}
                <p className="text-xs text-zinc-100 font-bold drop-shadow-md line-clamp-2 leading-relaxed max-w-[270px]">
                  {currentVideo.title}
                </p>

                {/* Interactive Dynamic Rotating standard music track indicator */}
                <div className="text-[10px] text-white/80 flex items-center gap-1.5 font-mono drop-shadow-md select-none">
                  <Music className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="overflow-hidden truncate max-w-[190px] whitespace-nowrap">Son original</span>
                </div>
              </div>

              {/* Interactive spinning cassette disc simulation */}
              <div className={`stv-disc ${isPaused ? 'stv-paused' : ''} absolute bottom-6 right-4 z-20 border-[3.5px] border-zinc-800 shadow-2xl`}>
                <div className="inner-bullet w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              {/* Sidebar Action icons (floating panel) */}
              <div id="shorts-sidebar-acts" className="absolute right-4 bottom-20 z-20 flex flex-col items-center gap-4.5 select-none text-center">
                
                {/* Audio Toggle */}
                <button
                  id="shorttv-volume-toggle-sidebar"
                  onClick={(e) => { e.stopPropagation(); handleToggleMute(); }}
                  className="flex flex-col items-center gap-1 focus:scale-110 active:scale-95 transition-transform group pointer-events-auto cursor-pointer"
                  title={isMuted ? "Activer le son" : "Désactiver le son"}
                >
                  <span className={`p-2.5 rounded-full backdrop-blur-md border ${
                    !isMuted 
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]' 
                      : 'bg-black/55 border-white/5 text-rose-500 hover:text-white'
                  }`}>
                    {isMuted ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  </span>
                  <span className="text-[9px] font-extrabold text-zinc-100 drop-shadow-md">
                    {isMuted ? 'Muet' : 'Son'}
                  </span>
                </button>

                {/* Read Later / Favorite */}
                <button
                  id={`btn-bookmark-${currentVideo.id}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(currentVideo.id); }}
                  className="flex flex-col items-center gap-1 focus:scale-110 active:scale-95 transition-transform group pointer-events-auto cursor-pointer"
                >
                  <span className={`p-2.5 rounded-full backdrop-blur-md border ${
                    favorites.includes(currentVideo.id) 
                      ? 'bg-yellow-500 border-yellow-600 text-white shadow-lg' 
                      : 'bg-black/55 border-white/5 text-white hover:text-yellow-400'
                  }`}>
                    <Bookmark className={`w-4 h-4 ${favorites.includes(currentVideo.id) ? 'fill-white' : ''}`} />
                  </span>
                </button>

                {/* Share Option */}
                <button
                  id="btn-share"
                  onClick={(e) => {
                    e.stopPropagation();
                    openShareModal({
                      title: currentVideo.title,
                      link: `https://www.youtube.com/watch?v=${currentVideo.videoId}`,
                      source: currentVideo.channel,
                      image: `https://img.youtube.com/vi/${currentVideo.videoId}/hqdefault.jpg`
                    });
                  }}
                  className="flex flex-col items-center gap-1 focus:scale-110 active:scale-95 transition-transform group pointer-events-auto cursor-pointer"
                >
                  <span className="p-2.5 rounded-full bg-black/55 border border-white/5 hover:bg-neutral-900 text-white hover:text-cyan-400 backdrop-blur-md">
                    <Share2 className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-extrabold text-zinc-100 drop-shadow-md">Partager</span>
                </button>

              </div>
            </div>
          )}
        </div>

        {/* Tactical side controls overlay helper (perfect for desktops/trackpads) */}
        {filteredVideos.length > 0 && (
          <div id="tactile-navigation-helpers" className="absolute left-4 bottom-20 flex flex-col gap-2.5 z-25 select-none pointer-events-auto">
            <button
              id="nav-helper-prev"
              onClick={(e) => { e.stopPropagation(); handlePrevVideo(); }}
              disabled={currentIdx === 0}
              className="p-2 rounded-full bg-black/55 hover:bg-black/75 border border-white/5 text-white hover:scale-110 active:scale-90 disabled:opacity-20 transition-all cursor-pointer"
              title="Vidéo Précédente"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              id="nav-helper-next"
              onClick={(e) => { e.stopPropagation(); handleNextVideo(); }}
              disabled={currentIdx === filteredVideos.length - 1}
              className="p-2 rounded-full bg-black/55 hover:bg-black/75 border border-white/5 text-white hover:scale-110 active:scale-90 disabled:opacity-20 transition-all cursor-pointer"
              title="Vidéo Suivante"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Visual Help Banner tooltip for gesture hint */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-45 text-[8px] text-zinc-400 font-mono flex items-center gap-1 font-semibold uppercase tracking-widest text-center whitespace-nowrap">
          <span>⬆️ Glissez ou Cliquer-Déposer ou utilisez les flèches du clavier ⬇️</span>
        </div>

        {/* Custom video editor link overlay inside device viewer */}
        {editingVideoId && currentVideo && (
          <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center p-6 animate-fade-in font-sans pointer-events-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl relative text-left">
              <button 
                onClick={() => setEditingVideoId(null)}
                className="absolute top-4 right-4 text-zinc-450 hover:text-white p-1 rounded-lg cursor-pointer hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 text-sky-450">
                <Edit className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Modifier la vidéo</h3>
              </div>
              
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-200 font-bold leading-normal">
                  {currentVideo.title}
                </p>
                <p className="text-[10px] text-zinc-450 leading-relaxed">
                  Si le Short n'est pas disponible pour ce format d'intégration de YouTube, remplacez-le par n'importe quel autre lien ou ID!
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[8px] text-zinc-400 uppercase tracking-widest mb-1 font-bold">URL YouTube ou ID</label>
                  <input
                    type="text"
                    value={editInputValue}
                    onChange={(e) => setEditInputValue(e.target.value)}
                    placeholder="Ex: WWsU__tHjAM ou URL"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder:text-zinc-650 font-sans"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 text-[10px] pt-1">
                  <button
                    onClick={() => handleSaveCustomOverride(currentVideo.id, editInputValue)}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Enregistrer</span>
                  </button>
                  
                  {customVideoIds[currentVideo.id] && (
                    <button
                      onClick={() => handleResetVideoId(currentVideo.id)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Utiliser l'ID par défaut"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setEditingVideoId(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Comments Container Panel */}
      {commentsOpen && currentVideo && (
        <div id="comments-flyout-block" className="w-full lg:w-80 bg-zinc-900 border border-zinc-800 rounded-[30px] p-5 flex flex-col h-[280px] lg:h-full justify-between shadow-2xl animate-fade-in shrink-0 pointer-events-auto">
          <div id="comments-header" className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
            <div id="comments-title-wrap" className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">Commentaires</h3>
              <span className="bg-zinc-850 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeComments.length || metrics.commentsCount}
              </span>
            </div>
            <button 
              id="comments-close"
              onClick={() => setCommentsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List display */}
          <div id="comments-scroll-list" className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {activeComments.length === 0 ? (
              <div id="comments-empty-prompt" className="text-center py-6 text-zinc-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-[11px] font-medium leading-normal">Aucun commentaire pour le moment.<br/>Donnez votre avis en écrivant ci-dessous!</p>
              </div>
            ) : (
              activeComments.map((cmt, idx) => (
                <div id={`cmt-item-${idx}`} key={idx} className="flex gap-2 text-xs animate-fade-in">
                  <span className="w-7 h-7 rounded-full bg-zinc-800 text-rose-500 font-extrabold flex items-center justify-center uppercase shrink-0 border border-zinc-700">
                    {cmt.name.charAt(0)}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">{cmt.name}</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono">{cmt.date}</span>
                    </div>
                    <p className="text-zinc-350 leading-relaxed font-sans">{cmt.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input messaging form */}
          <form id="comment-add-form" onSubmit={handleAddComment} className="pt-3 border-t border-zinc-800 flex gap-2 shrink-0 pointer-events-auto">
            <input
              id="comment-input-text"
              type="text"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-rose-500"
            />
            <button
              id="comment-submit-btn"
              type="submit"
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}

export default React.memo(ShortTvSection);
