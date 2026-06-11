import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mis Finanzas', // Nombre completo de la app
    short_name: 'Finanzas', // Nombre corto para el icono del celular
    description: 'Control inteligente de mis ingresos y egresos',
    start_url: '/',
    display: 'standalone', // Esto es CLAVE: quita la barra del navegador y lo hace parecer app
    background_color: '#ffffff', // Color de fondo al abrir la app
    theme_color: '#000000', // Color de la barra de estado del celular
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}