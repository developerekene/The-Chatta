import React, { useState, useEffect } from 'react';
import { 
  X, Download, Smartphone, Share, PlusSquare, ArrowRight, Check, HelpCircle, Laptop, Settings
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallModal({ isOpen, onClose }: InstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect device type
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Capture the PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app is already running as standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 text-slate-100 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-5 shadow-2xl flex flex-col max-h-[90vh] animate-scaleUp overflow-y-auto scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Install Chatta App
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Visual Panel */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-500/5 mb-4 text-left">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <img
              src="/icon.jpg"
              alt="Chatta Logo"
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chatta Premium Client</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Install Chatta directly on your mobile device as a Progressive Web App (PWA). Launches full-screen without address bars, has native performance, and supports offline handshakes.
            </p>
          </div>
        </div>

        {/* State Conditional Display */}
        {installed ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6" />
            </div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-white">App Installed Successfully!</h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Chatta is running in standalone mode or is already added to your home screen. Launch it from your home screen for the full app experience.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Direct Native Installation Option */}
            {isInstallable && deferredPrompt ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/10 flex flex-col items-center text-center">
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-3">
                  Your browser supports direct automated installation! Click below to download the app installer instantly.
                </p>
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Install Chatta Instantly</span>
                </button>
              </div>
            ) : null}

            {/* Step-by-Step guides by Device Type */}
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>How to Install Manually</span>
              </h5>

              {deviceType === 'ios' && (
                <div className="space-y-3.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    iOS Safari requires manual addition. Follow these quick steps:
                  </p>
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Open Safari Share Menu</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        Tap the <span className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex"><Share className="h-3 w-3" /></span> share button in the browser toolbar.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Add to Home Screen</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        Scroll down the sharing panel and tap <span className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex font-mono text-[8px] font-bold"><PlusSquare className="h-3 w-3 mr-0.5" /> Add to Home Screen</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Confirm App Name</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap <span className="font-bold text-emerald-500">"Add"</span> in the top-right. The Chatta app icon will appear instantly on your phone's home screen!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deviceType === 'android' && (
                <div className="space-y-3.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Android Chrome setup:
                  </p>
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Open Chrome Menu</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the three vertical dots menu icon (<span className="font-bold">⋮</span>) in Chrome's top-right corner.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Install / Add to Home Screen</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Find and tap <span className="font-bold text-emerald-500">"Install App"</span> or <span className="font-bold text-emerald-500">"Add to Home screen"</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Confirm Launch Icon</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Confirm the prompt by clicking "Install" and Chatta will download as a standalone launcher.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deviceType === 'desktop' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    How to install on Chrome, Edge, or Brave:
                  </p>
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <Laptop className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-left text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Browser Install Icon</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Click the small monitor/download icon in the browser address bar (top right) or go to options menu (<span className="font-bold">⋮</span>) and select <span className="font-bold text-emerald-500">"Install Chatta"</span>.
                      </p>
                    </div>
                  </div>

                  {/* Scan QR Code Tip */}
                  <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 text-left">
                    <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                      <span>On your Phone right now?</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Simply copy this browser URL, send it to your phone, and open it in Safari (iOS) or Chrome (Android) to trigger this installer screen on mobile!
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[9px] text-slate-400">
          <span className="font-mono">PWA Version 1.1.0</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Close Installer
          </button>
        </div>
      </div>
    </div>
  );
}
