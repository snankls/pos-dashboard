import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbCalendar, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
//import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
//import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../core/services/theme-css-variable.service';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgbDropdownModule,
    FormsModule, 
    NgbDatepickerModule, 
    NgxDatatableModule,
    FeatherIconDirective,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  dashboardData: any;
  loadingIndicator = true;
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];
  ColumnMode = ColumnMode;

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.getDashboardCounter();
    this.fetchUsers();
  }

  getDashboardCounter(): void {
    this.http.get<any[]>(`${this.API_URL}/admin/dashboard`).subscribe({
      next: (response: any[]) => {
        this.dashboardData = response;
      },
      error: (error) => {
        console.error('Error fetching dashboard data', error);
      }
    });
  }

  fetchUsers(): void {
    this.loadingIndicator = true;

    this.http.get<any[]>(`${this.API_URL}/users/disable`).subscribe({
      next: (response) => {
        this.rows = response;
        this.temp = [...response];
        this.loadingIndicator = false;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize today to midnight

        this.rows.forEach((user) => {
          // Calculate remaining days safely
          if (user.subscribe_end) {
            const endDate = new Date(user.subscribe_end);
            endDate.setHours(0, 0, 0, 0); // normalize endDate to midnight

            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            user.remaining_days = diffDays >= 0 ? diffDays : 0;
          } else {
            user.remaining_days = 0;
          }

          // Process image URL
          user.user_image = user.user_image
            ? `${this.IMAGE_URL}/uploads/users/${user.user_image}`
            : 'images/placeholder.png';
        });
      },
      error: (error) => {
        this.loadingIndicator = false;
      }
    });
  }

  // fetchUsers(): void {
  //   this.loadingIndicator = true;

  //   this.http.get<any[]>(`${this.API_URL}/users/disable`).subscribe({
  //     next: (response) => {
  //       this.rows = response;
  //       this.temp = [...response];
  //       this.loadingIndicator = false;

  //       this.rows.forEach((user) => {
  //         // Process image URL
  //         user.user_image = user.user_image
  //           ? `${this.IMAGE_URL}/uploads/users/${user.user_image}`
  //           : 'images/placeholder.png';
  //       });
  //     },
  //     error: (error) => {
  //       this.loadingIndicator = false;
  //     }
  //   });
  // }

}
