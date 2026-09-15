import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

const APK_DOWNLOAD_URL = 'https://github.com/Mohammadkawaf/VELORIA-Android/releases/latest/download/VELORIA.apk';
const STORAGE_KEY = 'veloria_android_banner_dismissed';

export const AndroidAppBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.navigator) return;

      // Check if user has previously dismissed the banner
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      if (isDismissed) return;

      const ua = window.navigator.userAgent || '';

      // 1. If User-Agent contains "VELORIA_APP", user is inside VELORIA app -> DO NOT SHOW
      if (/VELORIA_APP/i.test(ua)) {
        return;
      }

      // 2. If it's a standard Android WebView -> DO NOT SHOW
      const isWebView = /; wv\b|Version\/4\.0.*Chrome\/[.0-9]+ Mobile/i.test(ua);
      if (isWebView) {
        return;
      }

      // 3. Must be Android
      const isAndroid = /Android/i.test(ua);
      if (!isAndroid) {
        return;
      }

      // 4. Must NOT be iOS (iPhone/iPad/iPod)
      const isIOS = /iPhone|iPad|iPod/i.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      if (isIOS) {
        return;
      }

      // Display banner for Android regular browser users
      setIsVisible(true);
    } catch (e) {
      console.warn('Error checking device environment for Android banner:', e);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save banner dismissal state to localStorage:', e);
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      id="android-app-banner"
      dir="rtl"
      aria-label="تنبيه تحميل تطبيق أندرويد"
      className="w-full bg-slate-900 text-slate-100 border-b border-amber-500/30 px-3 py-2 shadow-xs transition-all animate-in fade-in slide-in-from-top duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Right side: Icon & short message */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-100 truncate">
            تطبيق VELORIA متاح الآن
          </span>
        </div>

        {/* Left side: Download button & dismiss button */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            id="android-app-download-btn"
            href={APK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-lg shadow-2xs transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل التطبيق</span>
          </a>

          <button
            id="android-app-dismiss-btn"
            type="button"
            onClick={handleDismiss}
            aria-label="إغلاق التنبيه"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AndroidAppBanner;
