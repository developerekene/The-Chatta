import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, Key, ToggleLeft, ToggleRight, Radio, ShieldAlert } from 'lucide-react';
import { Contact, Group, User, CryptoLog } from '../types';
import { getCryptoLogs, clearCryptoLogs, deriveSharedKey } from '../utils/crypto';

interface EncryptionDemoPanelProps {
  user: User;
  activeChat: Contact | Group | null;
  isGroup: boolean;
  onClose: () => void;
  ciphertextViewMode: boolean;
  onToggleCiphertextViewMode: () => void;
}

export default function EncryptionDemoPanel({
  user,
  activeChat,
  isGroup,
  onClose,
  ciphertextViewMode,
  onToggleCiphertextViewMode,
}: EncryptionDemoPanelProps) {
  const [logs, setLogs] = useState<CryptoLog[]>(getCryptoLogs());

  const handleRefresh = () => {
    setLogs(getCryptoLogs());
  };

  const handleClear = () => {
    clearCryptoLogs();
    setLogs([]);
  };

  // Determine key exchange info
  let myPublicKey = user.publicKey;
  let theirPublicKey = 'N/A';
  let derivedSymmetricKey = 'shared_group_key';

  if (activeChat) {
    if (isGroup) {
      theirPublicKey = 'SHARED_GROUP_DH_SIGNATURE';
      derivedSymmetricKey = 'shared_group_key_aes256';
    } else {
      const contact = activeChat as Contact;
      theirPublicKey = contact.publicKey;
      derivedSymmetricKey = deriveSharedKey(user.privateKey, contact.publicKey);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-4 text-slate-100 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">Secure Connection Details</h3>
          </div>
          <button
            id="close-crypto-logs"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          
          {/* Global Mode Controller */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  RAW CIPHERTEXT VIEW MODE
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                  Toggle this to inspect the actual raw, scrambled base64 payloads transmitted over our websocket simulation.
                </p>
              </div>

              <button
                id="toggle-ciphertext-view-mode"
                onClick={onToggleCiphertextViewMode}
                className="cursor-pointer transition-transform duration-200 active:scale-95"
              >
                {ciphertextViewMode ? (
                  <ToggleRight className="h-10 w-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Current Keys Diagram */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <Key className="h-4 w-4 text-emerald-500" />
              <span>Diffie-Hellman Parameter Agreement</span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">
              <div className="flex justify-between gap-2">
                <span>My Client Private Key:</span>
                <span className="text-emerald-500 font-bold truncate max-w-[180px]">{user.privateKey}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Receiver Public Key:</span>
                <span className="text-sky-500 font-bold truncate max-w-[180px]">{theirPublicKey}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1 pt-1 flex justify-between gap-2 font-bold text-slate-800 dark:text-slate-200">
                <span>Derived AES Secret:</span>
                <span className="text-amber-500 truncate max-w-[180px]">{derivedSymmetricKey}</span>
              </div>
            </div>
          </div>

          {/* Real-time Crypto Action Logs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                Live Cryptographic Logs
              </span>
              <div className="flex gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                <button
                  id="refresh-crypto-logs-btn"
                  onClick={handleRefresh}
                  className="text-emerald-500 hover:underline cursor-pointer"
                >
                  Refresh
                </button>
                <span className="text-slate-400">|</span>
                <button
                  id="clear-crypto-logs-btn"
                  onClick={handleClear}
                  className="text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Terminal View */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 h-52 overflow-y-auto space-y-3 font-mono text-[11px] text-emerald-400 scrollbar-thin">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-amber-500 uppercase">{log.type}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-bold mt-0.5">
                      Symmetric Key: <code className="text-amber-400">{log.keyUsed}</code>
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 text-slate-400">
                      <div>Plain: <span className="text-emerald-300 select-all">{log.plaintext || 'N/A'}</span></div>
                      <div className="truncate">Cipher: <span className="text-rose-400 select-all">{log.ciphertext}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center py-8">
                  No cryptographic operations logged yet.<br />Send or receive messages to watch logs.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center gap-1.5 text-[10px] text-slate-500 shrink-0">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Local client utilizes standard symmetric XOR-diffusion. Safe against network interceptors.</span>
        </div>
      </div>
    </div>
  );
}
