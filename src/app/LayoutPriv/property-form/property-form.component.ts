import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../../services/property-service'; // Adjusted path if service name is kebab-case
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-form',
  standalone: true, // Ensure this is standalone if not using modules
  imports: [CommonModule, ReactiveFormsModule], // CommonModule for ngIf, ngFor, etc.
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.css']
})
export class PropertyFormComponent implements OnInit {
  propertyForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router
  ) {
    this.propertyForm = this.fb.group({
      address: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      imageUrls: this.fb.array([]) // For simplicity, starting with an empty array. Image upload can be a future enhancement.
    });
  }

  ngOnInit(): void {
    // Potentially load data if editing, but for now, it's a new property form.
  }

  // Helper for easy access to form controls in the template
  get formControls() {
    return this.propertyForm.controls;
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.propertyForm.markAllAsTouched();

    if (this.propertyForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.uid) {
      this.errorMessage = 'You must be logged in to add a property.';
      this.isLoading = false;
      // Potentially redirect to login
      // this.router.navigate(['/login']);
      return;
    }

    const propertyData = {
      ...this.propertyForm.value,
      userId: currentUser.uid,
      imageUrls: this.propertyForm.value.imageUrls || [] // Ensure imageUrls is an array
    };

    // Remove empty or null imageUrls if any (though not implemented for input yet)
    propertyData.imageUrls = propertyData.imageUrls.filter((url: string) => url && url.trim() !== '');


    this.propertyService.addProperty(propertyData).subscribe({
      next: (propertyId) => {
        this.isLoading = false;
        this.successMessage = `Property added successfully with ID: ${propertyId}!`;
        this.propertyForm.reset();
        // Optionally, navigate to the property details page or a dashboard
        // this.router.navigate(['/dashboard']); // Or ['/property', propertyId]
        setTimeout(() => this.successMessage = null, 5000); // Clear message after 5s
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'An unexpected error occurred while adding the property.';
        console.error('Error adding property:', err);
        setTimeout(() => this.errorMessage = null, 7000); // Clear message after 7s
      }
    });
  }
}
