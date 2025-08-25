import { API, Common } from '@ac-assignment/shared-types';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { catchError, EMPTY, tap } from 'rxjs';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-management',
  imports: [MatIcon],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent implements OnInit {
  uploadService = inject(UploadService);
  loadingStatus = signal<Common.LoadingStatus>('loading');

  isLoading = computed(() => {
    return this.loadingStatus() === 'loading';
  });

  files = signal<API.FileListResponse>([]);

  ngOnInit(): void {
    this.uploadService
      .getList()
      .pipe(
        tap((response) => {
          this.files.set(response);
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
    this.uploadService
      .delete(id)
      .pipe(
        tap(() => {
          this.files.set(this.files().filter((file) => file.id !== id));
        }),
      )
      .subscribe();
  }

  onDeleteAllClick() {
    this.uploadService
      .deleteAll()
      .pipe(
        tap(() => {
          this.files.set([]);
        }),
      )
      .subscribe();
  }
}
