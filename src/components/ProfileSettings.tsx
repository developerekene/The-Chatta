import React, { useState, useEffect } from 'react';
import { 
  X, User, MessageSquare, Copy, Check, Save, Download, Upload, 
  Trash2, ShieldCheck, RefreshCw, Key, HelpCircle, Phone, Briefcase, 
  Building, MapPin, Calendar, Users, Languages, Volume2, ShieldAlert, 
  Monitor, Sparkles, Activity
} from 'lucide-react';
import { User as UserType, Message, Group, ChatBackup } from '../types';

interface ProfileSettingsProps {
  user: UserType;
  messages: Message[];
  groups: Group[];
  onUpdateUser: (updatedUser: UserType) => void;
  onImportBackup: (backup: ChatBackup) => void;
  onClearHistory: () => void;
  onClose: () => void;
  onOpenPlanModal?: () => void;
}

export default function ProfileSettings({
  user,
  messages,
  groups,
  onUpdateUser,
  onImportBackup,
  onClearHistory,
  onClose,
  onOpenPlanModal,
}: ProfileSettingsProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'settings'>('profile');

  // User Profile States
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [status, setStatus] = useState<UserType['status']>(user.status);
  
  // New profile fields
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [middleName, setMiddleName] = useState(user.middleName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [organization, setOrganization] = useState(user.organization || '');
  const [location, setLocation] = useState(user.location || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [gender, setGender] = useState(user.gender || '');
  const [language, setLanguage] = useState(user.language || 'English');

  // Security Copy & Backup States
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // 5 Settings Features States
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('chatta_sound_enabled') !== 'false';
  });
  const [lockDelay, setLockDelay] = useState(() => {
    return localStorage.getItem('chatta_lock_delay') || '120';
  });
  const [verifyDecryption, setVerifyDecryption] = useState(() => {
    return localStorage.getItem('chatta_verify_decryption') === 'true';
  });
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(() => {
    return localStorage.getItem('chatta_keyboard_shortcuts') !== 'false';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('chatta_compact_mode') === 'true';
  });

  // Browser Status Automatic Decider Effect
  useEffect(() => {
    const handleStatusUpdate = () => {
      let currentStatus: UserType['status'] = 'online';
      if (!navigator.onLine) {
        currentStatus = 'offline';
      } else if (document.hidden) {
        currentStatus = 'away';
      } else {
        currentStatus = 'online';
      }
      setStatus(currentStatus);
      
      // Auto-update firestore with the automatic status
      onUpdateUser({
        ...user,
        status: currentStatus,
      });
    };

    // Run initial detection
    handleStatusUpdate();

    // Listeners for browser events
    window.addEventListener('online', handleStatusUpdate);
    window.addEventListener('offline', handleStatusUpdate);
    document.addEventListener('visibilitychange', handleStatusUpdate);

    return () => {
      window.removeEventListener('online', handleStatusUpdate);
      window.removeEventListener('offline', handleStatusUpdate);
      document.removeEventListener('visibilitychange', handleStatusUpdate);
    };
  }, []);

  const handleSaveProfile = () => {
    onUpdateUser({
      ...user,
      displayName,
      bio,
      status,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      jobTitle,
      organization,
      location,
      dateOfBirth,
      gender,
      language,
    });
    alert('User profile identity saved successfully!');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('chatta_sound_enabled', String(soundEnabled));
    localStorage.setItem('chatta_lock_delay', lockDelay);
    localStorage.setItem('chatta_verify_decryption', String(verifyDecryption));
    localStorage.setItem('chatta_keyboard_shortcuts', String(keyboardShortcuts));
    localStorage.setItem('chatta_compact_mode', String(compactMode));
    alert('Preferences and settings updated successfully!');
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(user.mnemonic);
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  const copyPublicKeys = () => {
    navigator.clipboard.writeText(`PUBLIC KEY:\n${user.publicKey}\n\nPRIVATE KEY (KEEP SECRET):\n${user.privateKey}`);
    setCopiedKeys(true);
    setTimeout(() => setCopiedKeys(false), 2000);
  };

  // Export full backup JSON
  const handleExportBackup = () => {
    const backup: ChatBackup = {
      version: 'CHATTA_MVP_1.0',
      createdAt: new Date().toISOString(),
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      },
      messages,
      groups,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chatta_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export TXT chat transcript
  const handleExportTranscript = () => {
    if (messages.length === 0) {
      alert('No messages found to export.');
      return;
    }

    let transcript = `CHATTA SECURE CHAT TRANSCRIPT\n`;
    transcript += `Exported: ${new Date().toLocaleString()}\n`;
    transcript += `User: ${user.displayName} (${user.email})\n`;
    transcript += `==========================================\n\n`;

    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleString();
      const sender = msg.senderId === user.uid ? 'Me' : msg.senderId.replace('contact_', '').toUpperCase();
      transcript += `[${date}] ${sender}: ${msg.type === 'text' ? msg.text : `[Media Attachment: ${msg.type}]`}\n`;
    });

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chatta_transcript_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download client diagnostic report (Extra setting feature)
  const handleDownloadDiagnostics = () => {
    const report = {
      appName: 'Chatta Client Terminal',
      environment: 'E2EE Browser Sandbox',
      userAgent: navigator.userAgent,
      onlineStatus: navigator.onLine ? 'Connected' : 'Disconnected',
      timeUTC: new Date().toUTCString(),
      firebaseStatus: 'Configured & Online',
      encryptionAlgorithm: 'Commutative DH Agreement + safe XOR UTF-8',
      keyHashes: {
        publicKeyHash: user.publicKey ? btoa(user.publicKey).substring(0, 12) : 'none',
      }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chatta_diagnostics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import backup JSON
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version && json.user && Array.isArray(json.messages)) {
          onImportBackup(json);
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid Chatta backup file format.');
        }
      } catch (err) {
        setImportError('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 text-slate-100 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Settings & Private Backup</h3>
          </div>
          <button
            id="close-profile-settings"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 mb-5 shrink-0 text-xs">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'profile' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            User Profile
          </button>
          <button
            id="tab-security-btn"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'security' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Security & Keys
          </button>
          <button
            id="tab-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'settings' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Chatta Settings
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          
          {/* TAB 1: USER PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                <Sparkles className="h-4 w-4" />
                <span>Personal Identity Fields</span>
              </div>

              {/* Status indicator (browser decided) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    status === 'online' ? 'bg-emerald-500 animate-pulse' :
                    status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Browser Presence: {status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Auto Detected by Browser State
                </span>
              </div>

              {/* Premium Plan Indicator */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  <div className="text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Account Tier: {user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'FREE'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {user.subscriptionPlan 
                        ? 'Unlimited HD secure calls & video streams unlocked!' 
                        : 'Upgrade to unlock voice and video calling features.'}
                    </span>
                  </div>
                </div>
                {onOpenPlanModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPlanModal();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 cursor-pointer transition-all shrink-0"
                  >
                    {user.subscriptionPlan ? 'Change Plan' : 'Upgrade Plan'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    id="profile-first-name-input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Middle Name
                  </label>
                  <input
                    id="profile-middle-name-input"
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    id="profile-last-name-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Display Name (Handle)
                  </label>
                  <input
                    id="profile-display-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="profile-phone-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Job Title / Role
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="profile-job-input"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Senior Security Engineer"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Organization / Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="profile-organization-input"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Chatta Labs Ltd."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Location / Country
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="profile-location-input"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="profile-dob-input"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Gender Identity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      id="profile-gender-input"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Declined">Decline to State</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      id="profile-language-input"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 appearance-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Español</option>
                      <option value="French">Français</option>
                      <option value="German">Deutsch</option>
                      <option value="Chinese">中文</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Bio / Status Line
                  </label>
                  <input
                    id="profile-bio-input"
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                id="save-profile-btn"
                onClick={handleSaveProfile}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Identity</span>
              </button>
            </div>
          )}

          {/* TAB 2: SECURITY, RECOVERY & BACKUPS */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
                <ShieldCheck className="h-4 w-4" />
                <span>Cryptographic Keypair and Backups</span>
              </div>

              {/* Mnemonic view */}
              <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3.5">
                <span className="font-mono text-[10px] font-bold text-amber-500 uppercase block mb-1">
                  12-WORD MNEMONIC PHRASE (KEEP PRIVATE)
                </span>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-h-16 overflow-y-auto scrollbar-thin select-all">
                  {user.mnemonic}
                </p>
                
                <button
                  id="profile-copy-mnemonic-btn"
                  onClick={copyMnemonic}
                  className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer"
                >
                  {copiedMnemonic ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedMnemonic ? 'Phrase copied!' : 'Copy Seed Phrase'}</span>
                </button>
              </div>

              {/* Public/private Keys BLURRED */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  ASYMMETRIC CHATTA KEYS (SENSITIVE DATA BLURRED)
                </span>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  Keys are blurred to prevent over-the-shoulder leaks. Use the copy button to retrieve them safely.
                </p>
                <div className="flex flex-col gap-1.5 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                    <strong className="text-slate-700 dark:text-slate-300">Public:</strong> 
                    <span className="blur-xs select-none hover:blur-none transition-all duration-300 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                      {user.publicKey}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                    <strong className="text-slate-700 dark:text-slate-300">Private:</strong> 
                    <span className="blur-xs select-none hover:blur-none transition-all duration-300 font-mono text-[9px] text-rose-500 dark:text-rose-400">
                      {user.privateKey}
                    </span>
                  </div>
                </div>

                <button
                  id="profile-copy-keys-btn"
                  onClick={copyPublicKeys}
                  className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer"
                >
                  {copiedKeys ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKeys ? 'Keys copied!' : 'Copy Client Keypair'}</span>
                </button>
              </div>

              {/* Portability / Backups */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-900 dark:text-white mb-1">Export Full History</h5>
                    <p className="text-[9px] text-slate-500 leading-relaxed mb-3">
                      Complete E2EE .JSON file of chats, groups, and parameters.
                    </p>
                  </div>
                  <button
                    id="backup-export-btn"
                    onClick={handleExportBackup}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 py-1.5 text-[10px] font-bold text-emerald-500 transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .JSON</span>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-900 dark:text-white mb-1">Export Plaintext Logs</h5>
                    <p className="text-[9px] text-slate-500 leading-relaxed mb-3">
                      A cleartext .TXT file of current logs for external storage.
                    </p>
                  </div>
                  <button
                    id="backup-export-txt-btn"
                    onClick={handleExportTranscript}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 py-1.5 text-[10px] font-bold text-emerald-500 transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .TXT</span>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-900 dark:text-white mb-1">Restore History</h5>
                    <p className="text-[9px] text-slate-500 leading-relaxed mb-3">
                      Upload and restore a Chatta .JSON chat backup file.
                    </p>
                  </div>
                  <label className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 py-1.5 text-[10px] font-bold text-emerald-500 transition-all cursor-pointer text-center">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload .JSON</span>
                    <input
                      id="backup-uploader"
                      type="file"
                      accept=".json"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {importSuccess && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center text-xs font-semibold text-emerald-500">
                  ✓ Backup restored successfully. Message state updated!
                </div>
              )}
              {importError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-center text-xs font-semibold text-rose-500">
                  Error: {importError}
                </div>
              )}

              {/* Destructive Clear */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                <span className="text-slate-500">Need to wipe local storage data?</span>
                <button
                  id="clear-data-btn"
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Chat History</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CHATTA SETTINGS (5 NEW FEATURES) */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-sky-500">
                <Activity className="h-4 w-4" />
                <span>Chatta Configuration & Preferences</span>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
                
                {/* 1. Push Notification Toggles */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <Volume2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Sound & Alerts</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Play auditory alert tone when a client-side decrypted message is received.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="sound-alert-toggle"
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* 2. Auto-Lock Timeout Option */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Lock Idle Security</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Specify inactivity timer in seconds before locking current workspace terminal.
                      </p>
                    </div>
                  </div>
                  <select
                    id="lock-delay-select"
                    value={lockDelay}
                    onChange={(e) => setLockDelay(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-1.5 px-2.5 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="30">30 Seconds</option>
                    <option value="60">60 Seconds</option>
                    <option value="120">2 Minutes</option>
                    <option value="300">5 Minutes</option>
                    <option value="999999">Never Lock</option>
                  </select>
                </div>

                {/* 3. Verification Badges */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">E2EE Verification Badges</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Add a verification indicator badge beside successful on-the-fly decrypted texts.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="verify-badge-toggle"
                      type="checkbox"
                      checked={verifyDecryption}
                      onChange={(e) => setVerifyDecryption(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* 4. Keyboard Shortcuts */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-150 dark:border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <Key className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Enable <kbd className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-[9px]">Enter</kbd> to dispatch messages, and <kbd className="bg-slate-200 dark:bg-slate-900 px-1 rounded text-[9px]">Esc</kbd> to deselect chat rooms.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="shortcuts-toggle"
                      type="checkbox"
                      checked={keyboardShortcuts}
                      onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* 5. Compact Layout Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Compact List Theme</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Render a high-density, compact view of sidebar channels to maximize room space.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="compact-toggle"
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

              </div>

              {/* Extra action: Download Diagnostics */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <button
                  id="diagnostics-btn"
                  onClick={handleDownloadDiagnostics}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 py-2 px-3 text-xs font-bold text-sky-500 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Download Client Diagnostics</span>
                </button>

                <button
                  id="save-settings-btn"
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 py-2 px-5 text-xs font-bold text-white hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
