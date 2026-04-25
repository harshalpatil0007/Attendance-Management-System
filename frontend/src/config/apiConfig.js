const isProd = import.meta.env.PROD;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyANkzU6GRBvdwgwcS-YBz282wMs_1p-afw';

