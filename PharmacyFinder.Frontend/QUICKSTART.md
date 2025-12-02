# Quick Start Guide

## Prerequisites
- Node.js v18+ and npm installed
- Backend API running on `http://localhost:5155`

## Setup Steps

1. **Install Dependencies**
   ```bash
   cd PharmacyFinder.Frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:4200`

3. **Verify Backend Connection**
   - Ensure your backend API is running on `http://localhost:5155`
   - If your backend uses a different port, update `src/environments/environment.ts`

## Features

### Authentication
- **Login**: Navigate to `/login` to sign in
- **Register**: Navigate to `/register` to create a new account
- **User Roles**: Customer, Pharmacy Owner, Admin

### Protected Routes
- `/home` - Requires authentication (redirects to login if not authenticated)

## Testing the Application

1. Start the backend API
2. Start the frontend (`npm start`)
3. Navigate to `http://localhost:4200`
4. You'll be redirected to the login page
5. Click "Sign up" to create a new account
6. After registration/login, you'll be redirected to the home page

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend API has CORS configured to allow requests from `http://localhost:4200`

### API Connection Issues
- Verify the API URL in `src/environments/environment.ts`
- Check that the backend is running and accessible
- Check browser console for detailed error messages









