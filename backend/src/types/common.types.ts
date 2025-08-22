export type UplopadFileResponse = {
  message: string;
  file: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
  };
};
