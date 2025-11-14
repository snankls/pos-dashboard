import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface Subscription {
  subscribe_start?: string;
  subscribe_end?: string;
  service_charges?: number;
  discount?: number;
  payment_method?: string;
  reason?: string;
  subscription_status?: string;
  remaining_days?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgbDropdownModule
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  
  totalServiceCharges: number = 0;
  currentRecord: any = {};
  itemsList: Subscription[] = [];

  loadingIndicator = true;
  isEditMode = false;
  image: string | ArrayBuffer | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {}
  
  ngOnInit(): void {
    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUser(+id);
      }
    });
  }

  calculateTotalServiceCharges(): void {
    this.totalServiceCharges = this.itemsList.reduce((sum: number, item: any) => {
      const charge = parseFloat(item.service_charges) || 0;
      return sum + charge;
    }, 0);
  }

  loadUser(id: number) {
    this.loadingIndicator = true;

    this.http.get<any>(`${this.API_URL}/admin/user/${id}`).subscribe(user => {
      this.currentRecord = user;

      // Use 'all_subscriptions' or 'subscriptions'
      this.itemsList = user.all_subscriptions || user.subscriptions || [];

      // Calculate remaining_days for each subscription
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.itemsList.forEach((sub: Subscription) => {
        if (sub.subscribe_end) {
          // Parse YYYY-MM-DD safely
          const [year, month, day] = sub.subscribe_end.split('-').map(Number);
          const endDate = new Date(year, month - 1, day); // month is 0-based
          endDate.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // add 1 to include today

          sub.remaining_days = diffDays >= 0 ? diffDays : 0;
        } else {
          sub.remaining_days = 0;
        }
      });

      // Calculate total service charges
      this.totalServiceCharges = this.itemsList.reduce((sum: number, sub: Subscription) => {
        return sum + (sub.service_charges || 0);
      }, 0);

      // If user has image
      if (user.user_image) {
        this.imagePreview = `${this.IMAGE_URL}/admin/users/${user.user_image}`;
      }

      this.isEditMode = true;
      this.loadingIndicator = false;
    });
  }

}
