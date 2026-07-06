export interface User {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  status: 'online' | 'offline' | 'away';
  mnemonic: string;
  publicKey: string;
  privateKey: string;
  pinCode?: string; // 6-digit pin code for quick authentication
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  organization?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  subscriptionPlan?: 'free' | 'silver' | 'gold' | 'premium';
  blockedUsers?: string[];
}

export const PAYSTACK_TEST_KEY = "pk_test_db0145199289f83c428d57cf70755142bb0b8b28";

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'away';
  bio: string;
  publicKey: string;
  connectionStatus?: 'pending' | 'accepted' | 'denied';
  connectionRequesterId?: string;
  connectionId?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  members: string[]; // List of contact IDs + user uid
  createdBy: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // Contact ID or Group ID
  isGroup: boolean;
  text: string; // Plaintext (locally decryped) or Ciphertext (if encryption error)
  ciphertext: string; // Encrypted text stored
  type: 'text' | 'image' | 'voice';
  mediaUrl?: string; // Data URL for image or voice
  voiceDuration?: number; // Duration of voice note in seconds
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  encrypted: boolean;
  algorithm: string; // e.g., 'AES-GCM (Simulated)'
}

export interface ChatBackup {
  version: string;
  createdAt: string;
  user: {
    uid: string;
    displayName: string;
    email: string;
  };
  messages: Message[];
  groups: Group[];
}

export interface CryptoLog {
  id: string;
  timestamp: string;
  type: 'encrypt' | 'decrypt' | 'key-exchange' | 'backup';
  messageId?: string;
  plaintext: string;
  ciphertext: string;
  keyUsed: string;
  success: boolean;
}
