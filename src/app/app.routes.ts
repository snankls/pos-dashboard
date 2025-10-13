import { Routes } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(c => c.LoginComponent),
    data: { title: 'Login' },
  },
  {
    path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      // Dashboard
      { path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./views/pages/dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { title: 'Dashboard' },
      },

      // Companies
      {
        path: 'companies',
        loadComponent: () => import('./views/pages/companies/companies.component').then(c => c.CompaniesComponent),
        data: { title: 'Companies' },
      },

      // Notice Board
      {
        path: 'notice-board',
        loadComponent: () => import('./views/pages/notice-board/notice-board.component').then(c => c.NoticeBoardComponent),
        data: { title: 'Notice Board' },
      },

      // Users
      {
        path: 'users',
        loadComponent: () => import('./views/pages/users/users.component').then(c => c.UsersComponent),
        data: { title: 'Users' },
      },

      // Users Add
      {
        path: 'users/add',
        loadComponent: () => import('./views/pages/users/setup/setup.component').then(c => c.UsersSetupComponent),
        data: { title: 'Users Add' },
      },

      // Users Edit
      {
        path: 'users/edit/:id',
        loadComponent: () => import('./views/pages/users/setup/setup.component').then(c => c.UsersSetupComponent),
        data: { title: 'Users Edit' },
      },

      // User Profile
      {
        path: 'users/profile/:id',
        loadComponent: () => import('./views/pages/users/profile/profile.component').then(c => c.ProfileComponent),
        data: { title: 'User Profile' },
      },

      // Change Password
      {
        path: 'change-password',
        loadComponent: () => import('./views/pages/users/change-password/change-password.component').then(c => c.ChangePasswordComponent),
        data: { title: 'Change Password' },
      },

      // 404 Page
      {
        path: 'error',
        loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent),
      },
      {
        path: 'error/:type',
        loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent)
      },
      { path: '**', redirectTo: 'error/404', pathMatch: 'full' }
    ]
  },
];
