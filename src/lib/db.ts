// API utility functions สำหรับเรียก backend
const API_BASE_URL = 'https://backend-aquaroom.vercel.app';

export async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Products API returned ${response.status}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
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
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Categories API returned ${response.status}`);
      return getMockCategories();
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return getMockCategories();
  }
}

export async function fetchPopularProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/popular`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Popular products API returned ${response.status}`);
      return [];
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
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Homepage settings API returned ${response.status}`);
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return {};
  }
}

// Mock data สำหรับ fallback
function getMockCategories() {
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
    },
    {
      id: 3,
      name: 'อุปกรณ์กีฬา',
      image_url_cate: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop',
      is_active: true,
      products_count: 12
    },
    {
      id: 4,
      name: 'เสื้อผ้าแฟชั่น',
      image_url_cate: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=300&fit=crop',
      is_active: true,
      products_count: 25
    }
  ];
}