import { API, Common } from '@ac-assignment/shared-types';

export type UploadProgress = {
  progress: number;
  status: Common.LoadingStatus;
  file?: File;
  response?: API.UploadFileResponse;
}

export type UploadFileResponse = {
  progress?: UploadProgress;
  jobStatus?: API.JobStatusResponse;
  downloadComplete?: boolean;
};
