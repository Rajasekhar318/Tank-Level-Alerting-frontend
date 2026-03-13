import { Routes } from '@angular/router';
import { GeneratorDashboard } from './components/generator-dashboard/generator-dashboard';
import { FuelDashboard } from './components/fuel-dashboard/fuel-dashboard';
import { AlertDashboard } from './components/alert-dashboard/alert-dashboard';
 
export const routes: Routes = [
 
{path:'generators', component:GeneratorDashboard},
{path:'fuel', component:FuelDashboard},
{path:'alerts', component:AlertDashboard},
{path:'', redirectTo:'generators', pathMatch:'full'}
 
];
