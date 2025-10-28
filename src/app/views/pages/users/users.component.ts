import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    NgxDatatableModule,
    CommonModule,
  ],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  private NG_URL = environment.NG_URL;

  selected: { id: number; [key: string]: any }[] = [];
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  @ViewChild('table') table: DatatableComponent

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  updateFilter(event: KeyboardEvent) {
    const val = (event.target as HTMLInputElement).value.toLocaleLowerCase();
    
    // filter our data
    this.rows = this.temp.filter(d =>
      (d.pin_code && d.pin_code.toLowerCase().includes(val)) ||
      (d.full_name && d.full_name.toLowerCase().includes(val))
    );
    
    // whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  selectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected = checked ? [...this.rows] : [];
  }

  isSelected(row: any): boolean {
    return this.selected.some(selectedRow => selectedRow.id === row.id);
  }

  toggleSelection(row: any): void {
    if (this.isSelected(row)) {
      this.selected = this.selected.filter(selectedRow => selectedRow.id !== row.id);
    } else {
      this.selected.push(row);
    }
  }

  fetchUsers(): void {
    this.loadingIndicator = true;

    this.http.get<any[]>(`${this.API_URL}/users`).subscribe({
      next: (response) => {
        this.rows = response;
        this.temp = [...response];
        this.loadingIndicator = false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.rows.forEach((user) => {
          // Calculate remaining days safely
          if (user.subscribe_end) {
            const endDate = new Date(user.subscribe_end);
            endDate.setHours(0, 0, 0, 0);

            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            user.remaining_days = diffDays >= 0 ? diffDays : 0;
          } else {
            user.remaining_days = 0;
          }

          // Process image URL
          user.user_image = user.user_image
            ? `${this.IMAGE_URL}/users/${user.user_image}`
            : 'images/placeholder.png';
        });
      },
      error: (error) => {
        this.loadingIndicator = false;
      }
    });
  }
  
  resendEmail(user: any) {
    if (confirm('Are you sure you want to resend email to this user?')) {
      this.http.post(`${this.API_URL}/users/resend-email`, { user_id: user.id, ng_url: this.NG_URL }).subscribe(
        (response: any) => {
          alert(response.message);
        },
        (error) => {
          console.error('Error resending email:', error);
          alert('Failed to resend email. Please try again later.');
        }
      );
    }
  }

  deleteSelectedRecords(): void {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      const ids = this.selected.map(row => row.id);
      const deleteRequests = ids.map(id => this.http.delete(`${this.API_URL}/users/${id}`).toPromise());

      Promise.all(deleteRequests)
        .then(() => {
          this.rows = this.rows.filter(row => !ids.includes(row.id));
          this.temp = this.temp.filter(row => !ids.includes(row.id));
          this.selected = [];
        })
        .catch((error) => {
          console.error('Error deleting selected records:', error);
          alert('An error occurred while deleting records.');
        });
    }
  }

}
