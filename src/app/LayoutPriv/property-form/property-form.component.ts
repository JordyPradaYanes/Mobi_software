import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property-service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../ComponentesEstructurales/navbar/navbar.component';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.css'],
})
export class PropertyFormComponent implements OnInit {
  propertyForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isComponentReady = false;

  private destroy$ = new Subject<void>();
  

  // Options for dropdowns
  propertyTypes = [
    { value: 'casa', label: '🏡 Casa', icon: '🏡' },
    { value: 'apartamento', label: '🏢 Apartamento', icon: '🏢' },
    { value: 'oficina', label: '🏢 Oficina', icon: '🏢' },
    { value: 'local', label: '🏪 Local Comercial', icon: '🏪' },
    { value: 'terreno', label: '🌍 Terreno', icon: '🌍' },
    { value: 'bodega', label: '🏭 Bodega', icon: '🏭' },
    { value: 'finca', label: '🌾 Finca', icon: '🌾' },
  ];

  transactionTypes = [
    { value: 'venta', label: '💰 Venta', icon: '💰' },
    { value: 'alquiler', label: '🏠 Alquiler', icon: '🏠' },
    {
      value: 'alquiler-venta',
      label: '🔄 Alquiler con opción a compra',
      icon: '🔄',
    },
  ];

  commonAmenities = [
    'Piscina',
    'Gimnasio',
    'Portería 24h',
    'Ascensor',
    'Balcón',
    'Terraza',
    'Jardín',
    'BBQ',
    'Salón Social',
    'Cancha de Tenis',
    'Zona de Juegos',
    'Lavandería',
    'Depósito',
    'Aire Acondicionado',
    'Calefacción',
    'Chimenea',
    'Walk-in Closet',
    'Estudio',
  ];

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.propertyForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialize amenities checkboxes
    this.checkAuthenticationAndInitialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthenticationAndInitialize(): void {
    // Esperar a que el servicio de autenticación esté listo
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        console.warn('⚠️ Usuario no autenticado, redirigiendo...');
        this.router.navigate(['/login']);
        return;
      }

      console.log('✅ Usuario autenticado:', currentUser.uid);
      this.initializeComponent();
    }, 100); // Pequeño delay para asegurar que todo esté cargado
  }

  get isReady(): boolean {
    return this.isComponentReady && !!this.authService.getCurrentUser();
  }

  private initializeComponent(): void {
    try {
      // Inicializar amenidades
      this.initializeAmenities();
      
      // Marcar componente como listo
      this.isComponentReady = true;
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      console.log('✅ PropertyFormComponent inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando componente:', error);
      this.errorMessage = 'Error cargando el formulario. Intenta recargar la página.';
    }
  }


  private createForm(): FormGroup {
    return this.fb.group({
      // Basic Information
      propertyType: ['', Validators.required],
      transactionType: ['', Validators.required],
      address: ['', Validators.required],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],

      // Economic Information
      price: ['', [Validators.required, Validators.min(1)]],
      administrationFee: ['', [Validators.min(0)]],

      // Physical Characteristics
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      parkingSpaces: ['', [Validators.min(0)]],
      floor: ['', [Validators.min(0)]],
      totalArea: ['', [Validators.required, Validators.min(1)]],
      builtArea: ['', [Validators.min(1)]],

      // Additional Information
      description: ['', [Validators.required, Validators.minLength(20)]],
      amenities: this.fb.array([]),
      nearbyPlaces: [''],

      // Media
      imageUrls: this.fb.array([]),
    });
  }

  private initializeAmenities(): void {
    const amenitiesArray = this.propertyForm.get('amenities') as FormArray;
    this.commonAmenities.forEach(() => {
      amenitiesArray.push(this.fb.control(false));
    });
  }

  // Helper for easy access to form controls in the template
  get formControls() {
    return this.propertyForm.controls;
  }

  get amenitiesArray() {
    return this.propertyForm.get('amenities') as FormArray;
  }

  get imageUrlsArray() {
    return this.propertyForm.get('imageUrls') as FormArray;
  }

  // Add image URL input
  addImageUrl(): void {
    this.imageUrlsArray.push(
      this.fb.control('', [Validators.pattern('https?://.+')])
    );
  }

  // Remove image URL input
  removeImageUrl(index: number): void {
    this.imageUrlsArray.removeAt(index);
  }

  // Get selected amenities
  getSelectedAmenities(): string[] {
    return this.commonAmenities.filter(
      (_, index) => this.amenitiesArray.at(index).value
    );
  }

  // Format price for display
  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  // Validate form before submission
  private validateForm(): boolean {
    this.propertyForm.markAllAsTouched();

    if (this.propertyForm.invalid) {
      this.errorMessage =
        'Por favor complete todos los campos requeridos correctamente.';
      this.scrollToFirstError();
      return false;
    }

    // Additional custom validations
    const totalArea = this.propertyForm.get('totalArea')?.value;
    const builtArea = this.propertyForm.get('builtArea')?.value;

    if (builtArea && builtArea > totalArea) {
      this.errorMessage =
        'El área construida no puede ser mayor al área total.';
      return false;
    }

    return true;
  }

  private scrollToFirstError(): void {
    const firstErrorElement = document.querySelector('.border-red-500');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onSubmit(): void {
    console.log('🚀 Iniciando envío de formulario...');

    this.errorMessage = null;
    this.successMessage = null;

    if (!this.validateForm()) {
      console.log('❌ Formulario inválido');
      return;
    }

    this.isLoading = true;

    // Verificar autenticación más robustamente
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', currentUser);

    if (!currentUser || !currentUser.uid) {
      console.error('❌ Usuario no autenticado');
      this.errorMessage = 'Debe iniciar sesión para agregar una propiedad.';
      this.isLoading = false;
      return;
    }

    // Log del valor del formulario antes de procesar
    const formValue = this.propertyForm.value;
    console.log('📋 Valores del formulario:', formValue);

    // Preparar datos de la propiedad con validación adicional
    try {
      const selectedAmenities = this.getSelectedAmenities();
      console.log('🏠 Amenidades seleccionadas:', selectedAmenities);

      const nearbyPlaces = formValue.nearbyPlaces
        ? formValue.nearbyPlaces
            .split(',')
            .map((place: string) => place.trim())
            .filter((place: string) => place)
        : [];
      console.log('📍 Lugares cercanos:', nearbyPlaces);

      // Validar y convertir números
      const price = Number(formValue.price);
      const totalArea = Number(formValue.totalArea);
      const bedrooms = Number(formValue.bedrooms);
      const bathrooms = Number(formValue.bathrooms);

      if (
        isNaN(price) ||
        isNaN(totalArea) ||
        isNaN(bedrooms) ||
        isNaN(bathrooms)
      ) {
        throw new Error('Los valores numéricos no son válidos');
      }

      const propertyData = {
        userId: currentUser.uid,
        propertyType: formValue.propertyType,
        transactionType: formValue.transactionType,
        address: formValue.address,
        neighborhood: formValue.neighborhood,
        city: formValue.city,
        price: price,
        administrationFee: formValue.administrationFee
          ? Number(formValue.administrationFee)
          : undefined,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        parkingSpaces: formValue.parkingSpaces
          ? Number(formValue.parkingSpaces)
          : undefined,
        floor: formValue.floor ? Number(formValue.floor) : undefined,
        totalArea: totalArea,
        builtArea: formValue.builtArea
          ? Number(formValue.builtArea)
          : undefined,
        description: formValue.description,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        nearbyPlaces: nearbyPlaces.length > 0 ? nearbyPlaces : undefined,
        imageUrls: formValue.imageUrls.filter(
          (url: string) => url && url.trim() !== ''
        ),
        isActive: true,
      };

      console.log('📦 Datos finales a enviar:', propertyData);

      // Opcional: Probar conexión primero
      this.propertyService.testFirebaseConnection().subscribe({
        next: () => {
          console.log(
            '✅ Conexión a Firebase confirmada, procediendo a guardar...'
          );
          this.saveProperty(propertyData);
        },
        error: (connectionError) => {
          console.error('❌ Error de conexión a Firebase:', connectionError);
          this.isLoading = false;
          this.errorMessage =
            'Error de conexión a Firebase. Verifica tu configuración.';
        },
      });
    } catch (error) {
      console.error('❌ Error preparando datos:', error);
      this.isLoading = false;
      this.errorMessage = 'Error preparando los datos de la propiedad.';
    }
  }

  private saveProperty(propertyData: any): void {
  this.propertyService.addProperty(propertyData).subscribe({
    next: (propertyId) => {
      console.log('✅ Propiedad guardada con éxito, ID:', propertyId);
      this.isLoading = false;
      this.successMessage = `¡Propiedad agregada exitosamente! ID: ${propertyId}`;
      this.propertyForm.reset();
      this.initializeAmenities();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        this.successMessage = null;
      }, 8000);
    },
    error: (err) => {
      console.error('❌ Error guardando propiedad:', err);
      this.isLoading = false;
      this.errorMessage = err.message || 'Ocurrió un error inesperado al agregar la propiedad.';
      
      setTimeout(() => this.errorMessage = null, 10000);
    }
  });
}

  // Reset form
  resetForm(): void {
    this.propertyForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
    this.initializeAmenities();

    // Clear dynamic arrays
    while (this.imageUrlsArray.length !== 0) {
      this.imageUrlsArray.removeAt(0);
    }
  }
}
