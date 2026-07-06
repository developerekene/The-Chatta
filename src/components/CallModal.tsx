import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Shield, Users, Clock, Radio, Play } from 'lucide-react';

interface CallModalProps {
  isVideo: boolean;
  partnerName: string;
  partnerAvatar: string;
  onClose: () => void;
}

export default function CallModal({ isVideo, partnerName, partnerAvatar, onClose }: CallModalProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulated Ringing to Connected transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Connected Timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Request camera and microphone access if video call is active
  useEffect(() => {
    if (isVideo && callState === 'connected' && !isCamOff) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or running inside iframe constraints:', err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideo, callState, isCamOff]);

  const handleToggleCam = () => {
    const newVal = !isCamOff;
    setIsCamOff(newVal);
    if (newVal && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-white p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl h-[85vh] flex flex-col justify-between p-6">
        
        {/* Top Encryption Seal */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-wider self-center animate-pulse">
          <Shield className="h-3.5 w-3.5" />
          <span>E2E ENCRYPTED CONNECTIVITY</span>
        </div>

        {/* Middle Screen Section */}
        <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
          
          {/* Ringing / Incoming screen */}
          {callState === 'ringing' ? (
            <div className="flex flex-col items-center text-center">
              {/* Pulsing Avatar ripples */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-emerald-500/10 animate-pulse" />
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="relative h-28 w-28 rounded-full object-cover border-4 border-slate-800 shadow-lg"
                />
              </div>
              <h3 className="text-lg font-black tracking-tight">{partnerName}</h3>
              <p className="text-xs text-emerald-400 font-mono tracking-widest mt-1.5 animate-pulse uppercase">
                SECURE OUTGOING RINGING...
              </p>
            </div>
          ) : (
            // Connected Call screen
            <div className="w-full h-full flex flex-col justify-between">
              
              {/* Main caller view */}
              <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden relative flex items-center justify-center shadow-inner">
                {isVideo && !isCamOff ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 backdrop-blur-xs">
                      <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                      Your Camera Feed
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 animate-fadeIn">
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      className="h-24 w-24 rounded-full object-cover border-2 border-slate-700 mb-4 animate-pulse shadow-md"
                    />
                    <h4 className="text-base font-bold text-white">{partnerName}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono uppercase tracking-widest">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Secure Audio Link Established
                    </p>
                  </div>
                )}

                {/* Micro Partner floating window for video calls */}
                {isVideo && (
                  <div className="absolute top-3 right-3 h-24 w-20 rounded-xl bg-slate-900 border border-slate-700 shadow-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Connected details */}
              <div className="text-center mt-3">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-mono">
                  <span>Connection Active</span>
                  <span className="text-emerald-400 font-bold">{formatTime(duration)}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Actions */}
        <div className="flex items-center justify-center gap-6 py-2">
          {/* Mute Mic Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-full p-3.5 transition-all duration-150 cursor-pointer ${
              isMuted
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-red-600 p-4 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          {/* Camera Toggle (for video calls only) */}
          {isVideo && (
            <button
              type="button"
              onClick={handleToggleCam}
              className={`rounded-full p-3.5 transition-all duration-150 cursor-pointer ${
                isCamOff
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isCamOff ? "Turn Video On" : "Turn Video Off"}
            >
              {isCamOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}

          {/* Speaker Switch (for audio calls) */}
          {!isVideo && (
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`rounded-full p-3.5 transition-all duration-150 cursor-pointer ${
                !isSpeakerOn
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
