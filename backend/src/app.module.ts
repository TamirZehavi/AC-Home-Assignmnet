import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './files/entities/job.entity';
import { Upload } from './files/entities/upload.entity';
import { FilesModule } from './files/files.module';
import { SafeConfigService } from './common/config/safe-config.service';
import { EnvironmentVariables } from './common/types/env.types';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      envFilePath: '.env', // Specify .env file path
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: SafeConfigService) => ({
        type: 'sqlite',
        database: configService.get(
          EnvironmentVariables.DatabasePath,
          'uploads.db',
        ),
        entities: [Upload, Job],
        synchronize: true, // Should be false in production
      }),
    }),
    FilesModule,
  ],
  providers: [SafeConfigService],
})
export class AppModule {}
