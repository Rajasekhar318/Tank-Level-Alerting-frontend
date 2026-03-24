import { Component, signal, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from './services/api.service';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('my-app');
 
  // Header state
  activeAlertsCount: number = 0;
  systemStatus: string = 'Normal';
 
  // Dropdown state and data
  showNotifications: boolean = false;
  recentAlerts: any[] = [];
 
  // Store the raw alerts so we know what to mark as viewed later
  private allCurrentAlerts: any[] = [];
 
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {}
 
  ngOnInit() {
    this.api.getAlerts().subscribe({
      next: (alerts: any[]) => {
        this.allCurrentAlerts = alerts || [];
        
        let viewedIds: number[] = [];
 
        if (isPlatformBrowser(this.platformId)) {
          viewedIds = JSON.parse(localStorage.getItem('viewedAlertIds') || '[]');
        }
 
        const unreadAlerts = this.allCurrentAlerts.filter(a => !viewedIds.includes(a.alertId));
 
        this.recentAlerts = unreadAlerts.slice(0, 5);
        this.activeAlertsCount = unreadAlerts.length;
        
        if (this.allCurrentAlerts.length > 0) {
          this.systemStatus = 'Warning';
        } else {
          this.systemStatus = 'Normal';
        }
 
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load global alerts', err)
    });
  }
 
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }
 
  markAllAsViewed() {
    const allIds = this.allCurrentAlerts.map(a => a.alertId);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('viewedAlertIds', JSON.stringify(allIds));
    }
    
    this.activeAlertsCount = 0;
    this.recentAlerts = [];
    this.showNotifications = false;
  }
 
  onPageActivate(componentRef: any) {
    if (componentRef && typeof componentRef.ngOnInit === 'function') {
      componentRef.ngOnInit();
    }
  }
}