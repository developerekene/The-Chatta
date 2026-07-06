import React, { useState } from 'react';
import {
  Search, Users, MessageSquarePlus, Settings, Database, Moon, Sun,
  Wifi, WifiOff, Globe, ShieldCheck, HelpCircle, ArrowRightLeft, UserCheck, UserPlus, X, Loader2,
  MoreVertical, LogOut, Sparkles
} from 'lucide-react';
import { Contact, Group, User } from '../types';

interface SidebarProps {
  user: User;
  contacts: Contact[];
  groups: Group[];
  activeChatId: string | null;
  onSelectChat: (id: string, isGroup: boolean) => void;
  onOpenSettings: () => void;
  onOpenGroupManager: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  unreadCounts: Record<string, number>;
  onAddContactEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
  onOpenPlanModal: () => void;
}

export default function Sidebar({
  user,
  contacts,
  groups,
  activeChatId,
  onSelectChat,
  onOpenSettings,
  onOpenGroupManager,
  isDarkMode,
  onToggleTheme,
  isOnline,
  onToggleOnline,
  unreadCounts,
  onAddContactEmail,
  onLogout,
  onOpenPlanModal,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  // Add Contact Form states
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Formatting username beautifully
  const displayUsername = user.displayName
    ? user.displayName.includes('@')
      ? user.displayName.split('@')[0]
      : user.displayName
    : 'User';
  const cleanFirstName = displayUsername.charAt(0).toUpperCase() + displayUsername.slice(1).toLowerCase();

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter groups
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim()) return;
    setAdding(true);
    setAddMessage(null);
    try {
      const res = await onAddContactEmail(contactEmail.trim());
      setAddMessage({ success: res.success, text: res.message });
      if (res.success) {
        setContactEmail('');
        setTimeout(() => {
          setShowAddContact(false);
          setAddMessage(null);
        }, 2000);
      }
    } catch (err) {
      setAddMessage({ success: false, text: 'An unexpected error occurred.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 transition-colors">

      {/* Top Profile Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            id="sidebar-user-avatar-btn"
            onClick={onOpenSettings}
            className="relative hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer focus:outline-none shrink-0"
            title="Click to Edit Profile Settings"
          >
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500`} />
          </button>
          <div className="min-w-0">
            <h4 className="text-sm font-bold truncate max-w-[140px] text-slate-900 dark:text-white">
              {cleanFirstName}
            </h4>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={user.email}>
              {user.email}
            </div>
            <div className="mt-0.5">
              <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase ${user.subscriptionPlan === 'silver' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/30' :
                user.subscriptionPlan === 'gold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-300/30' :
                  user.subscriptionPlan === 'premium' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-300/30' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                {user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'FREE'} PLAN
              </span>
            </div>
          </div>
        </div>

        {/* Unified Actions Dropdown */}
        <div className="relative">
          <button
            id="sidebar-menu-dropdown-btn"
            onClick={() => setShowMenu(!showMenu)}
            className={`rounded-lg p-2 transition-colors cursor-pointer ${showMenu ? 'bg-slate-100 dark:bg-slate-800 text-emerald-500' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            title="Options Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <>
              {/* Dropdown Backdrop overlay to dismiss on external click */}
              <div
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowMenu(false)}
              />

              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-25 overflow-hidden animate-fadeIn py-1">
                {/* Upgrade / Pricing Plans */}
                <button
                  id="menu-pricing-btn"
                  onClick={() => {
                    onOpenPlanModal();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60"
                >
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span>Pricing & Upgrades</span>
                </button>

                {/* Edit Profile */}
                <button
                  id="menu-settings-btn"
                  onClick={() => {
                    onOpenSettings();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                {/* Create Group */}
                <button
                  id="menu-group-btn"
                  onClick={() => {
                    onOpenGroupManager();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
                >
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Create Group Chat</span>
                </button>

                {/* Add Contact by Email */}
                <button
                  id="menu-add-contact-btn"
                  onClick={() => {
                    setShowAddContact(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-slate-400" />
                  <span>Add Contact by Email</span>
                </button>

                {/* Toggle Appearance */}
                <button
                  id="menu-theme-toggle"
                  onClick={() => {
                    onToggleTheme();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800/80"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span>Switch to Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-slate-400" />
                      <span>Switch to Dark Mode</span>
                    </>
                  )}
                </button>

                {/* Log Out */}
                <button
                  id="menu-logout-btn"
                  onClick={() => {
                    onLogout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800/80"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slide-down Add Contact Form */}
      {showAddContact && (
        <div className="p-3 bg-emerald-500/5 border-b border-slate-100 dark:border-slate-800 animate-fadeIn">
          <form onSubmit={handleAddContactSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add New Contact</span>
              <button
                type="button"
                id="close-add-contact-form"
                onClick={() => {
                  setShowAddContact(false);
                  setAddMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                id="add-contact-email-input"
                type="email"
                placeholder="developer@gmail.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="flex-1 rounded-lg border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                id="submit-add-contact-email"
                disabled={adding}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Link'}
              </button>
            </div>

            {addMessage && (
              <div className={`text-[11px] font-medium p-1 px-2 rounded mt-1.5 ${addMessage.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}>
                {addMessage.text}
              </div>
            )}
          </form>
        </div>
      )}



      {/* Search Input Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search secure chats, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800/80 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 border-b border-slate-100 dark:border-slate-800/60">
        <button
          id="tab-chats-btn"
          onClick={() => setActiveTab('chats')}
          className={`flex-1 pb-2.5 text-center text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${activeTab === 'chats' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          DIRECT MESSAGES
        </button>
        <button
          id="tab-groups-btn"
          onClick={() => setActiveTab('groups')}
          className={`flex-1 pb-2.5 text-center text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${activeTab === 'groups' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          GROUPS
        </button>
      </div>

      {/* Contacts or Groups List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 scrollbar-thin">
        {activeTab === 'chats' ? (
          filteredContacts.length > 0 ? (
            filteredContacts.map(contact => {
              const isActive = activeChatId === contact.id;
              const unread = unreadCounts[contact.id] || 0;

              // Custom text and color depending on connection status
              let connectionSubtitle = contact.bio;
              let subtitleColorClass = 'text-slate-500 dark:text-slate-400';

              if (contact.connectionStatus === 'pending') {
                if (contact.connectionRequesterId === user.uid) {
                  connectionSubtitle = 'Pending Approval';
                  subtitleColorClass = 'text-amber-500 dark:text-amber-400 font-semibold';
                } else {
                  connectionSubtitle = 'Chat Request Received';
                  subtitleColorClass = 'text-emerald-500 dark:text-emerald-400 font-semibold';
                }
              } else if (contact.connectionStatus === 'denied') {
                connectionSubtitle = 'Chat Request Denied';
                subtitleColorClass = 'text-rose-500 dark:text-rose-400 font-semibold';
              }

              return (
                <button
                  id={`chat-item-${contact.id}`}
                  key={contact.id}
                  onClick={() => onSelectChat(contact.id, false)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left transition-all cursor-pointer ${isActive ? 'bg-slate-100 dark:bg-slate-800/70 border-l-4 border-emerald-500 pl-2.5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${contact.status === 'online' ? 'bg-emerald-500' : contact.status === 'away' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                        {contact.name}
                      </span>
                      <span className="font-mono text-[9px] text-emerald-500/80 font-bold tracking-tight uppercase flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> E2EE
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${subtitleColorClass}`}>
                      {connectionSubtitle}
                    </p>
                  </div>

                  {unread > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md shadow-emerald-500/10">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono">
              No contacts found.
            </div>
          )
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Create Group Quick Button */}
            <div className="p-3 bg-emerald-500/5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Group Chats</span>
              <button
                id="create-group-btn-inline"
                onClick={onOpenGroupManager}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
              >
                <Users className="h-3 w-3" />
                <span>Create Group</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredGroups.length > 0 ? (
                filteredGroups.map(group => {
                  const isActive = activeChatId === group.id;
                  const unread = unreadCounts[group.id] || 0;
                  return (
                    <button
                      id={`group-item-${group.id}`}
                      key={group.id}
                      onClick={() => onSelectChat(group.id, true)}
                      className={`w-full flex items-center gap-3 p-3.5 text-left transition-all cursor-pointer ${isActive ? 'bg-slate-100 dark:bg-slate-800/70 border-l-4 border-emerald-500 pl-2.5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                    >
                      <img
                        src={group.avatarUrl}
                        alt={group.name}
                        className="h-11 w-11 rounded-full object-cover shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                            {group.name}
                          </span>
                          <span className="font-mono text-[9px] text-emerald-500/80 font-bold tracking-tight uppercase">
                            Group
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {group.description}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md shadow-emerald-500/10">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono">
                  No groups found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* App brand footer */}
      <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
        <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 tracking-wider">
          {new Date().getFullYear()} CHATTA INC | All rights Reserved
        </span>
      </div>
    </div>
  );
}
