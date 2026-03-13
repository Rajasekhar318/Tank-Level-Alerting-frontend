import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-generator-dashboard',
  standalone: true,
  templateUrl: './generator-dashboard.html',
  styleUrls: ['./generator-dashboard.css']
})
export class GeneratorDashboard {
  generators: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getGenerators().subscribe((data: any[]) => {
      this.generators = Array.isArray(data) ? data : [];
    });
  }
}