import { Routes } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { MainComponent } from './components/main/main.component';
import { ManagementComponent } from './components/management/management.component';
import { AppRoutes } from './types/routes.types';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: AppRoutes.Uploads,
        component: FileUploadComponent,
      },
      {
        path: AppRoutes.Management,
        component: ManagementComponent,
      },
      {
        path: '**',
        redirectTo: AppRoutes.Uploads,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
