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
}
