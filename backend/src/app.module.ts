import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesController } from './upload.controller';
import { FilesUtil } from './utils/files.util';
import { UploadService } from './services/upload.service';
import { Upload } from './entities/upload.entity';
import { EncryptionUtil } from './utils/encryption.util';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'uploads.db',
      entities: [Upload],
      synchronize: true, // Auto-create tables (only for development)
      logging: true, // Enable SQL query logging
    }),
    TypeOrmModule.forFeature([Upload]),
  ],
  controllers: [AppController, FilesController],
  providers: [AppService, FilesUtil, UploadService, EncryptionUtil],
})
export class AppModule {}
