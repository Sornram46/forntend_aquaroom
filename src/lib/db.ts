// API utility functions สำหรับเรียก backend
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.ADMIN_API_URL || 'https://backend-aquaroom.vercel.app';

export async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function fetchPopularProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/popular`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular products:', error);
    throw error;
  }
}