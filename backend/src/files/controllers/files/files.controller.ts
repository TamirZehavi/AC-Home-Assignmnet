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
import * as fs from 'fs';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { EnvironmentVariables } from 'src/common/types/env.types';
import { EncryptionUtil } from 'src/common/utils/encryption.util';
import { FilesUtil } from 'src/common/utils/files.util';
import { UploadService } from 'src/files/services/upload.service';
import { v4 as uuidv4 } from 'uuid';

const FILE_SIZE_LIMIT_MB =
  parseInt(process.env[EnvironmentVariables.MaxFileSizeMB] || '200', 10) * 1024 * 1024;
const UPLOAD_DIRECTORY =
  process.env[EnvironmentVariables.UploadDirectory] || './uploads';

const storage = diskStorage({
  destination: UPLOAD_DIRECTORY,
  filename: (req, file, callback) => {
    const savedFileName = `${uuidv4()}${extname(file?.originalname)}`;
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
    fileSize: FILE_SIZE_LIMIT_MB,
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

    const job = await this.uploadService.createJob({
      filePath: file.path,
    });
    const id = this.encryptionUtil.encrypt(job.id);
    res.send({ jobId: id });
    this.uploadService.processJob(file, job);
    return;
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

    const safeUploads: API.FileListResponse = uploads.map((upload) => ({
      id: this.encryptionUtil.encrypt(upload.id),
      name: upload?.originalName,
    }));

    return safeUploads;
  }

  @Delete(`${API.Endpoints.Delete}/:encryptedId`)
  async deleteOne(@Param('encryptedId') encryptedId: string) {
    try {
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
