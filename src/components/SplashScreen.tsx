import React, { useEffect, useState } from 'react';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-radial from-slate-900 to-black text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        {/* Animated Brand Logo */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/20">
          <MessageSquare id="logo-chat-icon" className="h-12 w-12 text-white" />
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-2 border-emerald-500"
          >
            <ShieldCheck id="logo-shield-icon" className="h-4 w-4 text-emerald-400" />
          </motion.div>
        </div>

        {/* Brand Name */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-sans text-4xl font-black tracking-wider text-white"
        >
          Chatta
        </motion.h1>

        {/* Brand Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-2 font-mono text-xs tracking-widest text-emerald-400 uppercase"
        >
          End-to-End Encrypted
        </motion.p>
      </motion.div>

      {/* Loading Progress Bar */}
      <div className="absolute bottom-16 w-48 overflow-hidden rounded-full h-1 bg-slate-800">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="h-full w-2/3 rounded-full bg-emerald-500"
        />
      </div>

      {/* Footer credits */}
      <div className="absolute bottom-6 font-mono text-[10px] text-slate-500 tracking-wider">
        {new Date().getFullYear()} CHATTA | All rights Reserved
      </div>
    </div>
  );
}
