"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation"; // เพิ่ม useSearchParams
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

interface Address {
  id: number;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  district: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

export default function AddressPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // เพิ่มการอ่าน query parameters
  const redirectTo = searchParams.get("redirect"); // อ่านค่า redirect parameter
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);

  // ฟอร์มสำหรับกรอกที่อยู่
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    district: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
  });

  // รายชื่อจังหวัดในไทย (ตัวอย่างบางส่วน)
  const provinces = [
    "กรุงเทพมหานคร",
    "กระบี่",
    "กาญจนบุรี",
    "กาฬสินธุ์",
    "กำแพงเพชร",
    "ขอนแก่น",
    "จันทบุรี",
    "ฉะเชิงเทรา",
    "ชลบุรี",
    "ชัยนาท",
    "ชัยภูมิ",
    "ชุมพร",
    "เชียงราย",
    "เชียงใหม่",
    // เพิ่มจังหวัดอื่นๆ ตามต้องการ
  ];

  // โหลดที่อยู่ของผู้ใช้เมื่อเข้าหน้า
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    fetchUserAddresses();
  }, [isAuthenticated, isLoading, router]);

  // ดึงข้อมูลที่อยู่จากฐานข้อมูล
  const fetchUserAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/addresses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลที่อยู่ได้");
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("ไม่สามารถโหลดข้อมูลที่อยู่ได้");
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // เปิดโมดัลเพื่อเพิ่มที่อยู่ใหม่
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      district: "",
      city: "",
      province: "",
      postal_code: "",
      is_default: false,
    });
    setIsModalOpen(true);
  };

  // เปิดโมดัลเพื่อแก้ไขที่อยู่
  const openEditModal = (address: Address) => {
    setIsEditMode(true);
    setCurrentAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      district: address.district,
      city: address.city,
      province: address.province,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setIsModalOpen(true);
  };

  // บันทึกที่อยู่ (เพิ่มใหม่หรือแก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = isEditMode
        ? `/api/user/addresses/${currentAddress?.id}`
        : "/api/user/addresses";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถบันทึกข้อมูลที่อยู่ได้");
      }

      // เมื่อบันทึกเสร็จแล้ว ถ้ามีการระบุว่าต้องกลับไปที่หน้าชำระเงิน
      if (redirectTo === "checkout") {
        Swal.fire({
          icon: "success",
          title: isEditMode ? "แก้ไขที่อยู่สำเร็จ" : "เพิ่มที่อยู่สำเร็จ",
          text: "กำลังนำท่านไปยังหน้าชำระเงิน",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          router.push("/cart"); // กลับไปยังหน้าตะกร้าเพื่อดำเนินการชำระเงิน
        });
      } else {
        // แสดงข้อความปกติถ้าไม่มีการระบุให้กลับไปที่หน้าชำระเงิน
        Swal.fire({
          icon: "success",
          title: isEditMode ? "แก้ไขที่อยู่สำเร็จ" : "เพิ่มที่อยู่สำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
      }

      setIsModalOpen(false);

      // โหลดข้อมูลที่อยู่ใหม่
      await fetchUserAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลที่อยู่ได้",
      });
    }
  };

  // ลบที่อยู่
  const handleDelete = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "คุณแน่ใจหรือไม่?",
        text: "การลบที่อยู่นี้ไม่สามารถยกเลิกได้",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "ใช่, ลบเลย",
        cancelButtonText: "ยกเลิก",
      });

      if (result.isConfirmed) {
        const response = await fetch(`/api/user/addresses/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("ไม่สามารถลบที่อยู่ได้");
        }

        // โหลดข้อมูลที่อยู่ใหม่
        await fetchUserAddresses();

        Swal.fire({
          icon: "success",
          title: "ลบที่อยู่สำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถลบที่อยู่ได้",
      });
    }
  };

  // ตั้งค่าเป็นที่อยู่เริ่มต้น
  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}/default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถตั้งค่าที่อยู่เริ่มต้นได้");
      }

      // โหลดข้อมูลที่อยู่ใหม่
      await fetchUserAddresses();

      Swal.fire({
        icon: "success",
        title: "ตั้งค่าที่อยู่เริ่มต้นสำเร็จ",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error setting default address:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถตั้งค่าที่อยู่เริ่มต้นได้",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="text-red-600 text-xl mb-4">เกิดข้อผิดพลาด</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* หัวข้อ */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                ที่อยู่จัดส่งของฉัน
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                จัดการที่อยู่สำหรับการจัดส่งสินค้าของคุณ
              </p>
            </div>

            {/* เพิ่มปุ่มกลับไปหน้าตะกร้า เฉพาะเมื่อมาจากหน้าชำระเงิน */}
            {redirectTo === "checkout" && (
              <button
                onClick={() => router.push("/cart")}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                กลับไปหน้าตะกร้า
              </button>
            )}
          </div>

          {/* รายการที่อยู่ */}
          <div className="p-6">
            <button
              onClick={openAddModal}
              className="mb-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              เพิ่มที่อยู่ใหม่
            </button>

            {addresses.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  ยังไม่มีที่อยู่
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  เพิ่มที่อยู่สำหรับการจัดส่งสินค้า
                </p>
                <div className="mt-6">
                  <button
                    onClick={openAddModal}
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    เพิ่มที่อยู่
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border ${
                      address.is_default
                        ? "border-indigo-500"
                        : "border-gray-200"
                    } rounded-lg p-4 relative`}
                  >
                    {address.is_default && (
                      <span className="absolute top-2 right-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">
                        ค่าเริ่มต้น
                      </span>
                    )}

                    <h3 className="font-medium">{address.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                    <p className="mt-2 text-sm text-gray-600">
                      {address.address_line1}
                      {address.address_line2 && (
                        <span>, {address.address_line2}</span>
                      )}
                      <br />
                      {address.district}, {address.city}
                      <br />
                      {address.province}, {address.postal_code}
                    </p>

                    <div className="mt-4 flex justify-between">
                      <div className="space-x-2">
                        <button
                          onClick={() => openEditModal(address)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </div>
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          ตั้งเป็นค่าเริ่มต้น
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* โมดัลเพิ่ม/แก้ไขที่อยู่ */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditMode ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  {/* ชื่อ */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* เบอร์โทรศัพท์ */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      title="กรุณากรอกเบอร์โทรศัพท์ 10 หลัก"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* ที่อยู่บรรทัด 1 */}
                  <div>
                    <label
                      htmlFor="address_line1"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ที่อยู่ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address_line1"
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      required
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* ที่อยู่บรรทัด 2 */}
                  <div>
                    <label
                      htmlFor="address_line2"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ที่อยู่เพิ่มเติม (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* แถวของแขวง/ตำบลและเขต/อำเภอ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="district"
                        className="block text-sm font-medium text-gray-700"
                      >
                        แขวง/ตำบล <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="district"
                        id="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700"
                      >
                        เขต/อำเภอ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* แถวของจังหวัดและรหัสไปรษณีย์ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="province"
                        className="block text-sm font-medium text-gray-700"
                      >
                        จังหวัด <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="province"
                        id="province"
                        value={formData.province}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">เลือกจังหวัด</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="postal_code"
                        className="block text-sm font-medium text-gray-700"
                      >
                        รหัสไปรษณีย์ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{5}"
                        title="กรุณากรอกรหัสไปรษณีย์ 5 หลัก"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* ตั้งเป็นที่อยู่เริ่มต้น */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_default"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_default"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      ตั้งเป็นที่อยู่เริ่มต้น
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isEditMode ? "บันทึกการแก้ไข" : "เพิ่มที่อยู่"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}