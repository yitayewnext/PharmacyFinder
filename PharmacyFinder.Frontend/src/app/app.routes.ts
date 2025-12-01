import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pharmacy/register',
    loadComponent: () => import('./features/pharmacy/register-pharmacy/register-pharmacy.component').then(m => m.RegisterPharmacyComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pharmacy/stock',
    loadComponent: () => import('./features/pharmacy/stock-management/stock-list/stock-list.component').then(m => m.StockListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pharmacy/stock/add',
    loadComponent: () => import('./features/pharmacy/stock-management/add-edit-medicine/add-edit-medicine.component').then(m => m.AddEditMedicineComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pharmacy/stock/edit/:id',
    loadComponent: () => import('./features/pharmacy/stock-management/add-edit-medicine/add-edit-medicine.component').then(m => m.AddEditMedicineComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/pharmacy-approval',
    loadComponent: () => import('./features/admin/pharmacy-approval/pharmacy-approval.component').then(m => m.PharmacyApprovalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/user-approval',
    loadComponent: () => import('./features/admin/user-approval/user-approval.component').then(m => m.UserApprovalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/pharmacy-management',
    loadComponent: () => import('./features/admin/pharmacy-management/pharmacy-management.component').then(m => m.PharmacyManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/user-management',
    loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

