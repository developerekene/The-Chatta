import { CryptoLog } from '../types';

// Mock list of words for 12-word recovery mnemonic generation
const DICTIONARY = [
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 
  'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 
  'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu',
  'apple', 'banana', 'cherry', 'grape', 'lemon', 'orange', 'peach', 'melon', 'berry',
  'anchor', 'beacon', 'canvas', 'desert', 'forest', 'harbor', 'island', 'jungle', 'mountain'
];

/**
 * Generates a 12-word recovery phrase
 */
export function generateMnemonic(): string {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * DICTIONARY.length);
    words.push(DICTIONARY[randomIndex]);
  }
  return words.join(' ');
}

/**
 * Simulates generating a public/private keypair for asymmetric E2EE key exchange
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const entropy = Math.random().toString(36).substring(2, 15);
  return {
    publicKey: `e2ee_pub_key_${entropy}`,
    privateKey: `e2ee_priv_key_${entropy}_secret`,
  };
}

/**
 * XOR-based symmetric encryption that outputs standard looking Hex/Base64 ciphertext
 * This makes the encryption real, deterministic, and fully reversible on the client side,
 * so the user can toggle encryption on/off and see actual ciphertexts.
 */
export function encryptMessage(text: string, secretKey: string): string {
  if (!text) return '';
  try {
    // Convert UTF-8 to safe binary string of ISO-8859-1 / ASCII bytes first
    const binaryText = unescape(encodeURIComponent(text));
    
    let result = '';
    for (let i = 0; i < binaryText.length; i++) {
      const charCode = binaryText.charCodeAt(i);
      const keyChar = secretKey.charCodeAt(i % secretKey.length);
      // XOR cipher operation
      const encryptedChar = charCode ^ keyChar;
      result += String.fromCharCode(encryptedChar);
    }
    
    // Safely encode the binary string to Base64
    return btoa(result);
  } catch (e) {
    console.error('Encryption failed:', e);
    // Fallback if encoding issues
    return btoa(text);
  }
}

/**
 * Decrypts a previously encrypted message
 */
export function decryptMessage(ciphertext: string, secretKey: string): string {
  if (!ciphertext) return '';
  try {
    // Decode Base64 safely to get the XOR-ed binary string
    const binaryStr = atob(ciphertext);
    
    let decryptedBinary = '';
    for (let i = 0; i < binaryStr.length; i++) {
      const charCode = binaryStr.charCodeAt(i);
      const keyChar = secretKey.charCodeAt(i % secretKey.length);
      // Reverse XOR operation
      const decryptedChar = charCode ^ keyChar;
      decryptedBinary += String.fromCharCode(decryptedChar);
    }
    
    // Convert safe binary string back to UTF-8
    try {
      return decodeURIComponent(escape(decryptedBinary));
    } catch (e) {
      // Fallback for legacy messages or partial decryption
      return decryptedBinary;
    }
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Error: Secret Key Mismatch]';
  }
}

/**
 * Helper to derive a shared symmetric secret from a sender private key and receiver public key
 * This simulates a true Diffie-Hellman key exchange for Chatta users by being commutative.
 */
export function deriveSharedKey(myPrivateKey: string, theirPublicKey: string, myPublicKey?: string): string {
  // Extract my public key from my private key to ensure commutativity
  // e.g., e2ee_priv_key_XYZ_secret -> e2ee_pub_key_XYZ
  let myPub = myPublicKey;
  if (!myPub) {
    if (myPrivateKey.startsWith('e2ee_priv_key_')) {
      const entropy = myPrivateKey.replace('e2ee_priv_key_', '').replace('_secret', '');
      myPub = `e2ee_pub_key_${entropy}`;
    } else {
      // Fallback: if private key doesn't match the format, convert private key identifier symmetrically
      myPub = myPrivateKey.replace('priv_key', 'pub_key').replace('priv', 'pub');
    }
  }

  // Sort the two public keys to ensure both parties derive the exact same string
  const sortedKeys = [myPub, theirPublicKey].sort();
  const combined = `${sortedKeys[0]}_exchange_${sortedKeys[1]}`;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `session_aes_${Math.abs(hash).toString(16)}`;
}

// In-memory queue of crypto logs for debugging panel
let cryptoLogs: CryptoLog[] = [];

export function addCryptoLog(log: Omit<CryptoLog, 'id' | 'timestamp'>): CryptoLog {
  const newLog: CryptoLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  cryptoLogs.unshift(newLog); // Put latest logs first
  // Cap at 100 logs
  if (cryptoLogs.length > 100) {
    cryptoLogs.pop();
  }
  return newLog;
}

export function getCryptoLogs(): CryptoLog[] {
  return cryptoLogs;
}

export function clearCryptoLogs(): void {
  cryptoLogs = [];
}
