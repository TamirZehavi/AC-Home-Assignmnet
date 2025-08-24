import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AppRoutes } from '../../types/routes.types';
import { KeyValuePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-side-bar',
  imports: [MatIcon, NgClass, KeyValuePipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  @Input({ required: true }) selectedRoute: AppRoutes = AppRoutes.Uploads;
  @Output() onRouteSelected = new EventEmitter<AppRoutes>();
  router = inject(Router);
  icons = {
    [AppRoutes.Management]: {
      icon: 'manage_accounts',
      label: 'Manage Accounts',
      selected: false,
    },
    [AppRoutes.Uploads]: {
      icon: 'upload',
      label: 'Uploads',
      selected: false,
    },
  };

  onRouteSelect(route: AppRoutes) {
    this.onRouteSelected.emit(route);
    this.selectedRoute = route;
  }
}

type SideBarRouteConfig = {
  [key in AppRoutes]?: {
    icon: string;
    label: string;
    selected: boolean;
  };
};
