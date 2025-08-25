import { Common, Enum } from "../util.types";

export namespace API {
  export type UploadFileResponse = { jobId: string };

  export type FileListResponse = { name: string; id: string }[];

  export type JobStatusResponse = {
    status: Common.LoadingStatus;
  };

  export const Endpoints = {
    Delete: "delete",
    DeleteAll: "deleteAll",
    Upload: "upload",
    JobStatus: "jobStatus",
    Download: "download",
    List: "list",
  } as const;
  export type Endpoints = Enum<typeof Endpoints>;

  export const Controllers = {
    Files: "files",
    Jobs: "jobs",
  } as const;
  export type Controllers = Enum<typeof Controllers>;
}
