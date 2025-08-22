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

  @Post()
  @UseInterceptors(FileInterceptor('file', uploadRequestOptions))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
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

    return {
      message: 'File uploaded successfully',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      },
    };
  }

  @Get('status')
  getUploadStatus() {
    return {
      message: 'Upload service is running',
      maxFileSize: '1000MB',
      allowedTypes: ['csv'],
    };
  }
}
