import { Injectable, Logger } from '@nestjs/common';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface CsvParseResult {
  success: boolean;
  data?: any[];
  errorMessage?: string;
}

@Injectable()
export class FilesUtil {
  private readonly logger = new Logger(FilesUtil.name);

  async parseAndSaveAsJson(csvFilePath: string): Promise<CsvParseResult> {
    return new Promise((resolve) => {
      const results: any[] = [];
      const fileName = path.basename(csvFilePath, '.csv');
      const jsonFilePath = path.join(
        path.dirname(csvFilePath),
        `${fileName}.json`,
      );

      this.logger.log(`Starting to parse CSV: ${csvFilePath}`);

      // Check if file exists
      if (!fs.existsSync(csvFilePath)) {
        this.logger.error(`CSV file not found: ${csvFilePath}`);
        const result: CsvParseResult = {
          success: false,
          errorMessage: 'CSV file not found',
        };
        return resolve(result);
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
          // Clean up the data - remove empty values and trim strings
          const cleanedData: any = {};
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (typeof value === 'string') {
              cleanedData[key.trim()] = value.trim();
            } else {
              cleanedData[key.trim()] = value;
            }
          });
          results.push(cleanedData);
        })
        .on('end', () => {
          try {
            // Save as JSON file
            fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));

            this.logger.log(
              `Successfully parsed ${results.length} rows from CSV`,
            );
            this.logger.log(`JSON saved to: ${jsonFilePath}`);
            const result: CsvParseResult = {
              success: true,
              data: results,
            };

            resolve(result);
          } catch (error) {
            this.logger.error(`Error saving JSON file: ${error.message}`);
            const result: CsvParseResult = {
              success: false,
              errorMessage: `Error saving JSON: ${error.message}`,
            };
            resolve(result);
          }
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

  // Alternative: Add a specific method for uploads folder
  async deleteUploadFile(filename: string): Promise<void> {
    const baseName = path.parse(filename).name;
    const uploadsDir = path.join(process.cwd(), 'uploads');

    const csvPath = path.join(uploadsDir, `${baseName}.csv`);
    const jsonPath = path.join(uploadsDir, `${baseName}.json`);
    try {
      await this.deleteFile(csvPath);
      await this.deleteFile(jsonPath);
    } catch (error) {
      this.logger.error(`Error deleting upload files: ${error.message}`);
      throw Error;
    }
  }
}
