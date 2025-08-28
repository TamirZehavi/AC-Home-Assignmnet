import { Common } from '@ac-assignment/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { Repository } from 'typeorm';
import { Upload } from '../entities/upload.entity';
import { Job } from '../entities/job.entity';
import { CsvParseResult, FilesUtil } from 'src/common/utils/files.util';
import { UpdateEntity } from 'src/common/types/util.types';
import { FileHashUtil } from 'src/common/utils/file-hash.util';
import { SafeConfigService } from 'src/common/config/safe-config.service';
import { EnvironmentVariables } from 'src/common/types/env.types';

export interface CreateUploadDto {
  originalName: string;
  filename: string;
  fileHash: string;
}

export interface UpdateUploadParsingDto {
  originalName: string;
  fileName: string;
}

const CLEANUP_CRON = process.env[EnvironmentVariables.JobCleanupCron] || '0 0 * * *';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private filesUtil: FilesUtil,
    private configService: SafeConfigService,
  ) {}

  @Cron(CLEANUP_CRON) // This will be overridden by the dynamic cron if CRON_EXPRESSION is set
  async cleanupOldJobs() {
    // Now you get full type safety - JOB_CLEANUP_DAYS is validated and returns a number
    const cleanupDays = this.configService.get(EnvironmentVariables.JobCleanupDays, 3);
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - cleanupDays);

    const deletedJobs = await this.jobRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date: cleanupDate })
      .execute();

    this.logger.log(`Cleaned up ${deletedJobs.affected} old jobs older than ${cleanupDays} days`);
  }

  async createUpload(createUploadDto: CreateUploadDto): Promise<Upload> {
    this.logger.log(`Creating upload record: ${createUploadDto.originalName}`);

    const upload = this.uploadRepository.create(createUploadDto);
    const savedUpload = await this.addOne(upload);

    this.logger.log(`Upload record created with ID: ${savedUpload.id}`);
    return savedUpload;
  }

  async findAll(): Promise<Upload[]> {
    return this.uploadRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { id } });
  }

  async addOne(upload: Upload) {
    return this.uploadRepository.save(upload);
  }

  async deleteOne(id: number): Promise<Upload | null> {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (upload) {
      await this.uploadRepository.remove(upload);
    }
    return upload;
  }

  async deleteAll(): Promise<void> {
    await this.uploadRepository.clear();
  }

  async findFileByHash(fileHash: string): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { fileHash } });
  }

  async getUploadStats() {
    const total = await this.uploadRepository.count();
    return { total };
  }

  async createJob(createJobDto: { filePath: string }) {
    const job = this.jobRepository.create({
      status: Common.LoadingStatus.Pending,
      filePath: createJobDto.filePath,
    });
    return this.jobRepository.save(job);
  }

  async getJob(id: number) {
    const job = await this.jobRepository.findOne({ where: { id } });
    return job;
  }

  async updateJob(id: number, updateStatusDto: UpdateEntity<Job>) {
    await this.jobRepository.update(id, {
      status: updateStatusDto.status,
      error: updateStatusDto.error,
      filePath: updateStatusDto.filePath,
    });
  }

  async processJob(file: Express.Multer.File, job: Job): Promise<void> {
    await this.updateJob(job.id, { status: Common.LoadingStatus.Loading });
    const fileHash = await FileHashUtil.calculateHash(file.path);
    if (!fileHash) {
      await this.updateJob(job.id, {
        status: Common.LoadingStatus.Error,
        error: 'File hash calculation failed',
      });
      return;
    }
    const existingFile = await this.findFileByHash(fileHash);
    if (existingFile) {
      await this.updateJob(job.id, {
        status: Common.LoadingStatus.Success,
        filePath: path.join(process.cwd(), 'uploads', existingFile.filename),
      });
      await this.filesUtil.deleteFile(file.path);
      return;
    }

    let csvParseResult: CsvParseResult | null = null;
    this.logger.log('Parsing CSV file...');
    try {
      csvParseResult = await this.filesUtil.parseAndSaveAsJson(file.path);

      if (csvParseResult?.success) {
        this.logger.log(`CSV parsed successfully`);
        this.logger.log('About to call uploadService.createUpload...');
        const uploadRecord = await this.createUpload({
          originalName: file.originalname,
          filename: path.basename(file?.filename),
          fileHash,
        });
        this.logger.log(`Upload record created with ID: ${uploadRecord.id}`);
        await this.updateJob(job.id, {
          status: Common.LoadingStatus.Success,
          filePath: file.path,
        });
      } else {
        await this.updateJob(job.id, {
          status: Common.LoadingStatus.Error,
          error: csvParseResult.errorMessage || 'Parsing CSV failed',
        });
      }
    } catch (error) {
      this.logger.error(`CSV parsing error: ${error.message}`);
      await this.updateJob(job.id, {
        status: Common.LoadingStatus.Error,
        error: error.message,
      });
    }
  }
}
