import {
  FileListResponse,
  UploadFileResponse,
} from '@ac-assignment/shared-types';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
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
import { CsvParseResult, FilesUtil } from './utils/files.util';
import { UploadService } from './services/upload.service';
import { FileHashUtil } from './utils/file-hash.util';
import { EncryptionUtil } from './utils/encryption.util';

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
    fileSize: FILE_SIZE_LIMIT_MB(10),
  },
};

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesUtil: FilesUtil,
    private readonly uploadService: UploadService,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', uploadRequestOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!file) {
      this.logger.error('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    //Check for duplicates
    const fileHash = await FileHashUtil.calculateHash(file.path).catch(() => {
      throw new InternalServerErrorException('File hash calculation failed');
    });
    const existingFile = await this.uploadService.findFileByHash(fileHash);
    if (existingFile) {
      res.status(HttpStatus.OK);
      const result: UploadFileResponse = {
        isDuplicate: true,
      };
      return result;
    }

    this.logger.log(`File uploaded successfully: ${file.originalname}`);
    this.logger.debug(
      `File details: ${JSON.stringify(
        {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          destination: file.destination,
          path: file.path,
        },
        null,
        2,
      )}`,
    );

    let csvParseResult: CsvParseResult | null = null;
    this.logger.log('Parsing CSV file...');
    try {
      csvParseResult = await this.filesUtil.parseAndSaveAsJson(file.path);

      if (csvParseResult?.success) {
        this.logger.log(`CSV parsed successfully`);
        this.logger.log('About to call uploadService.createUpload...');
        const uploadRecord = await this.uploadService.createUpload({
          originalName: file.originalname,
          filename: path.basename(file.filename),
          fileHash,
        });
        this.logger.log(`Upload record created with ID: ${uploadRecord.id}`);
      } else {
        throw new InternalServerErrorException(
          csvParseResult.errorMessage || 'Parsing CSV failed',
        );
      }
    } catch (error) {
      this.logger.error(`CSV parsing error: ${error.message}`);
      throw new BadRequestException(`CSV parsing error: ${error.message}`);
    }

    const result: UploadFileResponse = {
      isDuplicate: false,
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      },
    };
    return result;
  }

  @Get('status')
  getUploadStatus() {
    return {
      message: 'Upload service is running',
      maxFileSize: '1000MB',
      allowedTypes: ['csv'],
    };
  }

  @Get('list')
  async getAllFiles() {
    const uploads = await this.uploadService.findAll();

    // Encrypt IDs and remove sensitive information
    const safeUploads: FileListResponse = uploads.map((upload) => ({
      id: this.encryptionUtil.encryptId(upload.id), // Encrypted ID
      name: upload.originalName,
    }));

    return safeUploads;
  }

  @Get(':encryptedId')
  async getFileById(@Param('encryptedId') encryptedId: string) {
    try {
      // Decrypt the ID
      const realId = this.encryptionUtil.decryptId(encryptedId);
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

  @Get('stats')
  async getUploadStats() {
    const stats = await this.uploadService.getUploadStats();
    return {
      message: 'Upload statistics retrieved successfully',
      stats,
    };
  }

  @Delete('delete/:encryptedId')
  async deleteOne(@Param('encryptedId') encryptedId: string) {
    try {
      // Decrypt the ID
      const id = this.encryptionUtil.decryptId(encryptedId);
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

  @Delete("deleteAll")
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
