import { UploadFileResponse } from '@ac-assignment/shared-types';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpRequest,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UploadProgress {
  progress: number;
  status: LoadingStatus;
  file?: File;
  response?: UploadFileResponse;
}

export type LoadingStatus = 'pending' | 'uploading' | 'completed' | 'error';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = '/api/upload';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', this.apiUrl, formData, {
      reportProgress: true,
    });

    return this.http.request<UploadFileResponse>(req).pipe(
      map((event) => determineProgress(event)),
      catchError((error) => of(error)),
    );

    function determineProgress(
      event: HttpEvent<UploadFileResponse>,
    ): UploadProgress {
      switch (event.type) {
        case HttpEventType.Sent:
          return {
            progress: 0,
            status: 'uploading',
            file,
          };

        case HttpEventType.UploadProgress:
          const progress = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
          return {
            progress,
            status: 'uploading',
            file,
          };

        case HttpEventType.Response:
          return {
            progress: 100,
            status: 'completed',
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
}
