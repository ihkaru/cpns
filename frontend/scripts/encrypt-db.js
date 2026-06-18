import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SHARED_KEY = 'AksaraCATSecureKey2026!#$';
const jsonPath = path.join(process.cwd(), 'public/bank_soal_cpns.json');

try {
  console.log(`Reading database for encryption: ${jsonPath}`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');

  // Check if the database is already encrypted (in case the script runs twice or files are already processed)
  try {
    const parsed = JSON.parse(rawData);
    if (parsed.payload) {
      console.log('Database is already encrypted! Skipping encryption.');
      process.exit(0);
    }
  } catch {
    // Not JSON or does not have payload, proceed to encrypt
  }

  // Derive AES 256 key from SHARED_KEY
  const key = crypto.createHash('sha256').update(SHARED_KEY).digest();
  
  // Generate random 16-byte IV
  const iv = crypto.randomBytes(16);
  
  // Encrypt raw JSON
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(rawData, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Combine IV and Ciphertext
  const combined = Buffer.concat([iv, encrypted]);
  const base64Payload = combined.toString('base64');
  
  // Overwrite file
  fs.writeFileSync(jsonPath, JSON.stringify({ payload: base64Payload }), 'utf8');
  console.log('Successfully encrypted public/bank_soal_cpns.json!');
} catch (error) {
  console.error('Error encrypting offline database:', error);
  process.exit(1);
}
