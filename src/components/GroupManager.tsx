import React, { useState } from 'react';
import { X, Users, Check, Save, UserPlus, Info } from 'lucide-react';
import { Contact, Group, User } from '../types';

interface GroupManagerProps {
  contacts: Contact[];
  user: User;
  onClose: () => void;
  onCreateGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void;
}

export default function GroupManager({
  contacts,
  user,
  onClose,
  onCreateGroup,
}: GroupManagerProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert('Group name cannot be blank.');
      return;
    }
    if (selectedContacts.length === 0) {
      alert('Please invite at least 1 contact to build a group.');
      return;
    }

    // Include the current user's UID in the group members
    const finalMembers = [...selectedContacts, user.uid];

    onCreateGroup({
      name: groupName,
      description: groupDescription || 'A cryptographically secure E2EE group chat.',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      members: finalMembers,
      createdBy: user.uid,
    });

    alert(`Group "${groupName}" initialized successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 text-slate-100 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Group Chat</h3>
          </div>
          <button
            id="close-group-manager"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Group Name *
            </label>
            <input
              id="group-name-input"
              type="text"
              placeholder="e.g. Chatta Core Team 🚀"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Topic or Description
            </label>
            <textarea
              id="group-description-input"
              rows={2}
              placeholder="e.g. Discussing project design and crypto milestones..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Contact Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Select verified contacts ({selectedContacts.length} invited)
            </label>

            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl scrollbar-thin">
              {contacts.map(contact => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <button
                    id={`contact-select-btn-${contact.id}`}
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-950 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {contact.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {contact.bio}
                        </div>
                      </div>
                    </div>

                    <div className={`flex h-5.5 w-5.5 items-center justify-center rounded-full border transition-all ${isSelected ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300 text-transparent dark:border-slate-700'}`}>
                      <Check className="h-3 w-3 font-bold" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-950 p-2.5 text-[10px] text-slate-500">
            <Info className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span>Group chats utilize a shared symmetric session key generated on group creation, securing all future member exchanges.</span>
          </div>

          <button
            id="confirm-create-group-btn"
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Initialize Secure Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
