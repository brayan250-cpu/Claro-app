# Claro Viajes App

Prototipo de aplicación Angular para la gestión de viajes corporativos y rendiciones de gastos de Claro Perú.

## Tecnologías

- **Angular 17** (standalone components)
- **Angular Material** (componentes UI)
- **SCSS** (estilos)
- **TypeScript**

## Módulos funcionales

- **Autenticación** — Login con roles (colaborador, jefe, finanzas, admin)
- **Solicitudes de viaje** — Creación, listado y detalle de solicitudes
- **Rendiciones de gastos** — Formulario, listado y flujo de aprobación
- **Aprobaciones** — Panel para jefes y finanzas
- **Dashboard** — Vista general por rol
- **Reportes** — Exportación de datos

## Requisitos previos

- Node.js >= 18
- npm >= 9
- Angular CLI: `npm install -g @angular/cli`

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
ng serve
```

La app estará disponible en `http://localhost:4200`.

## Build de producción

```bash
ng build
```

Los archivos compilados se generan en `dist/`.
