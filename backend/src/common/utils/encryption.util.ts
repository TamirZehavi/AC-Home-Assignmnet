import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionUtil {
  private readonly secret: string | undefined;

  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>('SECRET_KEY');
    if (!this.secret) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
  }

  /**
   * Simple ID obfuscation using Base64 encoding with a salt
   * Easy to understand and explain in interviews
   */
  encrypt(id: number): string {
    try {
      // Add salt to make it less obvious
      const saltedId = `${this.secret}-${id}-${this.secret}`;
      
      // Convert to Base64 to obfuscate
      return Buffer.from(saltedId).toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt ID');
    }
  }

  /**
   * Decrypt the obfuscated ID back to original number
   */
  decrypt(encryptedId: string): number {
    try {
      // Decode from Base64
      const decoded = Buffer.from(encryptedId, 'base64').toString('utf8');
      
      // Extract the ID from the salted format: "secret-ID-secret"
      const parts = decoded.split('-');
      
      // Validate format and extract ID
      if (parts.length === 3 && parts[0] === this.secret && parts[2] === this.secret) {
        const id = parseInt(parts[1], 10);
        if (isNaN(id)) {
          throw new Error('Invalid ID format');
        }
        return id;
      }
      
      throw new Error('Invalid encrypted ID format');
    } catch (error) {
      throw new Error('Failed to decrypt ID');
    }
  }
}
