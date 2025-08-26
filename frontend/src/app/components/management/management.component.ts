import { API, Common } from '@ac-assignment/shared-types';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { catchError, EMPTY, tap } from 'rxjs';
import { UploadService } from '../../services/upload.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-management',
  imports: [MatIcon, NgClass],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent implements OnInit {
  uploadService = inject(UploadService);
  loadingStatus = signal<Common.LoadingStatus>('loading');
  deleteAllError: string | null = null;

  isLoading = computed(() => {
    return this.loadingStatus() === 'loading';
  });

  files = signal<FilesModel>([]);

  ngOnInit(): void {
    this.uploadService
      .getList()
      .pipe(
        tap((response) => {
          this.mapToModel(response);
          this.loadingStatus.set(Common.LoadingStatus.Success);
        }),
        catchError(() => {
          this.loadingStatus.set(Common.LoadingStatus.Error);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  onDeleteFileClick(id: string) {
    this.updateFile(id, { loading: true, error: false });
    this.uploadService
      .delete(id)
      .pipe(
        tap(() => {
          this.files.set(this.files().filter((file) => file.id !== id));
        }),
      )
      .subscribe({
        error: () => {
          this.updateFile(id, { error: true, loading: false });
        },
      });
  }

  onDeleteAllClick() {
    this.loadingStatus.set(Common.LoadingStatus.Loading);
    this.uploadService
      .deleteAll()
      .pipe(
        tap(() => {
          this.files.set([]);
          this.loadingStatus.set(Common.LoadingStatus.Pending);
        }),
      )
      .subscribe({
        error: () => {
          this.deleteAllError = 'Failed to delete all files';
          this.loadingStatus.set(Common.LoadingStatus.Error);
        },
      });
  }

  mapToModel(files: API.FileListResponse) {
    const model = files.map((file) => {
      const fileConfig: FileConfig = {
        name: file.name,
        id: file.id,
        error: false,
        loading: false,
      };
      return fileConfig;
    });
    this.files.set(model);
  }

  private updateFile(id: string, patch: Partial<FileConfig>) {
    this.files.update((files) => {
      const index = files.findIndex((file) => file.id === id);
      if (index !== -1) {
        files[index] = { ...files[index], ...patch };
      }
      return files;
    });
  }
}

type FilesModel = FileConfig[];

type FileConfig = {
  id: string;
  name: string;
  error: boolean;
  loading: boolean;
};
