import { Injectable, Logger } from '@nestjs/common';
import csv from 'csv-parser';
import { Transform } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

export interface CsvParseResult {
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class FilesUtil {
  private readonly logger = new Logger(FilesUtil.name);

  async parseAndSaveAsJson(csvFilePath: string): Promise<CsvParseResult> {
    return new Promise((resolve, reject) => {
      const fileName = path.basename(csvFilePath, '.csv');
      const jsonFilePath = path.join(
        path.dirname(csvFilePath),
        `${fileName}.json`,
      );

      this.logger.log(`Starting to parse CSV: ${csvFilePath}`);

      if (!fs.existsSync(csvFilePath)) {
        this.logger.error(`CSV file not found: ${csvFilePath}`);
        const result: CsvParseResult = {
          success: false,
          errorMessage: 'CSV file not found',
        };
        return resolve(result);
      }

      const writeStream = fs.createWriteStream(jsonFilePath);
      
      let isFirst = true;
      let hasData = false;

      const transformStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          if (isFirst) {
            writeStream.write('[');
            isFirst = false;
            hasData = true;
            callback(null, JSON.stringify(chunk));
          } else {
            callback(null, ',' + JSON.stringify(chunk));
          }
        },
        flush(callback) {
          if (hasData) {
            writeStream.write(']');
          } else {
            writeStream.write('[]');
          }
          callback();
        }
      });

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .pipe(transformStream)
        .pipe(writeStream)
        .on('finish', () => {
          this.logger.log(`Successfully parsed CSV and saved to JSON`);
          const result: CsvParseResult = {
            success: true,
          };
          resolve(result);
        })
        .on('error', (error) => {
          this.logger.error(`Error parsing CSV: ${error.message}`);
          const result: CsvParseResult = {
            success: false,
            errorMessage: `Error parsing CSV: ${error.message}`,
          };
          resolve(result);
        });
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found: ${filePath}`);
        return resolve(); // Don't reject if file doesn't exist
      }

      fs.unlink(filePath, (error) => {
        if (error) {
          this.logger.error(`Error deleting file: ${error.message}`);
          return reject(error);
        }
        this.logger.log(`File deleted successfully: ${filePath}`);
        resolve();
      });
    });
  }

  async deleteUploadFile(filename: string): Promise<void> {
    const baseName = path.parse(filename).name;
    const uploadsDir = path.join(process.cwd(), 'uploads');

    const csvPath = path.join(uploadsDir, `${baseName}.csv`);
    const jsonPath = path.join(uploadsDir, `${baseName}.json`);

    let jsonDeleted = false;
    let csvDeleted = false;
    try {
      await this.deleteFile(csvPath).then(() => {
        csvDeleted = true;
      });
    } catch (error) {
      this.logger.error(`Error deleting csv file: ${error.message}`);
    }

    try {
      await this.deleteFile(jsonPath).then(() => {
        jsonDeleted = true;
      });
    } catch (error) {
      this.logger.error(`Error deleting json file: ${error.message}`);
    }

    if (!csvDeleted && !jsonDeleted) {
      throw new Error('Failed to delete uploaded files');
    }
  }
}
