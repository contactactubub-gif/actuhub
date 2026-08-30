import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, BellOff, Trash2, CheckCircle2, Newspaper, ShieldAlert, Clock, Circle
} from 'lucide-react';
import { AppNotification } from '../types';
import { ConfirmationModal, ConfirmationType } from './ConfirmationModal';

interface NotificationsDropdownProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  onNotificationClick: (notif: AppNotification) => void;
  darkTheme: boolean;
}

export default function NotificationsDropdown({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  onNotificationClick,
  darkTheme
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type?: ConfirmationType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (options: {
    title: string;
    message: string;
    type?: ConfirmationType;
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      onConfirm: () => {
        options.onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 600);
      
      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHrs < 24) return `Il y a ${diffHrs} h`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch (e) {
      return "Récemment";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="trigger-notifications-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all relative cursor-pointer"
        title="Notifications locales"
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'animate-swing text-blue-600 dark:text-blue-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={`fixed sm:absolute top-16 sm:top-auto left-4 sm:left-auto right-4 sm:right-0 mt-0 sm:mt-2.5 w-[calc(100vw-32px)] sm:w-96 max-h-[calc(100vh-140px)] sm:max-h-[500px] rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden animate-slide-down ${
            darkTheme 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/50' 
              : 'bg-white border-gray-150 text-slate-800 shadow-gray-200/50'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            darkTheme ? 'bg-slate-950/40 border-slate-800' : 'bg-gray-50/70 border-gray-150'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider font-mono">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerConfirm({
                      type: 'edit',
                      title: "Marquer toutes les notifications comme lues ?",
                      message: "Voulez-vous marquer la totalité de vos notifications comme lues ?",
                      confirmText: "Tout marquer comme lu",
                      onConfirm: onMarkAllAsRead
                    });
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Tout marquer comme lu"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerConfirm({
                      type: 'delete',
                      title: "Effacer toutes les notifications ?",
                      message: "Voulez-vous vraiment supprimer définitivement toutes vos notifications ?",
                      confirmText: "Tout effacer",
                      onConfirm: onClearAll
                    });
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Tout effacer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60 max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <BellOff className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-xs font-bold uppercase tracking-wider font-mono">Aucune notification</p>
                <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-600">Vous serez alerté ici en direct pour les nouveaux signalements et actualités.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isFakeNews = notif.type === 'fake_news';
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onNotificationClick(notif);
                      setIsOpen(false);
                    }}
                    className={`p-3.5 flex gap-3 cursor-pointer transition-all ${
                      !notif.read 
                        ? darkTheme ? 'bg-blue-950/15 hover:bg-blue-950/30' : 'bg-blue-50/45 hover:bg-blue-50/75'
                        : darkTheme ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Icon Column */}
                    <div className="shrink-0 mt-0.5">
                      {isFakeNews ? (
                        <div className={`p-2 rounded-xl ${
                          notif.level === 'critique' 
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' 
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          <ShieldAlert className="w-4.5 h-4.5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          <Newspaper className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-extrabold truncate leading-tight ${
                          !notif.read 
                            ? 'text-slate-900 dark:text-white' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                        !notif.read 
                          ? 'text-slate-700 dark:text-slate-200' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1 text-[9px] font-bold font-mono text-gray-400 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(notif.timestamp)}</span>
                        {isFakeNews && (
                          <span className={`px-1.5 py-0.2 rounded-sm text-[8px] uppercase font-black tracking-widest ${
                            notif.level === 'critique'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            Imp: {notif.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Notifications */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
