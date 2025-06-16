import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-property-benefits',
  imports: [],
  templateUrl: './property-benefits.component.html',
  styleUrl: './property-benefits.component.css'
})

export class PropertyBenefitsComponent implements OnInit {
  
  benefits = [
    {
      icon: 'home',
      title: 'La nueva forma de encontrar tu nuevo hogar',
      description: 'Encuentra el lugar de tus sueños para ver un máximo de 10,000 propiedades listadas.',
      buttonText: 'Buscar Propiedades',
      buttonLink: '/propiedades',
      hasBigCard: true,
      iconClass: 'text-indigo-600'
    },
    {
      icon: 'shield-check',
      title: 'Seguro de propiedad',
      description: 'Ofrecemos a nuestros clientes protección patrimonial, cobertura de responsabilidad y seguros para una vida mejor.',
      buttonText: '',
      buttonLink: '',
      hasBigCard: false,
      iconClass: 'text-indigo-600'
    },
    {
      icon: 'currency-dollar',
      title: 'Mejor Precio',
      description: '¿No está seguro de cuánto debería cobrar por su propiedad? No se preocupe, déjenos hacer los cálculos.',
      buttonText: '',
      buttonLink: '',
      hasBigCard: false,
      iconClass: 'text-indigo-600'
    },
    {
      icon: 'cash',
      title: 'Comisión más baja',
      description: 'Ya no tienes que negociar comisiones ni registrarte con otros agentes ¡solo cuesta el 2%!',
      buttonText: '',
      buttonLink: '',
      hasBigCard: false,
      iconClass: 'text-indigo-600'
    },
    {
      icon: 'chart-bar',
      title: 'Control general',
      description: 'Obtén un recorrido virtual y programa visitas antes de alquilar o comprar cualquier propiedad. Tendrás control total.',
      buttonText: '',
      buttonLink: '',
      hasBigCard: false,
      iconClass: 'text-indigo-600'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}