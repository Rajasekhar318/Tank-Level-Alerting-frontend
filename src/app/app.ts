import { Component, signal, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // <-- Imported this
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
    @Inject(PLATFORM_ID) private platformId: Object // <-- Injected Platform ID
  ) {}
 
  ngOnInit() {
    this.api.getAlerts().subscribe({
      next: (alerts: any[]) => {
        this.allCurrentAlerts = alerts || [];
       
        let viewedIds: number[] = [];
 
        // 1. SAFELY check LocalStorage ONLY if we are in the browser
        if (isPlatformBrowser(this.platformId)) {
          viewedIds = JSON.parse(localStorage.getItem('viewedAlertIds') || '[]');
        }
 
        // 2. Filter down to ONLY the alerts that are completely new (unread)
        const unreadAlerts = this.allCurrentAlerts.filter(a => !viewedIds.includes(a.alertId));
 
        // 3. Populate the dropdown and badge count with only the UNREAD alerts
        this.recentAlerts = unreadAlerts.slice(0, 5);
        this.activeAlertsCount = unreadAlerts.length;
       
        // Note: The System Status still looks at ALL alerts.
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
 
  // Marks all current alerts as viewed and clears the badge
  markAllAsViewed() {
    const allIds = this.allCurrentAlerts.map(a => a.alertId);
   
    // Safely write to LocalStorage ONLY if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('viewedAlertIds', JSON.stringify(allIds));
    }
   
    // Instantly clear the UI notification state
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