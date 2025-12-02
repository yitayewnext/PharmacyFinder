# PharmacyFinder Frontend

Angular frontend application for the PharmacyFinder system.

## Features

- User authentication (Login/Register)
- JWT token management
- Protected routes with auth guards
- Modern, responsive UI
- Role-based user management

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

## Build

Build for production:
```bash
npm run build
```

## Configuration

Update the API URL in `src/environments/environment.ts` to match your backend API endpoint.

Default API URL: `http://localhost:5155`

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   └── services/        # Core services
│   ├── features/
│   │   ├── auth/            # Authentication components
│   │   └── home/            # Home component
│   ├── models/              # TypeScript models/interfaces
│   ├── app.component.ts     # Root component
│   └── app.routes.ts        # Application routes
├── environments/            # Environment configurations
└── styles.css              # Global styles
```

## API Integration

The frontend communicates with the backend API at:
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`

All authenticated requests automatically include the JWT token in the Authorization header.









