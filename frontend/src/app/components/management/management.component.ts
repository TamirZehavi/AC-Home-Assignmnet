import { FileListResponse } from '@ac-assignment/shared-types';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { catchError, EMPTY, tap } from 'rxjs';
import { LoadingStatus, UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-management',
  imports: [MatIcon],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent implements OnInit {
  uploadService = inject(UploadService);
  loadingStatus = signal<LoadingStatus>('loading');

  isLoading = computed(() => {
    const loadingState = this.loadingStatus();
    return loadingState === 'loading';
  });

  files: FileListResponse = [];

  ngOnInit(): void {
    this.uploadService
      .getList()
      .pipe(
        tap((response) => {
          this.files = response;
          this.loadingStatus.set('completed');
        }),
        catchError(() => {
          this.loadingStatus.set('error');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  onDeleteFileClick(id: string) {
    this.uploadService.delete(id).subscribe();
  }

  onDeleteAllClick() {
    this.uploadService
      .deleteAll()
      .pipe(
        tap(() => {
          this.files = [];
        }),
      )
      .subscribe();
  }
}
