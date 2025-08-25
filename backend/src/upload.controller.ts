import { API, Common } from '@ac-assignment/shared-types';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Job } from './entities/job.entity';
import { UploadService } from './services/upload.service';
import { EncryptionUtil } from './utils/encryption.util';
import { FilesUtil } from './utils/files.util';

const FILE_SIZE_LIMIT_MB = (sizeBytes: number) => sizeBytes * 1024 * 1024;

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const savedFileName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, savedFileName);
  },
});

const validateFile = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedTypes = /csv/;
  const fileExtension = allowedTypes.test(
    extname(file.originalname).toLowerCase(),
  );
  const mimeType = allowedTypes.test(file.mimetype);
  const requestContentType = req.headers['content-type'];
  console.log('Request Content-Type:', requestContentType);

  if (mimeType && fileExtension) {
    console.log('File validation passed');
    return callback(null, true);
  } else {
    console.log('File validation failed');
    callback(new BadRequestException('Only CSV files are allowed'), false);
  }
};

const uploadRequestOptions: MulterOptions = {
  storage,
  fileFilter: validateFile,
  limits: {
    fileSize: FILE_SIZE_LIMIT_MB(1000),
  },
};

@Controller(API.Controllers.Files)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesUtil: FilesUtil,
    private readonly uploadService: UploadService,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  @Post(API.Endpoints.Upload)
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', uploadRequestOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!file) {
      this.logger.error('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    const job: Job = await this.uploadService.createJob({
      filePath: file.path,
    });
    const id = this.encryptionUtil.encrypt(job.id);
    res.send({ jobId: id });
    this.uploadService.processJob(file, job);
    return;
  }

  @Get(`${API.Endpoints.JobStatus}/:jobId`)
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<API.JobStatusResponse> {
    const id = this.encryptionUtil.decrypt(jobId);
    const job = await this.uploadService.getJob(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    switch (job.status) {
      case Common.LoadingStatus.Loading:
        res.status(HttpStatus.ACCEPTED);
        break;
      case Common.LoadingStatus.Success:
        res.status(HttpStatus.OK);
        break;
      case Common.LoadingStatus.Error:
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        break;
    }
    return { status: job.status };
  }

  @Get(`${API.Endpoints.Download}/:jobId`)
  async downloadProcessedFile(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const id = this.encryptionUtil.decrypt(jobId);
    const job = await this.uploadService.getJob(id);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== Common.LoadingStatus.Success) {
      throw new BadRequestException('Job not completed successfully');
    }

    if (!job.filePath) {
      throw new InternalServerErrorException('File path not available');
    }

    const jsonPath = job.filePath.replace('.csv', '.json');

    try {
      const fs = require('fs');
      if (!fs.existsSync(jsonPath)) {
        throw new NotFoundException('Processed file not found');
      }

      const filename = path.basename(jsonPath);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Type', 'application/json');

      res.sendFile(path.resolve(jsonPath));
    } catch (error) {
      this.logger.error(`Download error: ${error.message}`);
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  @Get(API.Endpoints.List)
  async getAllFiles() {
    const uploads = await this.uploadService.findAll();

    // Encrypt IDs and remove sensitive information
    const safeUploads: API.FileListResponse = uploads.map((upload) => ({
      id: this.encryptionUtil.encrypt(upload.id), // Encrypted ID
      name: upload.originalName,
    }));

    return safeUploads;
  }

  @Get(':encryptedId')
  async getFileById(@Param('encryptedId') encryptedId: string) {
    try {
      // Decrypt the ID
      const realId = this.encryptionUtil.decrypt(encryptedId);
      const upload = await this.uploadService.findOne(realId);

      if (!upload) {
        throw new BadRequestException('File not found');
      }

      // Return safe data without sensitive information
      return {
        message: 'File retrieved successfully',
        file: {
          id: encryptedId, // Return the encrypted ID
          originalName: upload.originalName,
          filename: upload.filename,
          createdAt: upload.createdAt,
          updatedAt: upload.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException('Invalid file ID');
    }
  }

  @Delete(`${API.Endpoints.Delete}/:encryptedId`)
  async deleteOne(@Param('encryptedId') encryptedId: string) {
    try {
      // Decrypt the ID
      const id = this.encryptionUtil.decrypt(encryptedId);
      const upload = await this.uploadService.deleteOne(id);

      if (!upload) {
        throw new BadRequestException('File not found');
      }

      await this.filesUtil.deleteUploadFile(upload.filename).catch(() => {
        //rollback
        this.uploadService.addOne(upload);
        throw new InternalServerErrorException('Local file deletion failed');
      });

      return;
    } catch (error) {
      throw new BadRequestException('Invalid file ID');
    }
  }

  @Delete(API.Endpoints.DeleteAll)
  async deleteAll() {
    try {
      const uploads = await this.uploadService.findAll();

      for (const upload of uploads) {
        await this.filesUtil.deleteUploadFile(upload.filename).catch(() => {
          this.logger.error(`Failed to delete file: ${upload.filename}`);
        });
      }

      await this.uploadService.deleteAll();
      return;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete all files');
    }
  }
}
