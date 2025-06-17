import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../services/property-service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../ComponentesEstructurales/navbar/navbar.component';
import { Subject, takeUntil } from 'rxjs';
import { Property } from '../../interfaces/property.interface';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.css'],
})
export class PropertyFormComponent implements OnInit, OnDestroy {
  propertyForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isComponentReady = false;

  // Variables para modo edición
  isEditMode = false;
  propertyId: string | null = null;
  currentProperty: Property | null = null;

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
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.propertyForm = this.createForm();
    console.log('🏗️ PropertyFormComponent constructor ejecutado');
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit iniciado');
    this.checkEditMode();
    this.initializeComponent();
  }

  private checkEditMode(): void {
    // Verificar si hay un ID en la ruta para modo edición
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.propertyId = params['id'];
        console.log(
          '🔧 Modo edición activado para propiedad:',
          this.propertyId
        );
      } else {
        this.isEditMode = false;
        this.propertyId = null;
        console.log('➕ Modo creación activado');
      }
    });
  }

  private async initializeComponent(): Promise<void> {
    try {
      console.log('⚙️ Iniciando inicialización del componente...');

      await this.checkAuthentication();
      this.initializeAmenities();

      // Si estamos en modo edición, cargar los datos de la propiedad
      if (this.isEditMode && this.propertyId) {
        await this.loadPropertyForEdit();
      }

      this.isComponentReady = true;
      this.cdr.markForCheck();

      console.log('✅ Componente inicializado correctamente');
    } catch (error) {
      console.error('❌ Error en initializeComponent:', error);
      this.handleInitializationError(error);
    }
  }

  private async loadPropertyForEdit(): Promise<void> {
    if (!this.propertyId) return;

    console.log('📥 Cargando propiedad para editar:', this.propertyId);

    try {
      this.isLoading = true;

      this.propertyService
        .getPropertyById(this.propertyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (property) => {
            if (property) {
              console.log('✅ Propiedad cargada:', property);
              this.currentProperty = property;
              this.populateForm(property);
            } else {
              console.error('❌ Propiedad no encontrada');
              this.errorMessage = 'La propiedad no fue encontrada.';
              setTimeout(
                () => this.router.navigate(['/property-management']),
                3000
              );
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ Error cargando propiedad:', error);
            this.errorMessage =
              'Error cargando la propiedad. Intenta de nuevo.';
            this.isLoading = false;
          },
        });
    } catch (error) {
      console.error('❌ Error en loadPropertyForEdit:', error);
      this.errorMessage = 'Error cargando la propiedad.';
      this.isLoading = false;
    }
  }

  private populateForm(property: Property): void {
    console.log('📝 Llenando formulario con datos:', property);

    try {
      // Llenar campos básicos
      this.propertyForm.patchValue({
        propertyType: property.propertyType || '',
        transactionType: property.transactionType || '',
        address: property.address || '',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        price: property.price || '',
        administrationFee: property.administrationFee || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        parkingSpaces: property.parkingSpaces || '',
        floor: property.floor || '',
        totalArea: property.totalArea || '',
        builtArea: property.builtArea || '',
        description: property.description || '',
        nearbyPlaces: property.nearbyPlaces
          ? property.nearbyPlaces.join(', ')
          : '',
      });

      // Llenar amenidades
      this.populateAmenities(property.amenities || []);

      // Llenar URLs de imágenes
      this.populateImageUrls(property.imageUrls || []);

      console.log('✅ Formulario llenado correctamente');
    } catch (error) {
      console.error('❌ Error llenando formulario:', error);
      this.errorMessage = 'Error cargando los datos de la propiedad.';
    }
  }

  private populateAmenities(selectedAmenities: string[]): void {
    try {
      const amenitiesArray = this.propertyForm.get('amenities') as FormArray;

      if (!amenitiesArray) {
        console.error('❌ FormArray de amenidades no encontrado para llenar');
        return;
      }

      this.commonAmenities.forEach((amenity, index) => {
        const isSelected = selectedAmenities.includes(amenity);
        const control = amenitiesArray.at(index);

        if (control) {
          control.setValue(isSelected);
          console.log(`🏠 Amenidad ${amenity}: ${isSelected}`);
        }
      });

      console.log('✅ Amenidades llenadas correctamente');
    } catch (error) {
      console.error('❌ Error llenando amenidades:', error);
    }
  }

  private populateImageUrls(imageUrls: string[]): void {
    try {
      const imageUrlsArray = this.propertyForm.get('imageUrls') as FormArray;

      if (!imageUrlsArray) {
        console.error('❌ FormArray de imageUrls no encontrado');
        return;
      }

      // Limpiar array existente
      while (imageUrlsArray.length !== 0) {
        imageUrlsArray.removeAt(0);
      }

      // Agregar URLs existentes
      imageUrls.forEach((url) => {
        if (url && url.trim()) {
          imageUrlsArray.push(
            this.fb.control(url.trim(), [Validators.pattern('https?://.+')])
          );
        }
      });

      console.log('✅ URLs de imágenes llenadas:', imageUrls.length);
    } catch (error) {
      console.error('❌ Error llenando URLs de imágenes:', error);
    }
  }

  private async checkAuthentication(): Promise<void> {
    return new Promise((resolve, reject) => {
      const currentUser = this.authService.getCurrentUser();

      if (currentUser && currentUser.uid) {
        console.log('✅ Usuario ya autenticado:', currentUser.uid);
        resolve();
        return;
      }

      console.log('⏳ Esperando autenticación...');

      setTimeout(() => {
        const retryUser = this.authService.getCurrentUser();

        if (retryUser && retryUser.uid) {
          console.log(
            '✅ Usuario autenticado después del reintento:',
            retryUser.uid
          );
          resolve();
        } else {
          console.warn('⚠️ Usuario no autenticado, redirigiendo...');
          this.router.navigate(['/login']);
          reject(new Error('Usuario no autenticado'));
        }
      }, 1000);
    });
  }

  private handleInitializationError(error: any): void {
    console.error('❌ Error de inicialización:', error);
    this.errorMessage =
      'Error cargando el formulario. Intenta recargar la página.';
    this.isComponentReady = false;
    this.cdr.markForCheck();
  }

  get isReady(): boolean {
    return this.isComponentReady && !!this.authService.getCurrentUser();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      propertyType: ['', Validators.required],
      transactionType: ['', Validators.required],
      address: ['', Validators.required],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      administrationFee: ['', [Validators.min(0)]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      parkingSpaces: ['', [Validators.min(0)]],
      floor: ['', [Validators.min(0)]],
      totalArea: ['', [Validators.required, Validators.min(1)]],
      builtArea: ['', [Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      amenities: this.fb.array([]),
      nearbyPlaces: [''],
      imageUrls: this.fb.array([]),
    });

    console.log('📋 Formulario creado');
    return form;
  }

  private initializeAmenities(): void {
    try {
      const amenitiesArray = this.propertyForm.get('amenities') as FormArray;

      // Limpiar array existente
      while (amenitiesArray.length !== 0) {
        amenitiesArray.removeAt(0);
      }

      // Agregar controles para cada amenidad
      this.commonAmenities.forEach(() => {
        amenitiesArray.push(this.fb.control(false));
      });

      console.log('🏠 Amenidades inicializadas:', amenitiesArray.length);
    } catch (error) {
      console.error('❌ Error inicializando amenidades:', error);
      throw error;
    }
  }

  get formControls() {
    return this.propertyForm.controls;
  }

  get amenitiesArray() {
    return this.propertyForm.get('amenities') as FormArray;
  }

  get imageUrlsArray() {
    return this.propertyForm.get('imageUrls') as FormArray;
  }

  addImageUrl(): void {
    try {
      const imageUrlsArray = this.propertyForm.get('imageUrls') as FormArray;

      if (imageUrlsArray) {
        imageUrlsArray.push(
          this.fb.control('', [Validators.pattern('https?://.+')])
        );
        console.log('➕ Nueva URL de imagen agregada');
      }
    } catch (error) {
      console.error('❌ Error agregando URL de imagen:', error);
    }
  }

  removeImageUrl(index: number): void {
    try {
      const imageUrlsArray = this.propertyForm.get('imageUrls') as FormArray;

      if (imageUrlsArray && index >= 0 && index < imageUrlsArray.length) {
        imageUrlsArray.removeAt(index);
        console.log('🗑️ URL de imagen removida en índice:', index);
      }
    } catch (error) {
      console.error('❌ Error removiendo URL de imagen:', error);
    }
  }

  getSelectedAmenities(): string[] {
    const selected: string[] = [];

    try {
      const amenitiesArray = this.propertyForm.get('amenities') as FormArray;

      if (!amenitiesArray) {
        console.warn('⚠️ FormArray de amenidades no encontrado');
        return selected;
      }

      this.commonAmenities.forEach((amenity, index) => {
        const control = amenitiesArray.at(index);
        if (control && control.value === true) {
          selected.push(amenity);
        }
      });

      console.log('🏠 Amenidades seleccionadas:', selected);
      return selected;
    } catch (error) {
      console.error('❌ Error obteniendo amenidades:', error);
      return selected;
    }
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  private validateForm(): boolean {
    this.propertyForm.markAllAsTouched();

    if (this.propertyForm.invalid) {
      console.log('❌ Formulario inválido:', this.propertyForm.errors);

      // Mostrar errores específicos
      Object.keys(this.propertyForm.controls).forEach((key) => {
        const control = this.propertyForm.get(key);
        if (control?.invalid) {
          console.log(`❌ Campo inválido: ${key}`, control.errors);
        }
      });

      this.errorMessage =
        'Por favor complete todos los campos requeridos correctamente.';
      this.scrollToFirstError();
      return false;
    }

    const totalArea = this.propertyForm.get('totalArea')?.value;
    const builtArea = this.propertyForm.get('builtArea')?.value;

    if (builtArea && totalArea && builtArea > totalArea) {
      this.errorMessage =
        'El área construida no puede ser mayor al área total.';
      return false;
    }

    // Validar que haya al menos una amenidad o imagen (opcional)
    const selectedAmenities = this.getSelectedAmenities();
    console.log('🔍 Validando amenidades seleccionadas:', selectedAmenities);

    return true;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  private debugFormData(): void {
    const formValue = this.propertyForm.value;
    const selectedAmenities = this.getSelectedAmenities();

    console.log('🔍 DATOS DEL FORMULARIO PARA DEBUG:');
    console.log('- Amenidades FormArray:', formValue.amenities);
    console.log('- Amenidades seleccionadas:', selectedAmenities);
    console.log('- URLs de imágenes:', formValue.imageUrls);
    console.log('- Formulario completo:', formValue);
  }

  onSubmit(): void {
    console.log('🚀 Iniciando envío de formulario...');

    // Agregar esta línea para debug
    this.debugFormData();

    this.errorMessage = null;
    this.successMessage = null;

    if (!this.validateForm()) {
      console.log('❌ Formulario inválido');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.uid) {
      console.error('❌ Usuario no autenticado');
      this.errorMessage = 'Debe iniciar sesión para gestionar propiedades.';
      return;
    }

    this.isLoading = true;

    try {
      const propertyData = this.preparePropertyData(currentUser.uid);
      console.log('📦 Datos finales preparados:', propertyData);

      if (this.isEditMode && this.propertyId) {
        this.updateProperty(propertyData);
      } else {
        this.saveProperty(propertyData);
      }
    } catch (error) {
      console.error('❌ Error preparando datos:', error);
      this.isLoading = false;
      this.errorMessage = 'Error preparando los datos de la propiedad.';
    }
  }

  private updateProperty(propertyData: any): void {
    if (!this.propertyId) return;

    this.propertyService
      .updateProperty(this.propertyId, propertyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Propiedad actualizada con éxito');
          this.handleUpdateSuccess();
        },
        error: (error) => {
          console.error('❌ Error actualizando propiedad:', error);
          this.handleError(error);
        },
      });
  }

  private handleUpdateSuccess(): void {
    this.isLoading = false;
    this.successMessage = '¡Propiedad actualizada exitosamente!';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Redirigir a la gestión de propiedades después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/property-management']);
    }, 2000);
  }

  private preparePropertyData(userId: string): any {
    const formValue = this.propertyForm.value;
    const selectedAmenities = this.getSelectedAmenities();

    // Procesar lugares cercanos
    const nearbyPlaces = formValue.nearbyPlaces
      ? formValue.nearbyPlaces
          .split(',')
          .map((place: string) => place.trim())
          .filter((place: string) => place.length > 0)
      : [];

    // Procesar URLs de imágenes - CORRECCIÓN AQUÍ
    const imageUrls = formValue.imageUrls
      ? formValue.imageUrls
          .filter((url: string) => url && url.trim() !== '') // Filtrar URLs vacías
          .map((url: string) => url.trim()) // Limpiar espacios
      : [];

    const price = this.safeParseNumber(formValue.price);
    const totalArea = this.safeParseNumber(formValue.totalArea);
    const bedrooms = this.safeParseNumber(formValue.bedrooms);
    const bathrooms = this.safeParseNumber(formValue.bathrooms);

    if (
      price === null ||
      totalArea === null ||
      bedrooms === null ||
      bathrooms === null
    ) {
      throw new Error('Los valores numéricos no son válidos');
    }

    const baseData = {
      userId,
      propertyType: formValue.propertyType,
      transactionType: formValue.transactionType,
      address: formValue.address,
      neighborhood: formValue.neighborhood,
      city: formValue.city,
      price,
      administrationFee: this.safeParseNumber(formValue.administrationFee),
      bedrooms,
      bathrooms,
      parkingSpaces: this.safeParseNumber(formValue.parkingSpaces),
      floor: this.safeParseNumber(formValue.floor),
      totalArea,
      builtArea: this.safeParseNumber(formValue.builtArea),
      description: formValue.description,
      // CORRECCIÓN: Asegurar que las amenidades se incluyan correctamente
      amenities: selectedAmenities,
      nearbyPlaces: nearbyPlaces,
      // CORRECCIÓN: Asegurar que las URLs se incluyan correctamente
      imageUrls: imageUrls,
      isActive: true,
    };

    console.log('🔍 Datos preparados para guardar:', {
      amenities: selectedAmenities,
      imageUrls: imageUrls,
      nearbyPlaces: nearbyPlaces,
    });

    // En modo edición, no incluir createdAt
    if (!this.isEditMode) {
      return {
        ...baseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return baseData;
  }

  private safeParseNumber(value: any): number | null {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }

  private saveProperty(propertyData: any): void {
    this.propertyService
      .addProperty(propertyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (propertyId) => {
          console.log('✅ Propiedad guardada con éxito, ID:', propertyId);
          this.handleSuccess(propertyId);
        },
        error: (error) => {
          console.error('❌ Error guardando propiedad:', error);
          this.handleError(error);
        },
      });
  }

  private handleSuccess(propertyId: string): void {
    this.isLoading = false;
    this.successMessage = `¡Propiedad agregada exitosamente! ID: ${propertyId}`;

    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      this.successMessage = null;
    }, 8000);
  }

  private handleError(error: any): void {
    this.isLoading = false;

    let errorMessage = 'Ocurrió un error inesperado al procesar la propiedad.';

    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    }

    this.errorMessage = errorMessage;

    setTimeout(() => {
      this.errorMessage = null;
    }, 10000);
  }

  resetForm(): void {
    this.propertyForm.reset();
    this.errorMessage = null;
    this.successMessage = null;

    while (this.imageUrlsArray.length !== 0) {
      this.imageUrlsArray.removeAt(0);
    }

    this.initializeAmenities();
  }

  // Método para cancelar edición y volver a la gestión
  cancelEdit(): void {
    this.router.navigate(['/property-management']);
  }

  ngOnDestroy(): void {
    console.log('🔥 ngOnDestroy ejecutado');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
