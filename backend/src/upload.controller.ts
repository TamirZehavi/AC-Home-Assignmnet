import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CsvParseResult, CsvParserService } from './csv-parser.service';
import { UploadService } from './services/upload.service';
import { UplopadFileResponse } from './types/common.types';

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
    @Req() req: Request,
  ) {
    this.logger.debug('Upload endpoint called');
    this.logger.debug(
      `Request headers: ${JSON.stringify(req.headers, null, 2)}`,
    );

    if (!file) {
      this.logger.error('No file uploaded');
      throw new BadRequestException('No file uploaded');
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

    // Save upload record to database
    this.logger.log('About to call uploadService.createUpload...');
    const uploadRecord = await this.uploadService.createUpload({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });
    this.logger.log(`Upload record created with ID: ${uploadRecord.id}`);

    // Parse CSV file if it's a CSV
    let csvParseResult: CsvParseResult | null = null;
    this.logger.log('Parsing CSV file...');
    try {
      csvParseResult = await this.csvParserService.parseAndSaveAsJson(
        file.path,
      );

      // Update database record with parsing results
      await this.uploadService.updateUploadParsing(uploadRecord.id, {
        isParsed: csvParseResult?.success || false,
        jsonFilePath: csvParseResult?.jsonFilePath,
        rowCount: csvParseResult?.rowCount,
        parseError: csvParseResult?.success ? undefined : csvParseResult?.error,
      });

      if (csvParseResult?.success) {
        this.logger.log(
          `CSV parsed successfully: ${csvParseResult.rowCount} rows`,
        );
      } else {
        this.logger.error(`CSV parsing failed: ${csvParseResult?.error}`);
      }
    } catch (error) {
      this.logger.error(`CSV parsing error: ${error.message}`);

      // Update database record with error
      await this.uploadService.updateUploadParsing(uploadRecord.id, {
        isParsed: false,
        parseError: error.message,
      });
    }

    const result: UplopadFileResponse = {
      message: 'File uploaded successfully',
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
  async getAllUploads() {
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
