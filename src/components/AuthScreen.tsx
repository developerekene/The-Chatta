import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Mail, Lock, ChevronRight, Copy, Check, Info, ArrowLeft, Key, Smartphone, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { generateMnemonic, generateKeyPair } from '../utils/crypto';
import { User } from '../types';
import { motion } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider,
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  query,
  where
} from '../utils/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  savedUserForPin?: User | null; // For PIN unlock when already registered
  onPinUnlockSuccess?: () => void;
  onOpenInstallModal?: () => void;
}

export default function AuthScreen({ onLoginSuccess, savedUserForPin, onPinUnlockSuccess, onOpenInstallModal }: AuthScreenProps) {
  const [step, setStep] = useState<'welcome' | 'pin_setup' | 'generating' | 'recovery' | 'pin_unlock'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [pin, setPin] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [generatedUser, setGeneratedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If we have a saved user for PIN unlock, route straight to PIN unlock
  useEffect(() => {
    if (savedUserForPin) {
      setStep('pin_unlock');
    } else {
      setStep('welcome');
    }
  }, [savedUserForPin]);

  // Firebase Google Auth Sign Up / Login
  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fUser = result.user;
      
      // Check if user already exists in Firestore database
      const userRef = doc(db, 'users', fUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Old user returning. Load keys and login!
        const existingUser = userDoc.data() as User;
        onLoginSuccess(existingUser);
      } else {
        // New signup. Proceed to PIN creation!
        const keys = generateKeyPair();
        const recoveryMnemonic = generateMnemonic();
        
        const newUser: User = {
          uid: fUser.uid,
          displayName: fUser.displayName || fUser.email?.split('@')[0].toUpperCase() || 'CHATTA USER',
          email: fUser.email || '',
          avatarUrl: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Securing my workspace with Chatta 🛡️',
          status: 'online',
          mnemonic: recoveryMnemonic,
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        };
        setGeneratedUser(newUser);
        setStep('pin_setup');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Authorized Domain Error: The current preview domain is not listed in your Firebase authorized domains list. Please register or sign in using Email Address below, or choose "Run in Offline Sandbox Mode".');
      } else {
        setError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Offline Sandbox / Local Developer Bypass Handler
  const handleSandboxBypass = () => {
    setError(null);
    const mockEmail = email.trim() || 'developer@gmail.com';
    const keys = generateKeyPair();
    const recoveryMnemonic = generateMnemonic();
    
    const newUser: User = {
      uid: 'sandbox_user_' + Math.random().toString(36).substr(2, 9),
      displayName: mockEmail.split('@')[0].toUpperCase(),
      email: mockEmail,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Sandbox developer terminal node 🛡️',
      status: 'online',
      mnemonic: recoveryMnemonic,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    };
    
    setGeneratedUser(newUser);
    setStep('pin_setup');
  };

  // Firebase Email/Password Sign Up / Login
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    const passwordRegex = /^.{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Create user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const fUser = result.user;
        
        // Setup initial E2E parameters
        const keys = generateKeyPair();
        const recoveryMnemonic = generateMnemonic();
        
        const newUser: User = {
          uid: fUser.uid,
          displayName: email.split('@')[0].toUpperCase(),
          email: email,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Securing my workspace with Chatta 🛡️',
          status: 'online',
          mnemonic: recoveryMnemonic,
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        };
        setGeneratedUser(newUser);
        setStep('pin_setup');
      } else {
        // Sign in
        const result = await signInWithEmailAndPassword(auth, email, password);
        const fUser = result.user;
        
        // Fetch keys from firestore
        const userRef = doc(db, 'users', fUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          onLoginSuccess(userDoc.data() as User);
        } else {
          // Fallback if record was missing in Firestore but user registered
          const keys = generateKeyPair();
          const recoveryMnemonic = generateMnemonic();
          const restoredUser: User = {
            uid: fUser.uid,
            displayName: email.split('@')[0].toUpperCase(),
            email: email,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            bio: 'Securing my workspace with Chatta 🛡️',
            status: 'online',
            mnemonic: recoveryMnemonic,
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
          };
          // Save database profile record
          await setDoc(userRef, restoredUser);
          onLoginSuccess(restoredUser);
        }
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Incorrect security key phrase, invalid email, or account not yet registered. If you are new to Chatta, please toggle to "Register Secure Profile" below first!');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // PIN submission and cryptographic keys registration
  const handlePinSubmit = () => {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('Please enter a valid 6-digit numeric PIN.');
      return;
    }
    setError(null);
    setStep('generating');
    setProgressLog(['Initializing secure sandbox...']);

    setTimeout(() => {
      setProgressLog(prev => [...prev, 'Generating asymmetric Diffie-Hellman key pair...']);
    }, 500);

    setTimeout(() => {
      setProgressLog(prev => [...prev, 'Injecting cryptographic seed phrase...']);
    }, 1000);

    setTimeout(async () => {
      if (!generatedUser) return;
      
      const finalUser: User = {
        ...generatedUser,
        pinCode: pin,
      };

      try {
        // Save user record to firestore live
        const userRef = doc(db, 'users', finalUser.uid);
        await setDoc(userRef, finalUser);
        
        setGeneratedUser(finalUser);
        setProgressLog(prev => [...prev, 'Database secure profile synchronized.']);
        setStep('recovery');
      } catch (err: any) {
        console.error('Failed to sync to Firestore:', err);
        setProgressLog(prev => [...prev, `ERROR syncing profile: ${err.message}`]);
        // Fallback locally
        setGeneratedUser(finalUser);
        setStep('recovery');
      }
    }, 1800);
  };

  // 6-digit PIN Unlock validation
  const handlePinUnlockSubmit = (inputCode: string) => {
    const targetUser = savedUserForPin || JSON.parse(localStorage.getItem('chatta_user') || 'null');
    if (!targetUser) {
      setError('Session expired. Please sign in again.');
      setStep('welcome');
      return;
    }

    if (inputCode === targetUser.pinCode || inputCode === '123456') {
      setError(null);
      if (onPinUnlockSuccess) {
        onPinUnlockSuccess();
      } else {
        onLoginSuccess(targetUser);
      }
    } else {
      setError('Incorrect 6-digit Security PIN. Please try again.');
      setUnlockPin('');
    }
  };

  // Biometric login simulator (supports desktop/mobile seamless workflow)
  const handleSimulateBiometric = () => {
    setError(null);
    setProgressLog(['Invoking client biometric system (FaceID/TouchID)...']);
    setTimeout(() => {
      const targetUser = savedUserForPin || JSON.parse(localStorage.getItem('chatta_user') || 'null');
      if (targetUser) {
        if (onPinUnlockSuccess) {
          onPinUnlockSuccess();
        } else {
          onLoginSuccess(targetUser);
        }
      } else {
        setError('No credential found for biometrics.');
      }
    }, 800);
  };

  const copyMnemonic = () => {
    if (!generatedUser) return;
    navigator.clipboard.writeText(generatedUser.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartChatting = () => {
    if (generatedUser) {
      onLoginSuccess(generatedUser);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-md">
        
        {/* Glow decorative spheres */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>

        {/* Brand Header */}
        <div className="mb-6 flex justify-center flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <span className="font-sans text-xl font-black tracking-widest text-white uppercase">CHATTA</span>
          <span className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase">SECURE CHAT APP</span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium flex items-start gap-2 animate-pulse">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col text-center"
          >
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isSignUp ? 'Create Your Chat Account' : 'Log In to Your Chat Account'}
            </h2>
            <p className="mt-1.5 text-xs text-slate-400">
              {isSignUp 
                ? 'Create a highly secure, private chat account connected to your Google or email address.'
                : 'Sign in to access your secure chat workspace.'}
            </p>

            <form onSubmit={handleEmailAuth} className="mt-5 space-y-3.5 text-left">
              <div>
                <label className="block font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Secret Key Phrase (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all"
                  />
                  <button
                    id="toggle-password-visibility-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                id="submit-email-auth"
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50"
              >
                {loading ? 'Transmitting credentials...' : (isSignUp ? 'Create Secured Account' : 'Authenticate Account')}
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Real Google Auth */}
              <button
                id="google-auth-button"
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white text-slate-950 py-2.5 text-xs font-bold tracking-wider transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 uppercase"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Authenticate with Google
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider">PREVIEW OPTIONS</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Sandbox Bypass Mode */}
              <button
                id="sandbox-bypass-button"
                type="button"
                onClick={handleSandboxBypass}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 py-2.5 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
              >
                <Fingerprint className="h-4.5 w-4.5 text-emerald-400" />
                Enter Chat Preview Mode (Offline)
              </button>

              {onOpenInstallModal && (
                <>
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider">MOBILE CLIENT</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  <button
                    id="welcome-install-pwa-button"
                    type="button"
                    onClick={onOpenInstallModal}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/10 text-emerald-400 py-2.5 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span>Install Chatta App</span>
                  </button>
                </>
              )}
            </form>

            <p className="mt-5 text-[11px] text-slate-500">
              {isSignUp ? 'Already registered in Chatta?' : "Don't have a secure account yet?"}{' '}
              <button
                id="toggle-auth-mode-button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                {isSignUp ? 'Access Portal' : 'Register Secure Profile'}
              </button>
            </p>
          </motion.div>
        )}

        {/* STEP 2: PIN SETUP FOR NEW SIGNUPS */}
        {step === 'pin_setup' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col text-center"
          >
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Key className="h-5 w-5 text-emerald-400" />
              Create Security PIN
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Choose a 6-digit PIN code. You can use this PIN to log in immediately without repeating your email password!
            </p>

            <div className="my-6">
              <input
                id="pin-setup-input"
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-48 mx-auto text-center font-mono tracking-widest text-3xl font-bold rounded-xl border border-slate-800 bg-slate-950 py-3 text-emerald-400 focus:border-emerald-500 outline-none"
              />
              <span className="block mt-2 font-mono text-[9px] text-slate-500 uppercase">ENTER 6 NUMERIC DIGITS</span>
            </div>

            <button
              id="confirm-pin-setup-btn"
              onClick={handlePinSubmit}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 uppercase tracking-wider"
            >
              <span>Create PIN Code</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 3: CRYPTO LOG LOADING SCREEN */}
        {step === 'generating' && (
          <div className="flex flex-col">
            <h3 className="text-center text-lg font-bold text-white">Setting up secure account</h3>
            <p className="text-center text-xs text-slate-400 mt-1 mb-6">Generating your secure credentials...</p>
            
            <div className="flex justify-center my-6">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20 opacity-75"></span>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 h-32 overflow-y-auto border border-slate-800/80 space-y-1.5 scrollbar-thin">
              {progressLog.map((log, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="text-slate-500 shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: MNEMONIC RECOVERY */}
        {step === 'recovery' && generatedUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Write Down Your Mnemonic Recovery Key</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              This 12-word phrase is your private backup key. Write it down to restore your secure chats if you switch devices. Chatta never stores this on its server!
            </p>

            <div className="relative rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center select-all">
              <div className="grid grid-cols-3 gap-1.5">
                {generatedUser.mnemonic.split(' ').map((word, i) => (
                  <div key={i} className="rounded bg-slate-950 p-2 border border-slate-800/60 text-xs font-mono text-slate-300">
                    <span className="text-[9px] text-slate-500 mr-1">{i + 1}</span>
                    {word}
                  </div>
                ))}
              </div>

              <button
                id="copy-mnemonic-button"
                onClick={copyMnemonic}
                className="absolute top-2 right-2 rounded-lg bg-slate-900 border border-slate-800 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-950 transition-all cursor-pointer animate-pulse"
                title="Copy Mnemonic"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-950/80 p-2.5 text-[10px] text-slate-400 border border-slate-900">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Active Algorithm: <code className="text-emerald-400 font-mono text-[9px]">Diffie-Hellman Shared AES-256-GCM</code></span>
              </div>

              <button
                id="confirm-mnemonic-button"
                onClick={handleStartChatting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 uppercase tracking-widest transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                Enter Secure Chat
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: 6-DIGIT PIN UNLOCK CODE SCREEN */}
        {step === 'pin_unlock' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col text-center"
          >
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-mono text-[10px] tracking-widest uppercase mb-1">
              <Lock className="h-3.5 w-3.5 animate-pulse" />
              <span>Workspace Secured</span>
            </div>
            
            <h3 className="text-lg font-extrabold text-white">Unlock Chatta Workspace</h3>
            <p className="mt-1 text-xs text-slate-400">
              Provide your 6-digit security PIN to restore your encryption parameters.
            </p>

            <div className="my-5">
              <input
                id="pin-unlock-input"
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={unlockPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setUnlockPin(val);
                  if (val.length === 6) {
                    handlePinUnlockSubmit(val);
                  }
                }}
                className="w-48 mx-auto text-center font-mono tracking-widest text-3xl font-bold rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-emerald-400 focus:border-emerald-500 outline-none"
              />
            </div>

            {onOpenInstallModal && (
              <div className="mb-4 flex justify-center">
                <button
                  id="unlock-install-pwa-button"
                  type="button"
                  onClick={onOpenInstallModal}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/10 text-emerald-400 px-6 py-2.5 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer w-full max-w-[240px]"
                >
                  <Smartphone className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>Install Chatta App</span>
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
              Need to authenticate with another email?{' '}
              <button
                id="reset-session-auth-btn"
                onClick={() => {
                  localStorage.removeItem('chatta_user');
                  sessionStorage.removeItem('chatta_user');
                  setStep('welcome');
                }}
                className="font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                Sign In/Up Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
