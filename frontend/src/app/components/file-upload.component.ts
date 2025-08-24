import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import {
  LoadingStatus,
  UploadProgress,
  UploadService,
} from '../services/upload.service';

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
  uploadProgress: UploadProgress | null = null;
  uploading = false;
  uploadService = inject(UploadService);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.startUpload(file);
      this.clearFileSelection();
    }
  }

  private clearFileSelection() {
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getProgressColor(status: LoadingStatus): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'completed':
        return 'primary';
      case 'error':
        return 'warn';
      default:
        return 'accent';
    }
  }

  formatResponse(response: any): string {
    return JSON.stringify(response, null, 2);
  }

  private startUpload(file: File) {
    this.uploading = true;
    this.uploadProgress = null;

    this.uploadService.uploadFile(file).subscribe({
      next: (progress) => {
        this.uploadProgress = progress;
        console.log('Upload progress:', progress);
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadProgress = {
          progress: 0,
          status: 'error',
          file,
        };
        this.uploading = false;
      },
      complete: () => {
        console.log('Upload completed');
        this.uploading = false;
      },
    });
  }
}
