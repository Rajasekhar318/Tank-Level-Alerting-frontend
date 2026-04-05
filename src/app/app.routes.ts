import { Routes } from '@angular/router';
import { GeneratorDashboard } from './components/generator-dashboard/generator-dashboard';
import { FuelDashboard } from './components/fuel-dashboard/fuel-dashboard';
import { AlertDashboard } from './components/alert-dashboard/alert-dashboard';
import { AdminPanel } from './components/admin-panel/admin-panel';
import { PastDataAnalysisComponent } from './components/past-data-analysis/past-data-analysis';
 
export const routes: Routes = [
  {path: 'generators', component: GeneratorDashboard},
  {path: 'fuel', component: FuelDashboard},
  {path: 'alerts', component: AlertDashboard},
  {path: 'admin', component: AdminPanel},
  {path: '', redirectTo: 'generators', pathMatch: 'full'},
  {path: 'past-analysis', component: PastDataAnalysisComponent}
];