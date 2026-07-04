"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface AddressSelectorProps {
  value: string; // Chuỗi địa chỉ kết hợp (đường, phường, quận, tỉnh)
  onChange: (address: string) => void;
  disabled?: boolean;
}

export default function AddressSelector({
  value,
  onChange,
  disabled = false,
}: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [detailedAddress, setDetailedAddress] = useState<string>("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Khởi tạo từ giá trị có sẵn (ví dụ: lấy từ profile lưu sẵn của User)
  useEffect(() => {
    if (value && !selectedProvince && !selectedDistrict && !selectedWard && !detailedAddress) {
      setDetailedAddress(value);
    }
  }, [value]);

  // Tải danh sách Tỉnh / Thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        if (res.ok) {
          const data = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.error("Failed to fetch provinces:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Tải danh sách Quận / Huyện khi thay đổi Tỉnh / Thành phố
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict("");
      setSelectedWard("");
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`
        );
        if (res.ok) {
          const data = await res.json();
          setDistricts(data.districts || []);
          setWards([]);
          setSelectedDistrict("");
          setSelectedWard("");
        }
      } catch (err) {
        console.error("Failed to fetch districts:", err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Tải danh sách Phường / Xã khi thay đổi Quận / Huyện
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`
        );
        if (res.ok) {
          const data = await res.json();
          setWards(data.wards || []);
          setSelectedWard("");
        }
      } catch (err) {
        console.error("Failed to fetch wards:", err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Kết hợp các trường và gửi kết quả về cho Component cha
  const handleAddressChange = (
    provCode: string,
    distCode: string,
    wardCode: string,
    detail: string
  ) => {
    const provName = provinces.find((p) => String(p.code) === provCode)?.name || "";
    const distName = districts.find((d) => String(d.code) === distCode)?.name || "";
    const wardName = wards.find((w) => String(w.code) === wardCode)?.name || "";

    const parts = [
      detail.trim(),
      wardName,
      distName,
      provName,
    ].filter(Boolean);

    onChange(parts.join(", "));
  };

  const onProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedProvince(code);
    setSelectedDistrict("");
    setSelectedWard("");
    handleAddressChange(code, "", "", detailedAddress);
  };

  const onDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedDistrict(code);
    setSelectedWard("");
    handleAddressChange(selectedProvince, code, "", detailedAddress);
  };

  const onWardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedWard(code);
    handleAddressChange(selectedProvince, selectedDistrict, code, detailedAddress);
  };

  const onDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDetailedAddress(text);
    handleAddressChange(selectedProvince, selectedDistrict, selectedWard, text);
  };

  const selectClasses =
    "w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 transition-all outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedProvince}
          onChange={onProvinceSelect}
          disabled={disabled || loadingProvinces}
          className={selectClasses}
        >
          <option value="">-- Tỉnh/Thành phố --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          onChange={onDistrictSelect}
          disabled={disabled || !selectedProvince || loadingDistricts}
          className={selectClasses}
        >
          <option value="">-- Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedWard}
          onChange={onWardSelect}
          disabled={disabled || !selectedDistrict || loadingWards}
          className={selectClasses}
        >
          <option value="">-- Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Số nhà, tên đường, ngõ ngách... (Địa chỉ chi tiết)"
        value={detailedAddress}
        onChange={onDetailChange}
        disabled={disabled}
        className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 transition-all outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}
