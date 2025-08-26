import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SafeConfigService } from '../config/safe-config.service';

@Injectable()
export class EncryptionUtil {
  private readonly secret: string;

  constructor(private configService: SafeConfigService) {
    const secret = this.configService.get('SECRET_KEY');
    if (!secret) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
    this.secret = secret;
  }

  encrypt(id: number): string {
    try {
      const saltedId = `${this.secret}${id}${this.secret}`;
      return Buffer.from(saltedId).toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt ID');
    }
  }

  decrypt(encryptedId: string): number {
    try {
      const decoded = Buffer.from(encryptedId, 'base64').toString('utf8');
      const parts = decoded.split(this.secret);
      if (parts.length === 3) {
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
