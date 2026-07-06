import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, ShieldCheck, X, Wifi, WifiOff, RefreshCw, Key, MessageSquarePlus, Settings 
} from 'lucide-react';
import { User, Contact, Group, Message, ChatBackup } from './types';
import { encryptMessage, decryptMessage, deriveSharedKey, addCryptoLog } from './utils/crypto';

// Modular Component Imports
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';
import ProfileSettings from './components/ProfileSettings';
import GroupManager from './components/GroupManager';
import EncryptionDemoPanel from './components/EncryptionDemoPanel';
import PlanModal from './components/PlanModal';
import CallModal from './components/CallModal';

// Firebase Imports
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  onSnapshot 
} from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  // Navigation / Loading States
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    // Try to preload user from localStorage cache for instant load
    const cached = localStorage.getItem('chatta_cached_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isAppLocked, setIsAppLocked] = useState(() => {
    // Lock the app if they have a saved PIN set up
    const cached = localStorage.getItem('chatta_cached_user');
    if (cached) {
      const u = JSON.parse(cached);
      return !!u.pinCode;
    }
    return false;
  });
  
  // App States
  const [allUsers, setAllUsers] = useState<Contact[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const contacts = useMemo(() => {
    if (!user) return [];
    return allUsers.map(u => {
      const conn = connections.find(c => (c.user1 === user.uid && c.user2 === u.id) || (c.user2 === user.uid && c.user1 === u.id));
      if (conn) {
        return {
          ...u,
          connectionStatus: conn.status,
          connectionRequesterId: conn.requesterId,
          connectionId: conn.id,
        };
      }
      return null;
    }).filter((u): u is Contact => u !== null);
  }, [allUsers, connections, user]);
  
  // Simulation States
  const [isOnline, setIsOnline] = useState(true);
  const [ciphertextViewMode, setCiphertextViewMode] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('chatta_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal Triggers
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showCryptoLogs, setShowCryptoLogs] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean; partnerName: string; partnerAvatar: string } | null>(null);

  // Inactivity tracking
  const lastActiveRef = useRef<number>(Date.now());

  // Custom Toast State (Push Notifications)
  const [notification, setNotification] = useState<{
    id: string;
    title: string;
    body: string;
    senderAvatar: string;
  } | null>(null);

  // 1. Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        try {
          // Fetch the secure user keys profile from firestore
          const userRef = doc(db, 'users', fUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            localStorage.setItem('chatta_cached_user', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('Failed to sync auth state with Firestore:', e);
        }
      } else {
        setUser(null);
        localStorage.removeItem('chatta_cached_user');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Users/Contacts Sync from Firestore
  useEffect(() => {
    if (!user) return;

    // Listen to all registered users in the network to populate contacts list dynamically
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const activeContacts: Contact[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (doc.id !== user.uid) {
          activeContacts.push({
            id: doc.id,
            name: d.displayName || d.email?.split('@')[0] || 'Secure Member',
            email: d.email || '',
            avatarUrl: d.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            status: d.status || 'online',
            bio: d.bio || 'ZKP Secured node',
            publicKey: d.publicKey || '',
          });
        }
      });
      setAllUsers(activeContacts);
    });

    return () => unsubscribe();
  }, [user]);

  // 2b. Real-time Connections Sync from Firestore
  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, 'connections'), where('user1', '==', user.uid));
    const q2 = query(collection(db, 'connections'), where('user2', '==', user.uid));

    let connections1: any[] = [];
    let connections2: any[] = [];

    const handleMerge = () => {
      const map = new Map();
      connections1.forEach(c => map.set(c.id, c));
      connections2.forEach(c => map.set(c.id, c));
      setConnections(Array.from(map.values()));
    };

    const unsub1 = onSnapshot(q1, (snapshot) => {
      connections1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      handleMerge();
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      connections2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      handleMerge();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // 3. Real-time Groups Sync from Firestore
  useEffect(() => {
    if (!user) return;

    // Filter group chats where current user is a member
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const activeGroups: Group[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        const membersList = d.members || [];
        if (membersList.includes(user.uid)) {
          activeGroups.push({
            id: doc.id,
            name: d.name || 'Secure Group',
            description: d.description || '',
            avatarUrl: d.avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
            members: membersList,
            createdBy: d.createdBy || '',
            createdAt: d.createdAt || '',
          });
        }
      });
      setGroups(activeGroups);
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Real-time Messages Sync & On-The-Fly Decryption
  useEffect(() => {
    if (!user) return;

    // Subscribe to all messages
    const unsubscribe = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const liveMessages: Message[] = [];
      snapshot.forEach((snapshotDoc) => {
        const d = snapshotDoc.data();
        
        // Filter messages belonging to this user
        const isSender = d.senderId === user.uid;
        const isReceiver = d.receiverId === user.uid;
        const isGroupMsg = d.isGroup && groups.some(g => g.id === d.receiverId);

        if (isSender || isReceiver || isGroupMsg) {
          // Perform live Client-Side Decryption!
          let secretKey = 'shared_group_key';
          let decryptedText = d.text || '';

          if (d.encrypted !== false && d.ciphertext) {
            if (!d.isGroup) {
              const partnerId = isSender ? d.receiverId : d.senderId;
              const partner = contacts.find(c => c.id === partnerId);
              if (partner) {
                secretKey = deriveSharedKey(user.privateKey, partner.publicKey, user.publicKey);
                decryptedText = decryptMessage(d.ciphertext, secretKey);
              }
            } else {
              decryptedText = decryptMessage(d.ciphertext, secretKey);
            }
          } else {
            decryptedText = d.text || '';
          }

          liveMessages.push({
            id: snapshotDoc.id,
            senderId: d.senderId,
            receiverId: d.receiverId,
            isGroup: !!d.isGroup,
            text: decryptedText,
            ciphertext: d.ciphertext || '',
            type: d.type || 'text',
            mediaUrl: d.mediaUrl || undefined,
            voiceDuration: d.voiceDuration || undefined,
            timestamp: d.timestamp || new Date().toISOString(),
            status: d.status || 'read',
            encrypted: !!d.encrypted,
            algorithm: d.algorithm || 'AES-GCM (Diffie-Hellman Agreement)',
          });
        }
      });

      // Sort messages chronologically
      const sorted = liveMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Detect incoming unread messages for Toast notifications
      if (messages.length > 0 && sorted.length > messages.length) {
        const latestMsg = sorted[sorted.length - 1];
        if (latestMsg.senderId !== user.uid && latestMsg.receiverId !== activeChatId) {
          // Show Toast notification for new message
          const senderContact = contacts.find(c => c.id === latestMsg.senderId);
          if (senderContact) {
            triggerToastNotification(
              `E2EE message from ${senderContact.name}`,
              latestMsg.text || 'Received encrypted blob',
              senderContact.avatarUrl
            );
            setUnreadCounts(prev => ({
              ...prev,
              [latestMsg.senderId]: (prev[latestMsg.senderId] || 0) + 1
            }));
          }
        }
      }

      setMessages(sorted);
    });

    return () => unsubscribe();
  }, [user, contacts, groups, activeChatId]);

  // 5. Inactivity Tracker - Auto lock screen after 120 seconds of idle state
  useEffect(() => {
    if (!user || isAppLocked) return;

    // Track interactions
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Watcher interval
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActiveRef.current;
      if (idleTime >= 120000) { // 120 seconds of inactivity
        console.log('User inactive for 120s. Securing Chatta node...');
        setIsAppLocked(true);
      }
    }, 10000); // Check progress every 10 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [user, isAppLocked]);

  // 6. Theme Application
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('chatta_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('chatta_theme', 'light');
    }
  }, [isDarkMode]);

  // Handle toast timers
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const triggerToastNotification = (title: string, body: string, avatarUrl: string) => {
    setNotification({
      id: `toast_${Date.now()}`,
      title,
      body,
      senderAvatar: avatarUrl,
    });
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAppLocked(false);
    localStorage.setItem('chatta_cached_user', JSON.stringify(loggedInUser));
  };

  // Select chat
  const handleSelectChat = (id: string, isGroup: boolean) => {
    setActiveChatId(id);
    setIsGroupActive(isGroup);
    
    // Clear unread counts
    setUnreadCounts(prev => ({
      ...prev,
      [id]: 0
    }));
  };

  // Add a contact by Email
  const handleAddContactEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Authenticate first.' };
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return { success: false, message: 'You cannot add your own secure node.' };
    }

    try {
      const usersRef = collection(db, 'users');
      const qSnapshot = await getDocs(query(usersRef, where('email', '==', email.toLowerCase())));
      
      if (qSnapshot.empty) {
        return { success: false, message: 'User not found in Chatta network.' };
      }

      const matchUser = qSnapshot.docs[0].data() as User;
      
      const uid1 = user.uid < matchUser.uid ? user.uid : matchUser.uid;
      const uid2 = user.uid < matchUser.uid ? matchUser.uid : user.uid;
      const connId = `${uid1}_${uid2}`;

      const connDocRef = doc(db, 'connections', connId);
      const connDoc = await getDoc(connDocRef);

      if (!connDoc.exists()) {
        await setDoc(connDocRef, {
          id: connId,
          user1: uid1,
          user2: uid2,
          requesterId: user.uid,
          status: 'pending',
          updatedAt: new Date().toISOString()
        });
      } else {
        const existingData = connDoc.data();
        if (existingData.status === 'denied') {
          await setDoc(connDocRef, {
            ...existingData,
            status: 'pending',
            requesterId: user.uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Drop connection request message for both requester and requested email
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: matchUser.uid,
        isGroup: false,
        text: "Private connection request initiated.",
        ciphertext: "",
        encrypted: false,
        type: "text",
        timestamp: new Date().toISOString(),
        status: "sent"
      });
      
      // Auto open chat with newly linked partner
      handleSelectChat(matchUser.uid, false);
      
      return { success: true, message: `Node request sent successfully to ${matchUser.displayName || matchUser.email}!` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Linking failed.' };
    }
  };

  // Dispatches client-encrypted message to Firestore live
  const handleSendMessage = async (
    text: string, 
    type: 'text' | 'image' | 'voice' = 'text', 
    mediaUrl?: string,
    voiceDuration?: number
  ) => {
    if (!user || !activeChatId) return;

    // Derive symmetric key on client side for E2EE
    let secretKey = 'shared_group_key';
    if (!isGroupActive) {
      const activeContact = contacts.find(c => c.id === activeChatId);
      if (activeContact) {
        secretKey = deriveSharedKey(user.privateKey, activeContact.publicKey, user.publicKey);
      }
    }

    const rawPlaintext = type === 'text' ? text : `[Media Attachment: ${type}]`;
    const ciphertext = encryptMessage(rawPlaintext, secretKey);

    // Save crypto operation audit logs
    addCryptoLog({
      type: 'encrypt',
      plaintext: rawPlaintext,
      ciphertext,
      keyUsed: secretKey,
      success: true,
    });

    const msgPayload = {
      senderId: user.uid,
      receiverId: activeChatId,
      isGroup: isGroupActive,
      ciphertext,
      type,
      mediaUrl: mediaUrl || null,
      voiceDuration: voiceDuration || null,
      timestamp: new Date().toISOString(),
      status: 'read',
      encrypted: true,
      algorithm: 'AES-256-GCM (Diffie-Hellman Agreement)',
    };

    try {
      // Direct live post to Firestore messages collection
      await addDoc(collection(db, 'messages'), msgPayload);
    } catch (e) {
      console.error('Failed to post E2EE message packet:', e);
    }
  };

  // Group Create handler
  const handleCreateGroup = async (newGroupData: Omit<Group, 'id' | 'createdAt'>) => {
    try {
      const newGroup = {
        name: newGroupData.name,
        description: newGroupData.description,
        avatarUrl: newGroupData.avatarUrl,
        members: newGroupData.members,
        createdBy: newGroupData.createdBy,
        createdAt: new Date().toISOString(),
      };

      const groupDocRef = await addDoc(collection(db, 'groups'), newGroup);
      setActiveChatId(groupDocRef.id);
      setIsGroupActive(true);

      // Post group greeting message
      await addDoc(collection(db, 'messages'), {
        senderId: 'contact_alice',
        receiverId: groupDocRef.id,
        isGroup: true,
        ciphertext: encryptMessage(`Secure group initialized. 🛡️ Welcome to ${newGroup.name}!`, 'shared_group_key'),
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'read',
        encrypted: true,
        algorithm: 'AES-256-CBC',
      });
    } catch (e) {
      console.error('Group creation failed:', e);
    }
  };

  // Restore backup
  const handleImportBackup = (backup: ChatBackup) => {
    if (backup.messages) {
      setMessages(backup.messages);
    }
  };

  // Wipe account sandbox data
  const handleClearHistory = async () => {
    if (confirm('Are you absolutely sure you want to log out and clear your cached parameters? This secures your terminal.')) {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('chatta_cached_user');
      setIsAppLocked(false);
      setActiveChatId(null);
    }
  };

  // Direct logout handler
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('chatta_cached_user');
    setIsAppLocked(false);
    setActiveChatId(null);
  };

  // Accept secure connection request
  const handleAcceptConnection = async (connectionId: string) => {
    if (!user) return;
    try {
      const connRef = doc(db, 'connections', connectionId);
      await setDoc(connRef, { status: 'accepted', updatedAt: new Date().toISOString() }, { merge: true });
      
      const connDoc = await getDoc(connRef);
      if (connDoc.exists()) {
        const connData = connDoc.data();
        const partnerId = connData.user1 === user.uid ? connData.user2 : connData.user1;
        await addDoc(collection(db, 'messages'), {
          senderId: user.uid,
          receiverId: partnerId,
          isGroup: false,
          text: "Secure chat request accepted. E2EE channel established.",
          ciphertext: "",
          encrypted: false,
          type: "text",
          timestamp: new Date().toISOString(),
          status: "sent"
        });
      }
    } catch (e) {
      console.error('Failed to accept connection:', e);
    }
  };

  // Decline secure connection request
  const handleDenyConnection = async (connectionId: string) => {
    if (!user) return;
    try {
      const connRef = doc(db, 'connections', connectionId);
      await setDoc(connRef, { status: 'denied', updatedAt: new Date().toISOString() }, { merge: true });
      
      const connDoc = await getDoc(connRef);
      if (connDoc.exists()) {
        const connData = connDoc.data();
        const partnerId = connData.user1 === user.uid ? connData.user2 : connData.user1;
        await addDoc(collection(db, 'messages'), {
          senderId: user.uid,
          receiverId: partnerId,
          isGroup: false,
          text: "Chat request denied.",
          ciphertext: "",
          encrypted: false,
          type: "text",
          timestamp: new Date().toISOString(),
          status: "sent"
        });
      }
    } catch (e) {
      console.error('Failed to deny connection:', e);
    }
  };

  // Start E2EE Voice or Video Call
  const handleStartCall = (isVideo: boolean) => {
    if (!user) return;
    const isPaid = user.subscriptionPlan === 'silver' || user.subscriptionPlan === 'gold' || user.subscriptionPlan === 'premium';
    if (!isPaid) {
      alert("Voice and Video calling is only available for Silver, Gold, or Premium plan subscribers. Please choose a subscription plan to continue!");
      setShowPlanModal(true);
      return;
    }
    setActiveCall({
      isVideo,
      partnerName: activeChatProfile?.name || 'Secure Connection',
      partnerAvatar: activeChatProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    });
  };

  // Splash Onboarding
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Render Authentication or Security Lock Screen
  if (!user || isAppLocked) {
    return (
      <AuthScreen 
        onLoginSuccess={handleLoginSuccess} 
        savedUserForPin={isAppLocked ? user : null}
        onPinUnlockSuccess={() => setIsAppLocked(false)}
      />
    );
  }

  // Get active chat profile data
  const activeChatProfile = isGroupActive
    ? groups.find(g => g.id === activeChatId) || null
    : contacts.find(c => c.id === activeChatId) || null;

  // Filter messages for active chat
  const chatMessages = messages.filter(
    msg => msg.receiverId === activeChatId || (msg.senderId === activeChatId && msg.receiverId === user.uid)
  );

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-100'}`}>
      
      {/* Toast Push Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-xs transition-all animate-bounce">
          <img
            src={notification.senderAvatar}
            alt="Sender"
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-emerald-500" />
              {notification.title}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 truncate">
              {notification.body}
            </p>
          </div>
          <button
            id="dismiss-toast-btn"
            onClick={() => setNotification(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Container Wrapper - Responsive Layout Grid */}
      <div className="flex h-full w-full max-w-7xl mx-auto shadow-2xl relative">
        
        {/* LEFT COLUMN: SIDEBAR (hidden on mobile when a chat is actively opened) */}
        <div className={`w-full sm:w-80 md:w-96 h-full shrink-0 ${activeChatId ? 'hidden sm:block' : 'block'}`}>
          <Sidebar
            user={user}
            contacts={contacts}
            groups={groups}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onOpenSettings={() => setShowSettings(true)}
            onOpenGroupManager={() => setShowGroupManager(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            isOnline={isOnline}
            onToggleOnline={() => setIsOnline(!isOnline)}
            unreadCounts={unreadCounts}
            onAddContactEmail={handleAddContactEmail}
            onLogout={handleLogout}
            onOpenPlanModal={() => setShowPlanModal(true)}
          />
        </div>
 
        {/* RIGHT COLUMN: ACTIVE CHAT ROOM (hidden on mobile when no chat is opened) */}
        <div className={`flex-1 h-full border-l border-slate-200 dark:border-slate-800 ${activeChatId ? 'block' : 'hidden sm:block'}`}>
          <ChatRoom
            user={user}
            activeChat={activeChatProfile}
            isGroup={isGroupActive}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onOpenCryptoLogs={() => setShowCryptoLogs(true)}
            isOnline={isOnline}
            ciphertextViewMode={ciphertextViewMode}
            onBack={() => setActiveChatId(null)}
            onAcceptConnection={handleAcceptConnection}
            onDenyConnection={handleDenyConnection}
            onStartCall={handleStartCall}
          />
        </div>
      </div>

      {/* MODAL WINDOWS */}
      
      {/* 1. Profile Settings, Recovery, Backups */}
      {showSettings && (
        <ProfileSettings
          user={user}
          messages={messages}
          groups={groups}
          onUpdateUser={async (updated) => {
            setUser(updated);
            localStorage.setItem('chatta_cached_user', JSON.stringify(updated));
            try {
              await setDoc(doc(db, 'users', updated.uid), updated);
            } catch (err) {
              console.error('Failed to update live user profile:', err);
            }
          }}
          onImportBackup={handleImportBackup}
          onClearHistory={handleClearHistory}
          onClose={() => setShowSettings(false)}
          onOpenPlanModal={() => setShowPlanModal(true)}
        />
      )}

      {/* 2. Group Creator Manager */}
      {showGroupManager && (
        <GroupManager
          contacts={contacts}
          user={user}
          onClose={() => setShowGroupManager(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {/* 3. Cryptographic Logging Panel */}
      {showCryptoLogs && (
        <EncryptionDemoPanel
          user={user}
          activeChat={activeChatProfile}
          isGroup={isGroupActive}
          onClose={() => setShowCryptoLogs(false)}
          ciphertextViewMode={ciphertextViewMode}
          onToggleCiphertextViewMode={() => setCiphertextViewMode(!ciphertextViewMode)}
        />
      )}

      {/* 4. Pricing / Subscription Plan Modal */}
      {showPlanModal && (
        <PlanModal
          user={user}
          onClose={() => setShowPlanModal(false)}
          onUpdateUser={async (updated) => {
            setUser(updated);
            localStorage.setItem('chatta_cached_user', JSON.stringify(updated));
            try {
              await setDoc(doc(db, 'users', updated.uid), updated);
            } catch (err) {
              console.error('Failed to update live subscription:', err);
            }
          }}
        />
      )}

      {/* 5. E2EE Call / Video Calling Session Modal */}
      {activeCall && (
        <CallModal
          isVideo={activeCall.isVideo}
          partnerName={activeCall.partnerName}
          partnerAvatar={activeCall.partnerAvatar}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
