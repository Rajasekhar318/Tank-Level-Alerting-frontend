import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs'; 
 
export interface Generator {
  generatorId: string | number;
  generatorTotalCapacity: number;
  generatorHighLevelpoint: number;
  generatorLowLevelpoint: number;
}
 
@Component({
  selector: 'app-generator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generator-dashboard.html',
  styleUrls: ['./generator-dashboard.css']
})
export class GeneratorDashboard implements OnInit {
  isLoading: boolean = true;
  generators: Generator[] = [];
  searchText: string = '';
  private refreshSub?: Subscription;
 
  // --- Sorting State ---
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
 
  // --- KPI values ---
  totalGenerators: number = 0;
  highAlertCount: number = 0; // Replaces totalCapacity
  lowAlertCount: number = 0;  // Replaces avgHighAlert
 
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}
 
  loadData() {
    // 1. Fetch Generator Configuration Data
    this.api.getGenerators().subscribe({
      next: (data: any) => {
        this.generators = Array.isArray(data) ? data : [];
        this.totalGenerators = this.generators.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load generators', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
 
    // 2. Fetch Live Alerts Data for the new KPI Cards
    this.api.getAlerts().subscribe({
      next: (alerts: any[]) => {
        const activeAlerts = alerts || [];
       
        // Count how many alerts are categorized as "HIGH"
        this.highAlertCount = activeAlerts.filter(a =>
          a.alertType && (a.alertType.toUpperCase().includes('HIGH') || a.alertType.toUpperCase().includes('MAX'))
        ).length;
 
        // Count how many alerts are categorized as "LOW"
        this.lowAlertCount = activeAlerts.filter(a =>
          a.alertType && (a.alertType.toUpperCase().includes('LOW') || a.alertType.toUpperCase().includes('MIN'))
        ).length;
 
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load alerts for KPIs', err)
    });
    }

  ngOnInit() {
    this.loadData();
    
        this.refreshSub = interval(10000).subscribe(() => {
          this.loadData();
          console.log('Dashboard auto-refreshed at', new Date().toLocaleTimeString()); 
        });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }
 
  getGeneratorStatus(generator: Generator): string {
    if (generator.generatorTotalCapacity <= 0) {
      return 'Offline';
    }
    return 'Active';
  }
 
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
 
  get filteredGenerators(): Generator[] {
    const keyword = this.searchText.trim().toLowerCase();
   
    let result = this.generators;
    if (keyword) {
      result = result.filter(g => String(g.generatorId).toLowerCase().includes(keyword));
    }
 
    if (this.sortColumn) {
      result = [...result].sort((a, b) => {
        let valA: any;
        let valB: any;
 
        if (this.sortColumn === 'status') {
          valA = this.getGeneratorStatus(a);
          valB = this.getGeneratorStatus(b);
        } else {
          valA = a[this.sortColumn as keyof Generator];
          valB = b[this.sortColumn as keyof Generator];
        }
 
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
 
    return result;
  }
 
  getAlertBarWidth(alertValue: number, totalCapacity: number): string {
    if (!totalCapacity || totalCapacity === 0) return '0%';
    const percent = (alertValue / totalCapacity) * 100;
    return Math.min(percent, 100) + '%';
  }
 
  getAlertBarColor(alertValue: number, totalCapacity: number): string {
    if (!totalCapacity || totalCapacity === 0) return '#ef4444';
    const percent = (alertValue / totalCapacity) * 100;
    if (percent > 60) return '#10b981';
    if (percent > 30) return '#f59e0b';
    return '#ef4444';
  }
}