// API utility functions สำหรับเรียก backend
const API_BASE_URL = 'https://backend-aquaroom.vercel.app'; // URL ของ backend ที่ deploy แล้ว

export async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return mock data as fallback
    return [];
  }
}

export async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return mock data as fallback
    return [
      {
        id: 1,
        name: 'อุปกรณ์คอมพิวเตอร์',
        image_url_cate: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500&h=300&fit=crop',
        is_active: true,
        products_count: 15
      },
      {
        id: 2,
        name: 'เครื่องใช้ไฟฟ้า',
        image_url_cate: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop',
        is_active: true,
        products_count: 8
      }
    ];
  }
}

export async function fetchPopularProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/popular`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return [];
  }
}

export async function fetchHomepageSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/homepage-setting`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return {};
  }
}