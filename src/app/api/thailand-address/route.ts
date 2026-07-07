import { NextRequest, NextResponse } from 'next/server';
import { districts, provinces, subDistricts } from '@bilions/thailand-address';

const districtMap = new Map(districts.map((district) => [district.id, district]));
const provinceMap = new Map(provinces.map((province) => [province.id, province]));

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? '8');
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  if (query.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  const normalizedQuery = query.toLowerCase();
  const numericQuery = query.replace(/\D/g, '');

  const results = subDistricts
    .map((subDistrict) => {
      const district = districtMap.get(subDistrict.district_id);
      const province = district ? provinceMap.get(district.province_id) : undefined;

      if (!district || !province) {
        return null;
      }

      return {
        subDistrictId: subDistrict.id,
        districtId: district.id,
        provinceId: province.id,
        district: subDistrict.name_in_thai,
        city: district.name_in_thai.replace(/^เขต\s*/, '').replace(/^อำเภอ\s*/, ''),
        province: province.name_in_thai,
        postalCode: String(subDistrict.zip_code),
        label: `${subDistrict.name_in_thai} , ${district.name_in_thai.replace(/^เขต\s*/, '').replace(/^อำเภอ\s*/, '')} , ${province.name_in_thai} ${subDistrict.zip_code}`,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => {
      const haystack = [item.district, item.city, item.province, item.postalCode, item.label]
        .join(' ')
        .toLowerCase();

      if (numericQuery.length > 0) {
        return item.postalCode.includes(numericQuery) || haystack.includes(normalizedQuery);
      }

      return haystack.includes(normalizedQuery);
    })
    .slice(0, limit);

  return NextResponse.json({ success: true, data: results });
}