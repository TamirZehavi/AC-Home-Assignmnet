import * as crypto from 'crypto';
import * as fs from 'fs';

export class FileHashUtil {
  static async calculateHash(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', () => {
        resolve(null);
      });
    });
  }

  static calculateBufferHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}