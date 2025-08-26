import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { Job } from './entities/job.entity';
import { UploadService } from './services/upload.service';
import { FilesUtil } from '../common/utils/files.util';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { FilesController } from './controllers/files/files.controller';
import { JobsController } from './controllers/jobs/jobs.controller';
import { SafeConfigService } from 'src/common/config/safe-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([Upload, Job])],
  controllers: [FilesController, JobsController],
  providers: [UploadService, FilesUtil, EncryptionUtil, SafeConfigService],
})
export class FilesModule {}
