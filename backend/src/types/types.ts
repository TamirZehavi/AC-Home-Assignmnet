export interface FileCreatedResponse {
  isDuplicate: false;
  file: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
  };
}

export interface ExistingFileResponse {
  isDuplicate: true;
}

export type UploadFileResponse = FileCreatedResponse | ExistingFileResponse;
