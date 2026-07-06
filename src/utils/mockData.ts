import { Contact, Group, Message } from '../types';
import { generateKeyPair, deriveSharedKey, encryptMessage } from './crypto';

// Constant keys for our mock contacts so they are stable across all browser sessions and backend tests
const contactKeys = {
  alice: {
    publicKey: 'e2ee_pub_key_alice123456',
    privateKey: 'e2ee_priv_key_alice123456_secret',
  },
  bob: {
    publicKey: 'e2ee_pub_key_bob123456',
    privateKey: 'e2ee_priv_key_bob123456_secret',
  },
  elena: {
    publicKey: 'e2ee_pub_key_elena123456',
    privateKey: 'e2ee_priv_key_elena123456_secret',
  },
  steve: {
    publicKey: 'e2ee_pub_key_steve123456',
    privateKey: 'e2ee_priv_key_steve123456_secret',
  },
  group_team: 'group_team_key_123',
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact_alice',
    name: 'Alice Vance',
    email: 'alice.vance@chatta.io',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    bio: 'Securing my chats with Chatta 🔐',
    publicKey: contactKeys.alice.publicKey,
  },
  {
    id: 'contact_bob',
    name: 'Bob Miller',
    email: 'bob.miller@chatta.io',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'away',
    bio: 'Coding under the stars 🌌',
    publicKey: contactKeys.bob.publicKey,
  },
  {
    id: 'contact_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@chatta.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    bio: 'Always down for a cup of tea ☕',
    publicKey: contactKeys.elena.publicKey,
  },
  {
    id: 'contact_steve',
    name: 'Steve Jobs',
    email: 'steve@chatta.io',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    bio: 'Stay hungry, stay foolish.',
    publicKey: contactKeys.steve.publicKey,
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'group_team',
    name: 'Chatta Devs 🚀',
    description: 'The core development and engineering group for the Chatta MVP.',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    members: ['contact_alice', 'contact_bob', 'contact_elena', 'current_user'],
    createdBy: 'contact_alice',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

/**
 * Generates initial messages for a given user.
 * We can dynamically build these messages so that they are encrypted using the user's keys!
 */
export function getInitialMessages(userUid: string, userPrivateKey: string): Message[] {
  const messages: Message[] = [];
  const now = Date.now();

  // Helper to push text messages
  const addTextMessage = (
    senderId: string,
    receiverId: string,
    isGroup: boolean,
    text: string,
    minutesAgo: number,
    status: 'read' | 'delivered' | 'sent' = 'read'
  ) => {
    // Derive symmetric key based on whether it is group or 1-to-1
    let secretKey = 'shared_group_key';
    if (!isGroup) {
      const isSenderMe = senderId === userUid;
      const otherContact = MOCK_CONTACTS.find(
        c => c.id === (isSenderMe ? receiverId : senderId)
      );
      if (otherContact) {
        secretKey = isSenderMe 
          ? deriveSharedKey(userPrivateKey, otherContact.publicKey)
          : deriveSharedKey(userPrivateKey, otherContact.publicKey); // simulated key agreement
      }
    }

    const ciphertext = encryptMessage(text, secretKey);
    messages.push({
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      senderId,
      receiverId,
      isGroup,
      text,
      ciphertext,
      type: 'text',
      timestamp: new Date(now - minutesAgo * 60 * 1000).toISOString(),
      status,
      encrypted: true,
      algorithm: 'AES-256-GCM (XOR Agreement)',
    });
  };

  // Group messages
  addTextMessage('contact_alice', 'group_team', true, 'Hey everyone! Welcome to the Chatta official launch channel.', 120);
  addTextMessage('contact_bob', 'group_team', true, 'Super excited to test the end-to-end encryption here. Does voice messaging work?', 115);
  addTextMessage('contact_elena', 'group_team', true, 'Yes! Recorded audio is stored as base64 data strings. Try clicking the mic icon!', 110);
  
  // Alice 1-to-1 messages
  addTextMessage('contact_alice', userUid, false, 'Hi! Let me know if you can see this message encrypted. Click the lock icon in the top right to check the cryptographical verification panel.', 45);
  addTextMessage('contact_alice', userUid, false, 'You can also toggle between light and dark themes in the side panel or settings.', 40);

  // Bob 1-to-1 messages
  addTextMessage('contact_bob', userUid, false, 'Yo! Are we still on for the backup and export review today? I want to make sure offline support is bulletproof.', 25);
  
  // Steve 1-to-1 messages
  addTextMessage('contact_steve', userUid, false, 'Innovation distinguishes between a leader and a follower. Beautiful encryption interface, by the way.', 180);

  return messages;
}
