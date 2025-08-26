import { API, Common } from '@ac-assignment/shared-types';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UploadService } from '../../services/upload.service';
import { UploadProgress } from '../../types/upload.types';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBar,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  state = {
    uploadProgress: signal<UploadProgress | null>(null),
    uploading: signal(false),
    selectedFile: signal<File | null>(null),
    jobStatus: signal<API.JobStatusResponse | null>(null),
  };

  loadingToStatusText: {[key in Common.LoadingStatus]: string} = {
    [Common.LoadingStatus.Pending]: 'Upload Pending',
    [Common.LoadingStatus.Loading]: 'Uploading...',
    [Common.LoadingStatus.Success]: 'Upload Successful!',
    [Common.LoadingStatus.Error]: 'Upload Failed',
  };

  uploadService = inject(UploadService);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.state.selectedFile.set(file);
      this.startUpload(file);
      this.clearFileSelection();
    }
  }

  private clearFileSelection() {
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getProgressColor(
    status?: Common.LoadingStatus,
  ): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case Common.LoadingStatus.Success:
        return 'primary';
      case Common.LoadingStatus.Error:
        return 'warn';
      default:
        return 'accent';
    }
  }

  formatResponse(response: any): string {
    return JSON.stringify(response, null, 2);
  }

  private startUpload(file: File) {
    this.state.uploading.set(true);
    this.state.uploadProgress.set(null);

    this.uploadService.uploadFileWithAutoDownload(file).subscribe({
      next: (value) => {
        if (value.progress) this.state.uploadProgress.set(value.progress);
        if (value.jobStatus) this.state.jobStatus.set(value.jobStatus);
        console.log('Upload progress:', value);
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.state.uploadProgress.set({
          progress: 0,
          status: 'error',
          response: null,
        });
        this.state.uploading.set(false);
      },
      complete: () => {
        console.log('Upload completed');
        this.state.uploading.set(false);
      },
    });
  }
}
