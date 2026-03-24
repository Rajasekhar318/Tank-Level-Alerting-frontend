import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  // --- NEW: Pagination State ---
  currentPage: number = 1;
  itemsPerPage: number = 5;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.loadData();

    this.refreshSub = interval(10000).subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  loadData() {
    this.api.getAlerts().subscribe((data: Alert[]) => {
      this.alerts = [...(data ?? [])]; 
      // Reverse so newest alerts show up on page 1
      this.alerts.reverse(); 
      this.cdr.detectChanges(); 
    });
  }

  exportToCSV() {
    const headers = ['Alert ID', 'Generator', 'Reading', 'Alert Type'];
    // Uses filteredAlerts so it exports everything in the current search, not just the page
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
  
  // FIX: Reset to page 1 on filter or search changes
  setFilter(filterType: string) { 
    this.currentFilter = filterType; 
    this.currentPage = 1; 
  }
  
  updateSearch(event: Event) { 
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase(); 
    this.currentPage = 1; 
  }

  get filteredAlerts(): Alert[] {
    let result = this.alerts;
    if (this.currentFilter !== 'ALL') { result = result.filter(a => a.alertType === this.currentFilter); }
    if (this.searchTerm.trim() !== '') {
      result = result.filter(a => 
        a.levelreadingId?.toString().includes(this.searchTerm) ||
        this.formatType(a.alertType).toLowerCase().includes(this.searchTerm)
      );
    }
    return result;
  }

  // --- NEW: Pagination Getters & Methods ---
  get totalPages(): number {
    return Math.ceil(this.filteredAlerts.length / this.itemsPerPage) || 1;
  }

  get paginatedAlerts(): Alert[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAlerts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
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