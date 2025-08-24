import { UploadFileResponse } from '@ac-assignment/shared-types';
import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
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
import { CsvParseResult, CsvParserService } from './csv-parser.service';
import { UploadService } from './services/upload.service';
import { FileHashUtil } from './utils/file-hash.util';

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

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly csvParserService: CsvParserService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
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
      csvParseResult = await this.csvParserService.parseAndSaveAsJson(
        file.path,
      );

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
    return {
      message: 'Upload list retrieved successfully',
      uploads,
    };
  }

  @Get('stats')
  async getUploadStats() {
    const stats = await this.uploadService.getUploadStats();
    return {
      message: 'Upload statistics retrieved successfully',
      stats,
    };
  }
}
