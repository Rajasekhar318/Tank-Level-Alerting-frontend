import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-fuel-dashboard',
  standalone: true,
  templateUrl: './fuel-dashboard.html',
  styleUrls: ['./fuel-dashboard.css']
})
export class FuelDashboard {
  readings: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getReadings().subscribe((data: any[]) => {
      this.readings = Array.isArray(data) ? data : [];
    });
  }
}