import { Injectable, Logger } from '@nestjs/common';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface CsvParseResult {
  success: boolean;
  data?: any[];
  jsonFilePath?: string;
  rowCount?: number;
  error?: string;
}

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

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
        return resolve({
          success: false,
          error: 'CSV file not found',
        });
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

            resolve({
              success: true,
              data: results,
              jsonFilePath: jsonFilePath,
              rowCount: results.length,
            });
          } catch (error) {
            this.logger.error(`Error saving JSON file: ${error.message}`);
            resolve({
              success: false,
              error: `Error saving JSON: ${error.message}`,
            });
          }
        })
        .on('error', (error) => {
          this.logger.error(`Error parsing CSV: ${error.message}`);
          resolve({
            success: false,
            error: `Error parsing CSV: ${error.message}`,
          });
        });
    });
  }
}
