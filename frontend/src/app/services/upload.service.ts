import { API, Common } from '@ac-assignment/shared-types';
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UploadFileResponse, UploadProgress } from '../types/upload.types';

const DEFAULT_POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 100;

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = `/api/${API.Controllers.Files}`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/${API.Endpoints.Upload}`,
      formData,
      {
        reportProgress: true,
      },
    );

    return this.http.request<API.UploadFileResponse>(req).pipe(
      map((event) => this.determineProgress(event, file)),
      catchError((error) => of(error)),
    );
  }

  getList() {
    return this.http.get<API.FileListResponse>(
      `${this.apiUrl}/${API.Endpoints.List}`,
    );
  }

  delete(id: string) {
    return this.http.delete(`${this.apiUrl}/${API.Endpoints.Delete}/${id}`);
  }

  deleteAll() {
    return this.http.delete(`${this.apiUrl}/${API.Endpoints.DeleteAll}`);
  }

  getJobStatus(jobId: string) {
    return this.http.get<API.JobStatusResponse>(
      `${this.apiUrl}/${API.Endpoints.JobStatus}/${jobId}`,
    );
  }

  // Long-polling implementation
  pollJobStatus(
    jobId: string,
    maxAttempts: number = MAX_POLL_ATTEMPTS,
    intervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  ): Observable<API.JobStatusResponse> {
    return new Observable((observer) => {
      let attempts = 0;

      const poll = () => {
        if (attempts >= maxAttempts) {
          observer.error(
            new Error('Job polling timeout - max attempts reached'),
          );
          return;
        }

        attempts++;

        this.getJobStatus(jobId).subscribe({
          next: (response) => {
            if (
              response.status === Common.LoadingStatus.Success ||
              response.status === Common.LoadingStatus.Error
            ) {
              observer.next(response);
              observer.complete();
              return;
            }

            if (
              response.status === Common.LoadingStatus.Loading ||
              response.status === Common.LoadingStatus.Pending
            ) {
              setTimeout(poll, intervalMs);
              return;
            }

            observer.error(new Error(`Unknown job status: ${response.status}`));
          },
          error: (error) => {
            observer.error(error);
          },
        });
      };

      poll();
    });
  }

  // Complete upload flow with auto-download
  uploadFileWithAutoDownload(file: File): Observable<UploadFileResponse> {
    return new Observable((observer) => {
      this.uploadFile(file).subscribe({
        next: (progress) => {
          observer.next({ progress });

          if (
            progress.status === Common.LoadingStatus.Success &&
            progress.response?.jobId
          ) {
            const jobId = progress.response.jobId;

            this.pollJobStatus(jobId).subscribe({
              next: (jobStatus) => {
                observer.next({ jobStatus });

                // Step 3: Auto-download if successful
                if (jobStatus.status === Common.LoadingStatus.Success) {
                  this.downloadProcessedFile(jobId).subscribe({
                    next: (blob) => {
                      const filename = `${file.name.replace('.csv', '')}-processed.json`;
                      this.triggerDownload(blob, filename);
                      observer.next({ downloadComplete: true });
                      observer.complete();
                    },
                    error: (downloadError) => {
                      observer.error(downloadError);
                    },
                  });
                } else {
                  // Job failed
                  observer.complete();
                }
              },
              error: (pollError) => {
                observer.error(pollError);
              },
            });
          }
        },
        error: (uploadError) => {
          observer.error(uploadError);
        },
      });
    });
  }

  downloadProcessedFile(jobId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${API.Endpoints.Download}/${jobId}`, {
      responseType: 'blob',
    });
  }

  // Auto-download helper method
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private determineProgress(
    event: HttpEvent<API.UploadFileResponse>,
    file: File,
  ): UploadProgress {
    switch (event.type) {
      case HttpEventType.Sent:
        return {
          progress: 0,
          status: 'loading',
          file,
        };

      case HttpEventType.UploadProgress:
        const progress = event.total
          ? Math.round((100 * event.loaded) / event.total)
          : 0;
        return {
          progress,
          status: 'loading',
          file,
        };

      case HttpEventType.Response:
        return {
          progress: 100,
          status: 'success',
          file,
          response: event.body ?? undefined,
        };

      default:
        return {
          progress: 0,
          status: 'pending',
          file,
        };
    }
  }
}
