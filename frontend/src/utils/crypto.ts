const SHARED_KEY = 'AksaraCATSecureKey2026!#$';

/**
 * Derive a 256-bit CryptoKey from our string key using SHA-256
 */
async function getCryptoKey(rawKey: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(rawKey);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-256-CBC and encode as Base64 (IV + Ciphertext)
 */
export async function encryptData(plaintext: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await getCryptoKey(SHARED_KEY);
  
  // Generate random 16-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    enc.encode(plaintext)
  );
  
  const ciphertext = new Uint8Array(ciphertextBuffer);
  
  // Combine IV and Ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  
  // Convert combined Uint8Array to Base64 (safe version compatible with browser and Node)
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypt a Base64 string (IV + Ciphertext) using AES-256-CBC to a plaintext string
 */
export async function decryptData(base64Data: string): Promise<string> {
  const cryptoKey = await getCryptoKey(SHARED_KEY);
  
  // Decode Base64
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Extract IV (first 16 bytes) and Ciphertext
  const iv = bytes.slice(0, 16);
  const ciphertext = bytes.slice(16);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    ciphertext
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}
