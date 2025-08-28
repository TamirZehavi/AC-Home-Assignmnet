import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeConfigService } from './common/config/safe-config.service';
import { throttles } from './common/config/throttle.consts';
import { EnvironmentVariables } from './common/types/env.types';
import { ThrottleType } from './common/types/util.types';
import { Job } from './files/entities/job.entity';
import { Upload } from './files/entities/upload.entity';
import { FilesModule } from './files/files.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: SafeConfigService) => ({
        type: 'sqlite',
        database: configService.get(
          EnvironmentVariables.DatabaseName,
          'uploads.db',
        ),
        entities: [Upload, Job],
        synchronize: true, 
      }),
    }),
    ThrottlerModule.forRoot([throttles[ThrottleType.Long]]),
    FilesModule,
  ],
  providers: [
    SafeConfigService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
