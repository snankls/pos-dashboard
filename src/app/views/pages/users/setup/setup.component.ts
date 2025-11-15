import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';

interface User {
  company_id: number | null;
  company_name: string | null;
  id?: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  gender: string | null;
  purchase_date?: NgbDateStruct | string | null;
  refer_by: string | null;
  refer_amount: string | null;
  date_of_birth?: NgbDateStruct | string | null;
  city_id: number | null;
  status: string | null;
  address: string;
  image?: File | string | null;
  image_url?: string;
  images?: {
    image_name: string;
  };
}

interface SubscriptionItem {
  id: number | null;
  subscribe_start: NgbDateStruct | string | null;
  subscribe_end: NgbDateStruct | string | null;
  service_charges: string | null;
  discount: string | null;
  payment_method: string | null;
  subscription_status: string | null;
  reason: string;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
  ],
  templateUrl: './setup.component.html'
})
export class UsersSetupComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  private NG_URL = environment.NG_URL;

  currentRecord: User = {
    company_id: null,
    company_name: null,
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    date_of_birth: null,
    city_id: null,
    gender: 'Male',
    purchase_date: null,
    refer_by: null,
    refer_amount: null,
    address: '',
    status: 'Active',
    image: null,
  };

  companyRecord = {
    name: '',
  };
  
  isEditMode = false;
  isLoading = false;
  globalErrorMessage: string = '';
  errorMessage: string | null = null;
  selectedRows: number[] = [];
  formErrors: Record<string, string[]> = {};
  selected: any[] = [];
  companies: any[] = [];
  cities: any[] = [];
  payment_method: { id: string, name: string }[] = [];
  
  // Dropdown options
  gender: { id: string; name: string }[] = [
    { id: 'Male', name: 'Male' },
    { id: 'Female', name: 'Female' },
    { id: 'Other', name: 'Other' },
  ];
  
  status: { id: string; name: string }[] = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
    { id: 'Trail', name: 'Trail' },
    { id: 'Disabled', name: 'Disabled' },
  ];
  
  subscription_status: { id: string; name: string }[] = [
    { id: 'Paid', name: 'Paid' },
    { id: 'Unpaid', name: 'Unpaid' },
  ];
  
  // Subscription items
  itemsList: SubscriptionItem[] = [{ 
    id: null, 
    subscribe_start: null, 
    subscribe_end: null, 
    service_charges: null, 
    discount: null, 
    payment_method: null, 
    subscription_status: 'Paid', 
    reason: '' 
  }];
  
  // Image handling
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  
  // Table related
  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {}

  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  ngOnInit(): void {
    this.fetchCompanies();
    this.fetchCities();
    this.fetchPaymentMethod();

    // Set current date only for new users (not edit mode)
    const today = new Date();
    this.currentRecord.purchase_date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchUser(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  clearItemError(index: number, field: string): void {
    const errorKey = `items.${index}.${field}`;
    if (this.formErrors[errorKey]) {
      delete this.formErrors[errorKey];
    }
  }

  toggleSelection(index: number): void {
    const idx = this.selectedRows.indexOf(index);
    if (idx > -1) {
      this.selectedRows.splice(idx, 1);
    } else {
      this.selectedRows.push(index);
    }
  }

  isSelected(index: number): boolean {
    return this.selectedRows.includes(index);
  }

  selectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedRows = checked ? 
      Array.from({ length: this.itemsList.length }, (_, i) => i) : 
      [];
  }

  addItemRow(): void {
    this.itemsList.push({ 
      id: null, 
      subscribe_start: null, 
      subscribe_end: null, 
      service_charges: null, 
      discount: null, 
      payment_method: null, 
      subscription_status: null, 
      reason: '' 
    });
  }

  deleteSelectedRows(): void {
    if (confirm('Are you sure you want to delete the selected items?')) {
      // Filter out selected rows (in reverse order to avoid index issues)
      this.itemsList = this.itemsList.filter((_, index) => 
        !this.selectedRows.includes(index)
      );
      this.selectedRows = [];
    }
  }

  fetchUser(id: number): void {
    this.http.get<any>(`${this.API_URL}/admin/user/${id}`).subscribe({
      next: (user) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...user,
          company_id: user.company_id ? +user.company_id : null,
          date_of_birth: this.parseDateFromBackend(user.date_of_birth),
          subscribe_start: this.parseDateFromBackend(user.subscribe_start),
          subscribe_end: this.parseDateFromBackend(user.subscribe_end),
        };

        // Image preview setup
        if (user.images?.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/users/${user.images.image_name}`;
        }

        this.isEditMode = true;

        // Populate itemsList with existing subscription items
        if (user.subscriptions && Array.isArray(user.subscriptions)) {
          this.itemsList = user.subscriptions.map((item: any) => ({
            id: item.id,
            subscribe_start: this.parseDateFromBackend(item.subscribe_start),
            subscribe_end: this.parseDateFromBackend(item.subscribe_end),
            service_charges: item.service_charges,
            discount: item.discount,
            payment_method: item.payment_method,
            subscription_status: item.subscription_status,
            reason: item.reason || ''
          }));
        }
      },
      error: (error) => {
        console.error('Failed to fetch user:', error);
      }
    });
  }

  fetchCompanies(): void {
    this.http.get<any[]>(`${this.API_URL}/active/companies`).subscribe({
      next: (response) => {
        this.companies = response;
      },
      error: (error) => console.error('Failed to fetch records:', error)
    });
  }

  fetchCities(): void {
    this.http.get<any>(`${this.API_URL}/active/cities`).subscribe({
      next: (response) => {
        this.cities = response;
      },
      error: (error) => console.error('Failed to fetch records:', error)
    });
  }

  fetchPaymentMethod(): void {
    this.http.get<any>(`${this.API_URL}/payment-method`).subscribe({
      next: (response) => {
        if (response && response.data && typeof response.data === 'object') {
          this.payment_method = Object.entries(response.data).map(([key, value]) => ({
            id: String(key),
            name: String(value)
          }));
        } else {
          console.error('Invalid response format for payment_method:', response);
          this.payment_method = [];
        }
      },
      error: (error) => {
        console.error('Failed to fetch payment_method:', error);
        this.payment_method = [];
      }
    });
  }

  private parseDateFromBackend(dateString: string | undefined): NgbDateStruct | null {
    if (!dateString) return null;
    
    if (typeof dateString === 'object' && 'year' in dateString) {
      return dateString;
    }
    
    const parts = dateString.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10)
    };
  }

  formatDate(date: NgbDateStruct | string | null | undefined): string {
    if (!date) return '';
    
    // If it's already a string (from backend), return it
    if (typeof date === 'string') return date;
    
    // If it's an NgbDateStruct object
    if (typeof date === 'object' && 'year' in date) {
      return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }
    
    return '';
  }

  openModal(): void {
    this.companyRecord = { name: '' };
    this.formErrors = {};
    this.activeModal = this.modalService.open(this.modalTemplate, { size: 'md' });
  }

  private handleError(error: any): void {
    if (error.error?.errors) {
      this.formErrors = error.error.errors;
    } else {
      this.errorMessage = error.error?.message || 'An error occurred';
    }
  }

  prepareFormData(): FormData {
    const formData = new FormData();
    
    // Add user data
    Object.entries(this.currentRecord).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'purchase_date' || key === 'subscribe_start' || 
            key === 'subscribe_end' || key === 'date_of_birth') {
          formData.append(key, this.formatDate(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    
    // Add image if selected
    if (this.selectedFile) {
      formData.append('user_image', this.selectedFile);
    }
    
    // Add subscription items
    this.itemsList.forEach((item, index) => {
      if (item.id) formData.append(`items[${index}][id]`, item.id.toString());
      
      // Both dates should be included
      if (item.subscribe_start) {
        formData.append(
          `items[${index}][subscribe_start]`, 
          this.formatDate(item.subscribe_start)
        );
      }
      
      if (item.subscribe_end) {
        formData.append(
          `items[${index}][subscribe_end]`, 
          this.formatDate(item.subscribe_end)
        );
      }
      
      if (item.service_charges) {
        formData.append(
          `items[${index}][service_charges]`, 
          item.service_charges
        );
      }
      
      if (item.payment_method) {
        formData.append(
          `items[${index}][payment_method]`, 
          item.payment_method
        );
      }
      
      if (item.subscription_status) {
        formData.append(
          `items[${index}][subscription_status]`, 
          item.subscription_status
        );
      }
      
      if (item.reason) {
        formData.append(
          `items[${index}][reason]`, 
          item.reason
        );
      }
    });
    
    formData.append('ng_url', this.NG_URL);
    
    // For debugging - log the form data
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    
    return formData;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result || null;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  companySubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.formErrors = {};

    this.http.post(`${this.API_URL}/companies`, this.companyRecord).subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchCompanies();
        this.activeModal?.close();
        this.companyRecord = { name: '' };
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.globalErrorMessage = '';
    this.formErrors = {};

    // Always set purchase_date to current date for new user
    if (!this.isEditMode) {
      const today = new Date();
      this.currentRecord.purchase_date = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      };
    }

    const formData = this.prepareFormData();
    formData.append('ng_url', this.NG_URL);
    
    const endpoint = this.isEditMode ? 
      `${this.API_URL}/admin/users/${this.currentRecord.id}?_method=PUT` : 
      `${this.API_URL}/admin/users`;

    this.http.post(endpoint, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/users']);
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.error?.errors) {
          this.formErrors = error.error.errors;
        }
        this.globalErrorMessage = 'Please fill all required fields correctly.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

}