import { Enum } from '@ac-assignment/shared-types';

export const EnvironmentVariables = {
  SecretKey: 'SECRET_KEY',
  MaxFileSizeMB: 'MAX_FILE_SIZE_MB',
  UploadDirectory: 'UPLOAD_DIRECTORY',
  JobCleanupDays: 'JOB_CLEANUP_DAYS',
  JobCleanupCron: 'JOB_CLEANUP_CRON',
  DatabasePath: 'DATABASE_PATH',
} as const;

export type EnvironmentVariables = Enum<typeof EnvironmentVariables>;

export type EnvironmentVariableTypes = {
  [EnvironmentVariables.SecretKey]: string;
  [EnvironmentVariables.MaxFileSizeMB]: number;
  [EnvironmentVariables.UploadDirectory]: string;
  [EnvironmentVariables.JobCleanupDays]: number;
  [EnvironmentVariables.JobCleanupCron]: string;
  [EnvironmentVariables.DatabasePath]: string;
};
