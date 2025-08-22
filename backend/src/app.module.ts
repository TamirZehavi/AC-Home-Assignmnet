import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadController } from './upload.controller';
import { CsvParserService } from './csv-parser.service';
import { UploadService } from './services/upload.service';
import { Upload } from './entities/upload.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'uploads.db',
      entities: [Upload],
      synchronize: true, // Auto-create tables (only for development)
      logging: true, // Enable SQL query logging
    }),
    TypeOrmModule.forFeature([Upload]),
  ],
  controllers: [AppController, UploadController],
  providers: [AppService, CsvParserService, UploadService],
})
export class AppModule {}
