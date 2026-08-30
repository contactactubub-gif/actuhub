import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Volume2, Sparkles, Shield, Award, Play } from 'lucide-react';
import { Advertisement } from '../types';

export const DEFAULT_CNIN_BENIN_ADS: Advertisement[] = [
  {
    id: 'cnin-fly1',
    title: 'CNIN BÉNIN - Protection des Données Personnelles',
    type: 'image',
    mediaUrl: '/fly1.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'header',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cnin-fly2',
    title: 'CNIN BÉNIN - Sécurité des Mots de Passe & Identité Numérique',
    type: 'image',
    mediaUrl: '/fly2.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'sidebar',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cnin-fly4',
    title: 'CNIN BÉNIN - Sensibilisation Contre la Cybercriminalité',
    type: 'image',
    mediaUrl: '/fly4.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'above_rumors',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cnin-fly5',
    title: 'CNIN BÉNIN - Protection de la Vie Privée & Signalements',
    type: 'image',
    mediaUrl: '/fly5.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'in_feed',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cnin-fly6',
    title: 'CNIN BÉNIN - Protection des Mineurs sur les Réseaux Sociaux',
    type: 'image',
    mediaUrl: '/fly6.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'footer',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cnin-fly7',
    title: 'CNIN BÉNIN - Conformité Numérique des Médias & Entreprises',
    type: 'image',
    mediaUrl: '/fly7.jpg',
    targetUrl: 'https://www.cnin.bj',
    placement: 'header',
    placements: ['header', 'sidebar', 'above_rumors', 'rumors_top', 'in_feed', 'footer', 'inline', 'popup'],
    label: 'annonce',
    advertiserName: 'CNIN BÉNIN',
    active: true,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  }
];

interface AdCarouselProps {
  advertisements?: Advertisement[];
  onTrackView?: (adId: string) => void;
  onTrackClick?: (adId: string) => void;
  placementFilter?: string;
  className?: string;
  autoPlayInterval?: number; // in milliseconds, default 3000ms (3 seconds)
}

export const AdCarousel: React.FC<AdCarouselProps> = ({
  advertisements = [],
  onTrackView,
  onTrackClick,
  placementFilter,
  className = '',
  autoPlayInterval = 3000 // 3 seconds per user request
}) => {
  // Combine passed advertisements with default CNIN BENIN campaign slides if needed
  const combinedAds = advertisements && advertisements.length > 0
    ? [...advertisements, ...DEFAULT_CNIN_BENIN_ADS.filter(def => !advertisements.some(a => a.id === def.id))]
    : DEFAULT_CNIN_BENIN_ADS;

  // Filter active advertisements matching the placement filter if provided
  const activeAds = combinedAds.filter(ad => {
    if (!ad.active) return false;
    if (!placementFilter) return true;
    return ad.placement === placementFilter || 
           (ad.placements && ad.placements.includes(placementFilter as any)) ||
           (placementFilter === 'rumors_top' && (ad.placement === 'above_rumors' || ad.placements?.includes('above_rumors')));
  });

  // Fallback to all CNIN BENIN campaign slides if no ad specifically matched placementFilter
  const displayAds = activeAds.length > 0 ? activeAds : DEFAULT_CNIN_BENIN_ADS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackedViews = useRef<Set<string>>(new Set());

  // Track view for the active ad
  useEffect(() => {
    if (displayAds.length === 0) return;
    const currentAd = displayAds[currentIndex % displayAds.length];
    if (currentAd && !trackedViews.current.has(currentAd.id)) {
      trackedViews.current.add(currentAd.id);
      if (onTrackView) {
        onTrackView(currentAd.id);
      }
    }
  }, [currentIndex, displayAds, onTrackView]);

  // Revolving carousel interval (3 seconds)
  useEffect(() => {
    if (displayAds.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayAds.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [displayAds.length, isPaused, autoPlayInterval]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayAds.length) % displayAds.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayAds.length);
  };

  const currentAd = displayAds[currentIndex % displayAds.length];

  const handleAdClick = () => {
    if (!currentAd) return;
    if (onTrackClick) {
      onTrackClick(currentAd.id);
    }
    if (currentAd.targetUrl && currentAd.targetUrl !== '#') {
      if (currentAd.targetUrl.startsWith('http')) {
        window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (!currentAd) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-900/50 bg-slate-900 text-white shadow-lg transition-all group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Image / Video with true original image sizing - Clickable Ad */}
      <div 
        onClick={handleAdClick}
        className={`relative w-full min-h-[220px] sm:min-h-[280px] md:min-h-[320px] max-h-[460px] overflow-hidden bg-slate-950 flex items-center justify-center ${currentAd.targetUrl && currentAd.targetUrl !== '#' ? 'cursor-pointer' : ''}`}
      >
        {currentAd.type === 'video' || currentAd.mediaUrl.includes('youtube') || currentAd.mediaUrl.includes('embed') ? (
          currentAd.mediaUrl.includes('youtube') || currentAd.mediaUrl.includes('embed') ? (
            <iframe
              src={currentAd.mediaUrl}
              title={currentAd.title}
              className="w-full h-[260px] sm:h-[320px] md:h-[360px] object-cover border-0 pointer-events-none opacity-90"
            />
          ) : (
            <video
              src={currentAd.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-[260px] sm:h-[320px] md:h-[360px] object-cover opacity-90"
            />
          )
        ) : (
          <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center justify-center overflow-hidden p-2">
            {/* Ambient Blurred Background to fill Letterboxing */}
            <img
              src={currentAd.mediaUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
            />

            {/* Real Size Original Aspect-Ratio Image */}
            <img
              key={currentAd.id}
              src={currentAd.mediaUrl}
              alt={currentAd.title}
              className="relative z-10 max-h-[340px] sm:max-h-[380px] md:max-h-[420px] w-auto max-w-full object-contain mx-auto transition-all duration-700 ease-out transform group-hover:scale-[1.01] shadow-2xl rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200';
              }}
            />
          </div>
        )}

        {/* Top bar info */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-slate-950" />
              {currentAd.label === 'annonce' ? 'Annonce Officielle' : 'Publicité'}
            </span>
            {currentAd.advertiserName && (
              <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700/60 font-mono truncate max-w-[180px] shadow-md">
                {currentAd.advertiserName}
              </span>
            )}
          </div>

          {/* Slide indicator pill & timer bar */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[10px] font-mono font-bold text-slate-300 shadow-md">
            <span className="text-amber-400">{currentIndex + 1}</span>
            <span>/</span>
            <span>{displayAds.length}</span>
            <span className="text-[9px] text-slate-400 ml-1 font-sans">
              {isPaused ? '(En pause)' : '• 3s'}
            </span>
          </div>
        </div>

        {/* Previous / Next Navigation Arrows */}
        {displayAds.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Publicité précédente"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all border border-white/20 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Publicité suivante"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all border border-white/20 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Progress Dots */}
        {displayAds.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {displayAds.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 bg-amber-400'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Aller à la publicité ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCarousel;
