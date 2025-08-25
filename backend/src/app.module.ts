import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesController } from './upload.controller';
import { FilesUtil } from './utils/files.util';
import { UploadService } from './services/upload.service';
import { Upload } from './entities/upload.entity';
import { EncryptionUtil } from './utils/encryption.util';
import { Job } from './entities/job.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enables @Cron decorators
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'uploads.db',
      entities: [Upload, Job],
      synchronize: true, 
    }),
    TypeOrmModule.forFeature([Upload, Job]),
  ],
  controllers: [AppController, FilesController],
  providers: [AppService, FilesUtil, UploadService, EncryptionUtil],
})
export class AppModule {}
