import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, Play, CheckCheck, GraduationCap, User, Mail } from 'lucide-react';
import { UserProfile } from '../types';

interface MobileBottomNavbarProps {
  activeTab: 'news' | 'shorts' | 'haac' | 'signaler' | 'academy' | 'about' | 'contact' | 'media-dashboard' | 'admin-dashboard' | 'profile' | 'privacy' | 'terms';
  setActiveTab: (tab: any) => void;
  favoritesCount: number;
  setFavoritesOpen: (open: boolean) => void;
  favoritesOpen: boolean;
  darkTheme: boolean;
  currentUser: UserProfile | null;
}

export default function MobileBottomNavbar({
  activeTab,
  setActiveTab,
  favoritesCount,
  setFavoritesOpen,
  favoritesOpen,
  darkTheme,
  currentUser,
}: MobileBottomNavbarProps) {
  
  // Decide which navigation item is considered "active"
  // Map specific sub-tabs (like dashboards or contact) to the primary bottom bar tabs
  const getActiveSlot = () => {
    if (activeTab === 'news') return 'news';
    if (activeTab === 'shorts') return 'shorts';
    if (activeTab === 'haac' || activeTab === 'signaler') return 'verify';
    if (activeTab === 'academy' && !favoritesOpen) return 'academy';
    if (activeTab === 'profile' || activeTab === 'media-dashboard' || activeTab === 'admin-dashboard' || activeTab === 'contact' || activeTab === 'about' || favoritesOpen) return 'profile';
    return 'news'; // default fallback
  };

  const activeSlot = getActiveSlot();

  const handleTabClick = (slot: 'news' | 'shorts' | 'verify' | 'academy' | 'profile') => {
    setFavoritesOpen(false); // Close favorites overlay when choosing a tab
    if (slot === 'news') setActiveTab('news');
    if (slot === 'shorts') setActiveTab('shorts');
    if (slot === 'verify') setActiveTab('haac');
    if (slot === 'academy') setActiveTab('academy');
    if (slot === 'profile') {
      setActiveTab('profile');
    }
  };

  interface NavItem {
    id: 'news' | 'shorts' | 'verify' | 'academy' | 'profile';
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    {
      id: 'news',
      label: 'Actualités',
      icon: Newspaper,
    },
    {
      id: 'shorts',
      label: 'Shorts TV',
      icon: Play,
    },
    {
      id: 'verify',
      label: 'VÉRIFIER',
      icon: CheckCheck,
    },
    {
      id: 'academy',
      label: 'Cours',
      icon: GraduationCap,
    },
    {
      id: 'profile',
      label: 'Mon compte',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full block xl:hidden select-none">
      <div 
        className={`w-full rounded-t-2xl border-t border-x-0 border-b-0 px-4 pt-2 pb-3.5 flex items-center justify-between gap-1 shadow-2xl backdrop-blur-lg transition-all duration-300 ${
          darkTheme 
            ? 'bg-slate-900/95 border-slate-800/80 shadow-slate-950/60 text-slate-300' 
            : 'bg-white/95 border-gray-150/85 shadow-gray-200/40 text-slate-600'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeSlot === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex-1 py-1.5 flex flex-col items-center gap-1 cursor-pointer outline-none tap-highlight-transparent transition-all duration-300"
            >
              {/* Dynamic sliding pill background (Framer Motion) */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-mobile-pill"
                  className={`absolute inset-0 rounded-xl z-0 ${
                    darkTheme 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'bg-blue-50 text-blue-600'
                  }`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Active top dot indicator (inspired by the 2nd image design) */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator-dot"
                  className="absolute -top-1 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 scale-110' 
                      : 'text-gray-450 dark:text-gray-400 hover:scale-105'
                  }`} 
                />
                
                {/* Numeric Badge for Favorites or alerts */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span 
                className={`text-[9px] font-bold tracking-tight uppercase leading-none z-10 transition-colors duration-300 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
