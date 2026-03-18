import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // <-- Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Alert } from '../../models/alert'; 
import { Subscription, interval } from 'rxjs'; 

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-dashboard.html',
  styleUrls: ['./alert-dashboard.css']
})
export class AlertDashboard implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  currentFilter: string = 'ALL'; 
  searchTerm: string = ''; 

  private refreshSub?: Subscription;

  // --- UPDATED: Injected ChangeDetectorRef ---
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

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

  // --- UPDATED: Forces UI to repaint with new data ---
  loadData() {
    this.api.getAlerts().subscribe((data: Alert[]) => {
      // Creates a completely new array reference in memory
      this.alerts = [...(data ?? [])]; 
      
      // Forces the UI to repaint
      this.cdr.detectChanges(); 
    });
  }

  // --- EXPORT TO CSV LOGIC ---
  exportToCSV() {
    const headers = ['Alert ID', 'Generator', 'Reading', 'Alert Type'];
    const rows = this.filteredAlerts.map(a => 
      `${a.alertId},${a.generatorId},${a.levelreadingId},${a.alertType}`
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'alerts_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- GETTERS & FORMATTERS ---
  get totalAlerts(): number { return this.alerts.length; }
  get highRiskAlerts(): number { return this.alerts.filter(a => a.alertType === 'HIGH_LEVEL_ALERT').length; }
  get suddenDrops(): number { return this.alerts.filter(a => a.alertType === 'SUDDEN_DROP_ALERT').length; }
  get lowRiskAlerts(): number { return this.alerts.filter(a => a.alertType === 'LOW_LEVEL_ALERT').length; }

  get pieChartStyle() { 
    if (this.totalAlerts === 0) return { background: '#f3f4f6' }; 
    const highPct = (this.highRiskAlerts / this.totalAlerts) * 100;
    const dropPct = (this.suddenDrops / this.totalAlerts) * 100;
    const dropStart = highPct;
    const lowStart = highPct + dropPct;
    return {
      background: `conic-gradient(#ef4444 0% ${highPct}%, #f59e0b ${dropStart}% ${lowStart}%, #0284c7 ${lowStart}% 100%)`
    };
  }
  
  setFilter(filterType: string) { this.currentFilter = filterType; }
  updateSearch(event: Event) { this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase(); }

  get filteredAlerts(): Alert[] {
    let result = this.alerts;
    if (this.currentFilter !== 'ALL') { result = result.filter(a => a.alertType === this.currentFilter); }
    if (this.searchTerm.trim() !== '') {
      result = result.filter(a => 
        a.generatorId?.toString().includes(this.searchTerm) ||
        a.alertId?.toString().includes(this.searchTerm) ||
        a.levelreadingId?.toString().includes(this.searchTerm) ||
        this.formatType(a.alertType).toLowerCase().includes(this.searchTerm)
      );
    }
    return result;
  }

  formatType(type: string | undefined): string { if (!type) return 'UNKNOWN'; return type.replace(/_/g, ' '); }
  
  getBadgeClass(type: string | undefined): string {
    switch (type) {
      case 'HIGH_LEVEL_ALERT': return 'badge-high';
      case 'SUDDEN_DROP_ALERT': return 'badge-drop';
      case 'LOW_LEVEL_ALERT': return 'badge-low';
      default: return 'badge-default';
    }
  }
}