# Prescripto Frontend

A React-based frontend for the Prescripto Doctor Appointment Booking System.

## Environment Configuration

### Local Development
The app will automatically use `http://localhost:3000/api` as the backend URL.

### Production Deployment
Set the following environment variables in your deployment platform (e.g., Vercel):

```bash
VITE_API_URL=https://your-backend-url.com/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Important:** Replace `your-backend-url.com` with your actual backend deployment URL.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features

- User authentication (login/signup)
- Doctor browsing and selection
- Appointment booking with Stripe payment
- User profile management
- Responsive design

## Tech Stack

- React 18
- Vite
- Axios for API calls
- Stripe for payments
- CSS for styling
