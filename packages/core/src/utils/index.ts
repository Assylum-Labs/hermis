import { SolanaSignInInput } from "../types/index.js";

  
/**
 * Generates a Solana Sign-In message from the provided input
 * @param input The Sign-In parameters
 * @returns A formatted sign-in message string
 */
export function generateSignInMessage(input: SolanaSignInInput): string {
    // Default values for required fields
    const domain = input.domain || window.location.host;
    const nonce = input.nonce || generateNonce();
    const issuedAt = input.issuedAt || new Date().toISOString();
    const chainId = input.chainId || 'solana:mainnet';
    const statement = input.statement || 'Sign in with your Solana account';
    const version = input.version || '1';
    const uri = input.uri || window.location.href;
    
    // Build the message in the SIWS format
    let message = `${domain} wants you to sign in with your Solana account:\n`;
    message += `\n`;
    message += `${statement}\n`;
    message += `\n`;
    
    // Add URI, version and chain ID
    message += `URI: ${uri}\n`;
    message += `Version: ${version}\n`;
    message += `Chain ID: ${chainId}\n`;
    
    // Add timestamps
    message += `Issued At: ${issuedAt}\n`;
    
    if (input.expirationTime) {
      message += `Expiration Time: ${input.expirationTime}\n`;
    }
    
    if (input.notBefore) {
      message += `Not Before: ${input.notBefore}\n`;
    }
    
    // Add nonce for replay protection
    message += `Nonce: ${nonce}\n`;
    
    // Add request ID if provided
    if (input.requestId) {
      message += `Request ID: ${input.requestId}\n`;
    }
    
    // Add resources if provided
    if (input.resources && input.resources.length > 0) {
      message += `\n`;
      message += `Resources:\n`;
      for (const resource of input.resources) {
        message += `- ${resource}\n`;
      }
    }
    
    return message;
  }
/**
 * Generates a random nonce for sign-in requests
 * @returns A random string to use as a nonce
 */
export function generateNonce(): string {
    // Generate a random string of 32 bytes, encoded as hex
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
  