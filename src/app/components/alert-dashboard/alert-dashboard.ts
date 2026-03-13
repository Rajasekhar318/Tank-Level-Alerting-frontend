import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  templateUrl: './alert-dashboard.html',
  styleUrls: ['./alert-dashboard.css']
})
export class AlertDashboard {
  alerts: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getAlerts().subscribe((data: any[]) => {
      this.alerts = data ?? [];
    });
  }
}