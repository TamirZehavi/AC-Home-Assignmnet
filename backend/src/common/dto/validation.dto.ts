import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

// Base64 encrypted ID validation
export class EncryptedIdDto {
  /** Encrypted ID */
  @IsString()
  @IsNotEmpty()
  id: string;
}
