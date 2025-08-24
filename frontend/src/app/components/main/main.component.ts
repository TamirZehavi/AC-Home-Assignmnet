import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { AppRoutes } from '../../types/routes.types';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, SideBarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  initialRoute = AppRoutes.Uploads;
  router = inject(Router);

  ngOnInit(): void {
    this.navigate(this.initialRoute);
  }

  routeSelected(route: AppRoutes) {
    this.navigate(route);
  }

  navigate(route: AppRoutes) {
    this.router.navigate([route]);
  }
}
