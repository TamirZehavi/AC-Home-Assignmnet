import { API, Common } from '@ac-assignment/shared-types';

export type UploadProgress = {
  progress: number;
  status: Common.LoadingStatus;
  response: API.UploadFileResponse | null;
}

export type UploadFileResponse = {
  progress?: UploadProgress;
  jobStatus?: API.JobStatusResponse;
  downloadComplete?: boolean;
};
