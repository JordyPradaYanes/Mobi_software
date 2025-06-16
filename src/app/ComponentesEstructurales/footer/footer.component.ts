import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})


export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  
  // Variables de colores usados en el componente
  colors = {
    primary: '#6366f1', // Color morado para el logo
    textDark: '#333333', // Texto principal oscuro
    textLight: '#666666', // Texto secundario más claro
    borderColor: '#e5e7eb', // Color de borde
    hoverColor: '#4f46e5', // Color para hover
    backgroundColor: '#ffffff' // Fondo blanco
  };

  // Columnas del footer
  footerColumns = [
    {
      title: 'Vende tu casa',
      links: [
        { name: 'Solicitar una oferta', url: '/request-offer' },
        { name: 'Precios', url: '/pricing' },
        { name: 'Reseñas', url: '/reviews' },
        { name: 'Historias', url: '/stories' }
      ]
    },
    {
      title: 'Compra una casa',
      links: [
        { name: 'Compra', url: '/buy' },
        { name: 'Financia', url: '/finance' }
      ]
    },
    {
      title: 'Compra, renta o vende',
      links: [
        { name: 'Compra y venta de propiedades', url: '/properties' },
        { name: 'Renta una casa', url: '/rent' },
        { name: 'Intercambio de constructores', url: '/builder-trade' }
      ]
    },
    {
      title: 'Terminos y condiciones',
      links: [
        { name: 'Confianza y seguridad', url: '/trust-safety' },
        { name: 'Terminos del servicio', url: '/terms' },
        { name: 'Politica de privacidad', url: '/privacy' }
      ]
    },
    {
      title: 'Sobre nosotros',
      links: [
        { name: 'Compañia', url: '/company' },
        { name: 'Como funciona', url: '/how-it-works' },
        { name: 'Contacto', url: '/contact' },
        { name: 'Inversores', url: '/investors' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Blog', url: '/blog' },
        { name: 'Guias', url: '/guides' },
        { name: 'FAQ', url: '/faq' },
        { name: 'Centro de ayuda', url: '/help' }
      ]
    }
  ];

  // Íconos de redes sociales
  socialLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://facebook.com/' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com/' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com/' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://linkedin.com/' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}