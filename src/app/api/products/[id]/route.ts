import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ไข params type
) {
  try {
    // ✅ ต้อง await params ก่อนใช้งาน
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    console.log('🔍 Getting product with ID:', id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // ✅ SQL Query ที่รวมข้อมูลเพิ่มเติมทั้งหมดตาม Prisma Schema
    const sqlQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.image_url_two,
             p.image_url_three, p.image_url_four, p.stock, p.is_popular,
             p.updated_at, p.created_at,
             
             -- ข้อมูลการจัดส่งปกติ
             p.shipping_cost_bangkok, p.shipping_cost_provinces, p.shipping_cost_remote,
             p.free_shipping_threshold, p.delivery_time, p.shipping_notes, p.special_handling,
             
             -- ข้อมูลการจัดส่งพิเศษ
             p.has_special_shipping, p.special_shipping_base, 
             p.special_shipping_qty, p.special_shipping_extra, p.special_shipping_notes,
             
             -- ✅ ข้อมูลเพิ่มเติมสำหรับหน้าสินค้า (ตรงตาม Prisma Schema)
             p.specifications, p.features, p.shipping_info, p.warranty_info, 
             p.return_policy, p.care_instructions, p.dimensions, p.weight, 
             p.material, p.country_origin,
             
             -- ข้อมูลหมวดหมู่
             c.name as category, c.id as category_id
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await query(sqlQuery, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productData = result.rows[0];
    
    const product = {
      id: productData.id,
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      imageUrl: productData.image_url,
      imageUrlTwo: productData.image_url_two,
      imageUrlThree: productData.image_url_three,
      imageUrlFour: productData.image_url_four,
      category: productData.category || 'ไม่ระบุหมวดหมู่',
      categoryId: productData.category_id,
      stock: parseInt(productData.stock) || 0,
      isPopular: productData.is_popular || false,
      
      // ข้อมูลการจัดส่งปกติ
      shippingCostBangkok: productData.shipping_cost_bangkok ? parseFloat(productData.shipping_cost_bangkok) : 0,
      shippingCostProvinces: productData.shipping_cost_provinces ? parseFloat(productData.shipping_cost_provinces) : 50,
      shippingCostRemote: productData.shipping_cost_remote ? parseFloat(productData.shipping_cost_remote) : 100,
      freeShippingThreshold: productData.free_shipping_threshold ? parseFloat(productData.free_shipping_threshold) : null,
      deliveryTime: productData.delivery_time || '2-3 วัน',
      shippingNotes: productData.shipping_notes,
      specialHandling: productData.special_handling || false,
      
      // ข้อมูลการจัดส่งพิเศษ
      hasSpecialShipping: productData.has_special_shipping || false,
      specialShippingBase: productData.special_shipping_base ? parseFloat(productData.special_shipping_base) : null,
      specialShippingQty: productData.special_shipping_qty ? parseInt(productData.special_shipping_qty) : null,
      specialShippingExtra: productData.special_shipping_extra ? parseFloat(productData.special_shipping_extra) : null,
      specialShippingNotes: productData.special_shipping_notes,
      
      // ✅ ข้อมูลเพิ่มเติมสำหรับหน้าสินค้า
      specifications: productData.specifications,      // ข้อมูลคุณสมบัติ (HTML/JSON)
      features: productData.features,                  // คุณสมบัติพิเศษ (HTML/JSON)
      shippingInfo: productData.shipping_info,         // ข้อมูลการจัดส่งเพิ่มเติม (HTML)
      warrantyInfo: productData.warranty_info,         // ข้อมูลการรับประกัน
      returnPolicy: productData.return_policy,         // นโยบายการคืนสินค้า
      careInstructions: productData.care_instructions, // วิธีการดูแล
      dimensions: productData.dimensions,              // ขนาดสินค้า
      weight: productData.weight,                      // น้ำหนัก
      material: productData.material,                  // วัสดุ
      countryOrigin: productData.country_origin,       // ประเทศผู้ผลิต
      
      // วันที่
      createdAt: productData.created_at,
      updatedAt: productData.updated_at
    };
    
    console.log('✅ Product found:', product.name);
    console.log('📊 Product has additional info:', {
      hasSpecifications: !!product.specifications,
      hasFeatures: !!product.features,
      hasShippingInfo: !!product.shippingInfo,
      hasWarrantyInfo: !!product.warrantyInfo,
      hasDimensions: !!product.dimensions,
      hasMaterial: !!product.material
    });
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('❌ Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ไข params type
) {
  try {
    // ✅ ต้อง await params ก่อนใช้งาน
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    console.log('📝 Updating product with ID:', id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('📥 Update data received:', body);
    
    const { 
      name, 
      description, 
      price, 
      stock, 
      categoryId, 
      is_popular, 
      image_url,
      image_url_two,
      image_url_three,
      image_url_four,
      
      // ข้อมูลการจัดส่งปกติ
      shipping_cost_bangkok,
      shipping_cost_provinces,
      shipping_cost_remote,
      free_shipping_threshold,
      delivery_time,
      shipping_notes,
      special_handling,
      
      // ข้อมูลการจัดส่งพิเศษ
      has_special_shipping,
      special_shipping_base,
      special_shipping_qty,
      special_shipping_extra,
      special_shipping_notes,
      
      // ✅ ข้อมูลเพิ่มเติมสำหรับหน้าสินค้า
      specifications,      // ข้อมูลคุณสมบัติ (HTML/JSON)
      features,           // คุณสมบัติพิเศษ (HTML/JSON)
      shipping_info,      // ข้อมูลการจัดส่งเพิ่มเติม (HTML)
      warranty_info,      // ข้อมูลการรับประกัน
      return_policy,      // นโยบายการคืนสินค้า
      care_instructions,  // วิธีการดูแล
      dimensions,         // ขนาดสินค้า
      weight,             // น้ำหนัก
      material,           // วัสดุ
      country_origin      // ประเทศผู้ผลิต
    } = body;

    // ตรวจสอบว่าสินค้ามีอยู่จริง
    const checkQuery = 'SELECT id FROM products WHERE id = $1';
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // สร้าง SQL query สำหรับอัปเดต
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // ข้อมูลพื้นฐาน
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      updateValues.push(price);
    }
    
    if (stock !== undefined) {
      updateFields.push(`stock = $${paramIndex++}`);
      updateValues.push(stock);
    }
    
    if (is_popular !== undefined) {
      updateFields.push(`is_popular = $${paramIndex++}`);
      updateValues.push(is_popular);
    }

    // รูปภาพ
    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      updateValues.push(image_url);
    }
    
    if (image_url_two !== undefined) {
      updateFields.push(`image_url_two = $${paramIndex++}`);
      updateValues.push(image_url_two);
    }
    
    if (image_url_three !== undefined) {
      updateFields.push(`image_url_three = $${paramIndex++}`);
      updateValues.push(image_url_three);
    }
    
    if (image_url_four !== undefined) {
      updateFields.push(`image_url_four = $${paramIndex++}`);
      updateValues.push(image_url_four);
    }

    // ข้อมูลการจัดส่งปกติ
    if (shipping_cost_bangkok !== undefined) {
      updateFields.push(`shipping_cost_bangkok = $${paramIndex++}`);
      updateValues.push(shipping_cost_bangkok);
    }
    
    if (shipping_cost_provinces !== undefined) {
      updateFields.push(`shipping_cost_provinces = $${paramIndex++}`);
      updateValues.push(shipping_cost_provinces);
    }
    
    if (shipping_cost_remote !== undefined) {
      updateFields.push(`shipping_cost_remote = $${paramIndex++}`);
      updateValues.push(shipping_cost_remote);
    }
    
    if (free_shipping_threshold !== undefined) {
      updateFields.push(`free_shipping_threshold = $${paramIndex++}`);
      updateValues.push(free_shipping_threshold);
    }
    
    if (delivery_time !== undefined) {
      updateFields.push(`delivery_time = $${paramIndex++}`);
      updateValues.push(delivery_time);
    }
    
    if (shipping_notes !== undefined) {
      updateFields.push(`shipping_notes = $${paramIndex++}`);
      updateValues.push(shipping_notes);
    }
    
    if (special_handling !== undefined) {
      updateFields.push(`special_handling = $${paramIndex++}`);
      updateValues.push(special_handling);
    }

    // ข้อมูลการจัดส่งพิเศษ
    if (has_special_shipping !== undefined) {
      updateFields.push(`has_special_shipping = $${paramIndex++}`);
      updateValues.push(has_special_shipping);
    }
    
    if (special_shipping_base !== undefined) {
      updateFields.push(`special_shipping_base = $${paramIndex++}`);
      updateValues.push(special_shipping_base);
    }
    
    if (special_shipping_qty !== undefined) {
      updateFields.push(`special_shipping_qty = $${paramIndex++}`);
      updateValues.push(special_shipping_qty);
    }
    
    if (special_shipping_extra !== undefined) {
      updateFields.push(`special_shipping_extra = $${paramIndex++}`);
      updateValues.push(special_shipping_extra);
    }
    
    if (special_shipping_notes !== undefined) {
      updateFields.push(`special_shipping_notes = $${paramIndex++}`);
      updateValues.push(special_shipping_notes);
    }

    // ✅ ข้อมูลเพิ่มเติมสำหรับหน้าสินค้า
    if (specifications !== undefined) {
      updateFields.push(`specifications = $${paramIndex++}`);
      updateValues.push(specifications);
    }
    
    if (features !== undefined) {
      updateFields.push(`features = $${paramIndex++}`);
      updateValues.push(features);
    }
    
    if (shipping_info !== undefined) {
      updateFields.push(`shipping_info = $${paramIndex++}`);
      updateValues.push(shipping_info);
    }
    
    if (warranty_info !== undefined) {
      updateFields.push(`warranty_info = $${paramIndex++}`);
      updateValues.push(warranty_info);
    }
    
    if (return_policy !== undefined) {
      updateFields.push(`return_policy = $${paramIndex++}`);
      updateValues.push(return_policy);
    }
    
    if (care_instructions !== undefined) {
      updateFields.push(`care_instructions = $${paramIndex++}`);
      updateValues.push(care_instructions);
    }
    
    if (dimensions !== undefined) {
      updateFields.push(`dimensions = $${paramIndex++}`);
      updateValues.push(dimensions);
    }
    
    if (weight !== undefined) {
      updateFields.push(`weight = $${paramIndex++}`);
      updateValues.push(weight);
    }
    
    if (material !== undefined) {
      updateFields.push(`material = $${paramIndex++}`);
      updateValues.push(material);
    }
    
    if (country_origin !== undefined) {
      updateFields.push(`country_origin = $${paramIndex++}`);
      updateValues.push(country_origin);
    }

    // เพิ่ม updated_at
    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(new Date());

    if (updateFields.length === 1) { // เฉพาะ updated_at
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // เพิ่ม product ID ที่ท้าย
    updateValues.push(id);

    const updateQuery = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('🔄 Update query:', updateQuery);
    console.log('🔄 Update values:', updateValues);

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // อัปเดตหมวดหมู่ (ถ้ามี)
    if (categoryId !== undefined) {
      // ลบการเชื่อมโยงเก่า
      await query('DELETE FROM product_categories WHERE product_id = $1', [id]);
      
      // เพิ่มการเชื่อมโยงใหม่ (ถ้ามี categoryId)
      if (categoryId && !isNaN(Number(categoryId))) {
        await query(
          'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }

    const updatedProduct = result.rows[0];
    
    console.log('✅ Product updated successfully:', updatedProduct.name);
    console.log('📊 Updated additional info:', {
      specifications: !!updatedProduct.specifications,
      features: !!updatedProduct.features,
      shipping_info: !!updatedProduct.shipping_info,
      warranty_info: !!updatedProduct.warranty_info,
      dimensions: !!updatedProduct.dimensions,
      material: !!updatedProduct.material
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully with additional information',
      product: {
        ...updatedProduct,
        price: Number(updatedProduct.price),
        shipping_cost_bangkok: updatedProduct.shipping_cost_bangkok ? Number(updatedProduct.shipping_cost_bangkok) : null,
        shipping_cost_provinces: updatedProduct.shipping_cost_provinces ? Number(updatedProduct.shipping_cost_provinces) : null,
        shipping_cost_remote: updatedProduct.shipping_cost_remote ? Number(updatedProduct.shipping_cost_remote) : null,
        special_shipping_base: updatedProduct.special_shipping_base ? Number(updatedProduct.special_shipping_base) : null,
        special_shipping_extra: updatedProduct.special_shipping_extra ? Number(updatedProduct.special_shipping_extra) : null,
        free_shipping_threshold: updatedProduct.free_shipping_threshold ? Number(updatedProduct.free_shipping_threshold) : null
      }
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ไข params type
) {
  try {
    // ✅ ต้อง await params ก่อนใช้งาน
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    console.log('🗑️ Deleting product with ID:', id);
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // ลบการเชื่อมโยงกับหมวดหมู่ก่อน
    await query('DELETE FROM product_categories WHERE product_id = $1', [id]);
    
    // ลบสินค้า
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('✅ Product deleted successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}