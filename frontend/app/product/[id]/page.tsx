"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity?: number;
}

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  gallery: string[];
  brand: string;
  type: string;
  origin: string;
  warranty: string;
  status: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
}

interface ProductDetailContentProps {
  product: Product;
  addToCart: (product: CartItem) => void;
}

const products: Product[] = [
  {
    id: 1,
    name: "Yamaha YAS-280",
    price: "35.800.000đ",
    image: "/images/yamaha-yas280.jpg",
    gallery: [
      "/images/yamaha-yas280.jpg",
      "/images/yamaha-yas280-1.jpg",
      "/images/yamaha-yas280-2.jpg",
      "/images/yamaha-yas280-3.jpg",
    ],
    brand: "Yamaha",
    type: "Alto Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yamaha YAS-280 là dòng Alto Saxophone phù hợp cho người mới học và học sinh âm nhạc. Kèn có âm thanh sáng, dễ thổi, phím bấm nhẹ và độ ổn định cao.",
    features: [
      "Phù hợp cho người mới bắt đầu",
      "Âm thanh sáng, dễ kiểm soát",
      "Phím bấm nhẹ, dễ thao tác",
      "Thiết kế bền bỉ cho luyện tập hằng ngày",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 2,
    name: "Selmer AS500",
    price: "51.000.000đ",
    image: "/images/selmer-as500.jpg",
    gallery: [
      "/images/selmer-as500.jpg",
      "/images/selmer-as500-1.jpg",
      "/images/selmer-as500-2.jpg",
      "/images/selmer-as500-3.jpg",
    ],
    brand: "Selmer",
    type: "Alto Saxophone",
    origin: "Mỹ / Pháp",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Selmer AS500 là mẫu Alto Saxophone có thiết kế chắc chắn, âm thanh ấm và dễ kiểm soát.",
    features: [
      "Âm thanh ấm, ổn định",
      "Thiết kế chắc chắn",
      "Phù hợp luyện tập và biểu diễn cơ bản",
      "Dễ bảo dưỡng, dễ sử dụng",
    ],
    specs: {
      "Thương hiệu": "Selmer",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Mỹ / Pháp",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 3,
    name: "Conn AS650",
    price: "12.000.000đ",
    image: "/images/conn-as650.jpg",
    gallery: ["/images/conn-as650.jpg"],
    brand: "Conn",
    type: "Alto Saxophone",
    origin: "Mỹ",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Conn AS650 là dòng Alto Saxophone phổ thông, phù hợp cho người mới bắt đầu luyện tập.",
    features: [
      "Giá dễ tiếp cận",
      "Phù hợp người mới bắt đầu",
      "Âm thanh ổn định",
      "Dễ dùng cho luyện tập hằng ngày",
    ],
    specs: {
      "Thương hiệu": "Conn",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Mỹ",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 4,
    name: "Yamaha YTS-280",
    price: "42.000.000đ",
    image: "/images/yamaha-yts280.jpg",
    gallery: ["/images/yamaha-yts280.jpg"],
    brand: "Yamaha",
    type: "Tenor Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yamaha YTS-280 là mẫu Tenor Saxophone có âm thanh dày, vang và ổn định.",
    features: [
      "Âm thanh dày và vang",
      "Thân kèn chắc chắn",
      "Phù hợp luyện tập tenor saxophone",
      "Độ ổn định cao",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại kèn": "Tenor Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 5,
    name: "Selmer TS400",
    price: "58.000.000đ",
    image: "/images/selmer-ts400.jpg",
    gallery: ["/images/selmer-ts400.jpg"],
    brand: "Selmer",
    type: "Tenor Saxophone",
    origin: "Mỹ / Pháp",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Selmer TS400 là mẫu Tenor Saxophone có âm thanh mạnh mẽ, phù hợp luyện tập và biểu diễn.",
    features: [
      "Âm thanh mạnh mẽ",
      "Thiết kế chắc chắn",
      "Phù hợp người chơi bán chuyên",
      "Dễ kiểm soát âm sắc",
    ],
    specs: {
      "Thương hiệu": "Selmer",
      "Loại kèn": "Tenor Saxophone",
      "Xuất xứ": "Mỹ / Pháp",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 6,
    name: "Jupiter JTS700",
    price: "35.000.000đ",
    image: "/images/jupiter-jts700.jpg",
    gallery: ["/images/jupiter-jts700.jpg"],
    brand: "Jupiter",
    type: "Tenor Saxophone",
    origin: "Đài Loan",
    warranty: "18 tháng",
    status: "Còn hàng",
    description:
      "Jupiter JTS700 là mẫu Tenor Saxophone có âm thanh ổn định, dễ chơi và phù hợp cho người mới học đến bán chuyên.",
    features: [
      "Âm thanh ổn định",
      "Dễ chơi, dễ bảo dưỡng",
      "Phù hợp người mới học",
      "Thiết kế chắc chắn",
    ],
    specs: {
      "Thương hiệu": "Jupiter",
      "Loại kèn": "Tenor Saxophone",
      "Xuất xứ": "Đài Loan",
      "Bảo hành": "18 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 7,
    name: "Yamaha YSS475",
    price: "56.000.000đ",
    image: "/images/yamaha-yss475.jpg",
    gallery: ["/images/yamaha-yss475.jpg"],
    brand: "Yamaha",
    type: "Soprano Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yamaha YSS475 là mẫu Soprano Saxophone cao cấp, âm thanh sáng và phím bấm nhẹ.",
    features: [
      "Âm thanh sáng, rõ",
      "Phím bấm nhẹ",
      "Thiết kế nhỏ gọn",
      "Phù hợp luyện tập và biểu diễn",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại kèn": "Soprano Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 8,
    name: "Yanagisawa S901",
    price: "72.000.000đ",
    image: "/images/yanagisawa-s901.jpg",
    gallery: ["/images/yanagisawa-s901.jpg"],
    brand: "Yanagisawa",
    type: "Soprano Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yanagisawa S901 là dòng Soprano Saxophone chất lượng cao, âm thanh cân bằng và cảm giác chơi mượt.",
    features: [
      "Âm thanh cân bằng",
      "Phím bấm mượt",
      "Độ hoàn thiện cao",
      "Phù hợp bán chuyên và chuyên nghiệp",
    ],
    specs: {
      "Thương hiệu": "Yanagisawa",
      "Loại kèn": "Soprano Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 9,
    name: "Jupiter JSS1000",
    price: "39.000.000đ",
    image: "/images/jupiter-jss1000.jpg",
    gallery: ["/images/jupiter-jss1000.jpg"],
    brand: "Jupiter",
    type: "Soprano Saxophone",
    origin: "Đài Loan",
    warranty: "18 tháng",
    status: "Còn hàng",
    description:
      "Jupiter JSS1000 là mẫu Soprano Saxophone có mức giá hợp lý, âm thanh ổn định.",
    features: [
      "Giá hợp lý",
      "Âm thanh ổn định",
      "Dễ chơi, dễ bảo dưỡng",
      "Phù hợp người mới học",
    ],
    specs: {
      "Thương hiệu": "Jupiter",
      "Loại kèn": "Soprano Saxophone",
      "Xuất xứ": "Đài Loan",
      "Bảo hành": "18 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 10,
    name: "Yamaha 4C Mouthpiece",
    price: "1.200.000đ",
    image: "/images/yamaha-4c-mouthpiece.jpg",
    gallery: ["/images/yamaha-4c-mouthpiece.jpg"],
    brand: "Yamaha",
    type: "Mouthpiece",
    origin: "Nhật Bản",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Yamaha 4C Mouthpiece là miệng thổi saxophone phổ biến, dễ thổi và phù hợp cho người mới học.",
    features: [
      "Dễ thổi, dễ kiểm soát hơi",
      "Phù hợp cho người mới học",
      "Âm thanh ổn định",
      "Thiết kế bền",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại sản phẩm": "Mouthpiece",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 11,
    name: "Selmer S80 Mouthpiece",
    price: "2.500.000đ",
    image: "/images/selmer-s80-mouthpiece.jpg",
    gallery: ["/images/selmer-s80-mouthpiece.jpg"],
    brand: "Selmer",
    type: "Mouthpiece",
    origin: "Pháp",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Selmer S80 Mouthpiece có âm thanh ấm, độ phản hồi tốt, phù hợp học tập và biểu diễn.",
    features: [
      "Âm thanh ấm",
      "Độ phản hồi tốt",
      "Phù hợp học tập",
      "Thiết kế cao cấp",
    ],
    specs: {
      "Thương hiệu": "Selmer",
      "Loại sản phẩm": "Mouthpiece",
      "Xuất xứ": "Pháp",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 12,
    name: "Vandoren AL3 Mouthpiece",
    price: "2.800.000đ",
    image: "/images/vandoren-al3-mouthpiece.jpg",
    gallery: ["/images/vandoren-al3-mouthpiece.jpg"],
    brand: "Vandoren",
    type: "Mouthpiece",
    origin: "Pháp",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Vandoren AL3 Mouthpiece cho âm thanh cân bằng, dễ kiểm soát và phù hợp với người chơi Alto Saxophone.",
    features: [
      "Âm thanh cân bằng",
      "Dễ kiểm soát âm sắc",
      "Phù hợp luyện tập",
      "Chất lượng hoàn thiện tốt",
    ],
    specs: {
      "Thương hiệu": "Vandoren",
      "Loại sản phẩm": "Mouthpiece",
      "Xuất xứ": "Pháp",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 13,
    name: "Dây Đeo Saxophone",
    price: "350.000đ",
    image: "/images/day-deo-saxophone.jpg",
    gallery: ["/images/day-deo-saxophone.jpg"],
    brand: "Yamaha",
    type: "Phụ Kiện",
    origin: "Việt Nam",
    warranty: "6 tháng",
    status: "Còn hàng",
    description:
      "Dây đeo Saxophone giúp người chơi đỡ mỏi cổ và giữ kèn chắc chắn khi luyện tập hoặc biểu diễn.",
    features: [
      "Thiết kế chắc chắn",
      "Đeo thoải mái khi chơi lâu",
      "Dễ điều chỉnh độ dài",
      "Phù hợp nhiều loại saxophone",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại sản phẩm": "Dây đeo Saxophone",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "6 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 14,
    name: "Bộ Vệ Sinh Saxophone",
    price: "450.000đ",
    image: "/images/bo-ve-sinh-saxophone.jpg",
    gallery: ["/images/bo-ve-sinh-saxophone.jpg"],
    brand: "Conn",
    type: "Phụ Kiện",
    origin: "Trung Quốc",
    warranty: "6 tháng",
    status: "Còn hàng",
    description:
      "Bộ vệ sinh Saxophone giúp làm sạch thân kèn, phím kèn và bên trong ống kèn sau khi sử dụng.",
    features: [
      "Hỗ trợ vệ sinh kèn sau khi chơi",
      "Giúp bảo quản kèn tốt hơn",
      "Gồm khăn lau, chổi vệ sinh và phụ kiện hỗ trợ",
      "Dễ sử dụng cho người mới học",
    ],
    specs: {
      "Thương hiệu": "Conn",
      "Loại sản phẩm": "Bộ vệ sinh Saxophone",
      "Xuất xứ": "Trung Quốc",
      "Bảo hành": "6 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 15,
    name: "Reed Alto Saxophone",
    price: "250.000đ",
    image: "/images/reed-alto-saxophone.jpg",
    gallery: ["/images/reed-alto-saxophone.jpg"],
    brand: "Vandoren",
    type: "Phụ Kiện",
    origin: "Pháp",
    warranty: "Không bảo hành",
    status: "Còn hàng",
    description:
      "Reed Alto Saxophone hỗ trợ tạo âm thanh ổn định, dễ phát âm và phù hợp cho luyện tập hằng ngày.",
    features: [
      "Âm thanh ổn định",
      "Dễ phát âm",
      "Phù hợp Alto Saxophone",
      "Thích hợp cho luyện tập và biểu diễn",
    ],
    specs: {
      "Thương hiệu": "Vandoren",
      "Loại sản phẩm": "Reed Alto Saxophone",
      "Xuất xứ": "Pháp",
      "Bảo hành": "Không bảo hành",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 16,
    name: "Yamaha YSS-475",
    price: "56.000.000đ",
    image: "/images/yamaha-yss475.jpg",
    gallery: ["/images/yamaha-yss475.jpg"],
    brand: "Yamaha",
    type: "Soprano Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yamaha YSS-475 là mẫu Soprano Saxophone cao cấp, âm thanh sáng, phím bấm nhẹ và độ ổn định cao.",
    features: [
      "Âm thanh sáng, rõ",
      "Phím bấm nhẹ",
      "Thiết kế nhỏ gọn",
      "Phù hợp biểu diễn",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại kèn": "Soprano Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 17,
    name: "Yamaha 4C Mouthpiece",
    price: "1.200.000đ",
    image: "/images/yamaha-4c-mouthpiece.jpg",
    gallery: ["/images/yamaha-4c-mouthpiece.jpg"],
    brand: "Yamaha",
    type: "Mouthpiece",
    origin: "Nhật Bản",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Yamaha 4C Mouthpiece là miệng thổi saxophone phổ biến, dễ thổi, phù hợp cho người mới học.",
    features: [
      "Dễ thổi",
      "Dễ kiểm soát hơi",
      "Phù hợp người mới học",
      "Âm thanh ổn định",
    ],
    specs: {
      "Thương hiệu": "Yamaha",
      "Loại sản phẩm": "Mouthpiece",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 18,
    name: "Selmer Supreme",
    price: "95.000.000đ",
    image: "/images/selmer-supreme.jpg",
    gallery: [
      "/images/selmer-supreme.jpg",
      "/images/selmer-supreme-1.jpg",
      "/images/selmer-supreme-2.jpg",
      "/images/selmer-supreme-3.jpg",
    ],
    brand: "Selmer",
    type: "Alto Saxophone",
    origin: "Pháp",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Selmer Supreme là dòng Alto Saxophone cao cấp, âm thanh mạnh mẽ, độ hoàn thiện tinh xảo.",
    features: [
      "Dòng kèn cao cấp của Selmer",
      "Âm thanh mạnh mẽ",
      "Phím bấm mượt",
      "Phù hợp chuyên nghiệp",
    ],
    specs: {
      "Thương hiệu": "Selmer",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Pháp",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 19,
    name: "Conn New Wonder",
    price: "28.000.000đ",
    image: "/images/conn-newwoner.jpg",
    gallery: [
      "/images/conn-newwoner.jpg",
      "/images/conn-newwoner-1.jpg",
      "/images/conn-newwoner-2.jpg",
      "/images/conn-newwoner-3.jpg",
    ],
    brand: "Conn",
    type: "Tenor Saxophone",
    origin: "Mỹ",
    warranty: "12 tháng",
    status: "Còn hàng",
    description:
      "Conn New Wonder là mẫu Tenor Saxophone phong cách vintage, chất âm ấm áp.",
    features: [
      "Phong cách vintage cổ điển",
      "Chất âm ấm áp",
      "Phù hợp luyện tập và biểu diễn",
      "Thiết kế bền bỉ",
    ],
    specs: {
      "Thương hiệu": "Conn",
      "Loại kèn": "Tenor Saxophone",
      "Xuất xứ": "Mỹ",
      "Bảo hành": "12 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 20,
    name: "Yanagisawa AWO1",
    price: "68.000.000đ",
    image: "/images/yanagisawa-awo1.jpg",
    gallery: [
      "/images/yanagisawa-awo1.jpg",
      "/images/yanagisawa-awo1-1.jpg",
      "/images/yanagisawa-awo1-2.jpg",
      "/images/yanagisawa-awo1-3.jpg",
    ],
    brand: "Yanagisawa",
    type: "Alto Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yanagisawa AWO1 là dòng Alto Saxophone cao cấp, âm thanh cân bằng, phím bấm mượt.",
    features: [
      "Âm thanh cân bằng",
      "Phím bấm mượt",
      "Thiết kế cao cấp",
      "Phù hợp bán chuyên",
    ],
    specs: {
      "Thương hiệu": "Yanagisawa",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 21,
    name: "Yanagisawa AWO1 Pro",
    price: "73.000.000đ",
    image: "/images/yanagisawa-awo1-1.jpg",
    gallery: [
      "/images/yanagisawa-awo1-1.jpg",
      "/images/yanagisawa-awo1-2.jpg",
      "/images/yanagisawa-awo1-3.jpg",
    ],
    brand: "Yanagisawa",
    type: "Alto Saxophone",
    origin: "Nhật Bản",
    warranty: "24 tháng",
    status: "Còn hàng",
    description:
      "Yanagisawa AWO1 Pro là dòng saxophone cao cấp, âm thanh cân bằng, phím bấm mượt.",
    features: [
      "Âm thanh cân bằng",
      "Phím bấm mượt",
      "Thiết kế cao cấp",
      "Phù hợp biểu diễn",
    ],
    specs: {
      "Thương hiệu": "Yanagisawa",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Nhật Bản",
      "Bảo hành": "24 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 22,
    name: "Jupiter JAS700",
    price: "31.000.000đ",
    image: "/images/jupiter-jas700.jpg",
    gallery: [
      "/images/jupiter-jas700.jpg",
      "/images/jupiter-jas700-1.jpg",
      "/images/jupiter-jas700-2.jpg",
      "/images/jupiter-jas700-3.jpg",
    ],
    brand: "Jupiter",
    type: "Alto Saxophone",
    origin: "Đài Loan",
    warranty: "18 tháng",
    status: "Còn hàng",
    description:
      "Jupiter JAS700 là mẫu Alto Saxophone dễ chơi, âm thanh ổn định, phù hợp cho người mới bắt đầu.",
    features: [
      "Dễ chơi",
      "Âm thanh ổn định",
      "Phù hợp người mới học",
      "Mức giá hợp lý",
    ],
    specs: {
      "Thương hiệu": "Jupiter",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Đài Loan",
      "Bảo hành": "18 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
  {
    id: 23,
    name: "Jupiter JAS700 Pro",
    price: "34.000.000đ",
    image: "/images/jupiter-jas700-1.jpg",
    gallery: [
      "/images/jupiter-jas700-1.jpg",
      "/images/jupiter-jas700.jpg",
      "/images/jupiter-jas700-2.jpg",
      "/images/jupiter-jas700-3.jpg",
    ],
    brand: "Jupiter",
    type: "Alto Saxophone",
    origin: "Đài Loan",
    warranty: "18 tháng",
    status: "Còn hàng",
    description:
      "Jupiter JAS700 Pro là phiên bản nâng cấp của JAS700, thiết kế chắc chắn và âm thanh sáng.",
    features: [
      "Phiên bản nâng cấp",
      "Âm thanh sáng",
      "Thiết kế chắc chắn",
      "Phù hợp luyện tập lâu dài",
    ],
    specs: {
      "Thương hiệu": "Jupiter",
      "Loại kèn": "Alto Saxophone",
      "Xuất xứ": "Đài Loan",
      "Bảo hành": "18 tháng",
      "Tình trạng": "Còn hàng",
    },
  },
];

export default function ProductDetail() {
  const params = useParams();
  const { addToCart } = useCart();

  const product = products.find((item) => item.id === Number(params?.id));

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-card">
          <div className="product-detail-info">
            <h1>Không tìm thấy sản phẩm</h1>

            <Link href="/products">
              <button className="back-btn">Quay lại sản phẩm</button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ProductDetailContent
      key={product.id}
      product={product}
      addToCart={addToCart}
    />
  );
}

function ProductDetailContent({
  product,
  addToCart,
}: ProductDetailContentProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState(product.image);

  const handleAddToCart = () => {
    setShowConfirm(true);
  };

  const confirmAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: String(product.price),
      image: product.image,
      quantity: 1,
    });

    setShowConfirm(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2200);
  };

  return (
    <main className="product-detail-page">
      <section className="yamaha-style-detail">
        <h1 className="yamaha-product-title">{product.name}</h1>

        <div className="yamaha-detail-layout">
          <div className="yamaha-left">
            <div className="yamaha-main-image">
              <Image
                src={selectedImage || product.image}
                alt={product.name}
                width={640}
                height={640}
              />
            </div>

            <div className="yamaha-gallery">
              {(product.gallery ?? []).map((img, index) => (
                <button
                  key={index}
                  className={
                    selectedImage === img
                      ? "yamaha-thumb active"
                      : "yamaha-thumb"
                  }
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    width={96}
                    height={96}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="yamaha-right">
            <div className="yamaha-tabs">
              <button
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                Tổng quan
              </button>

              <button
                className={activeTab === "specs" ? "active" : ""}
                onClick={() => setActiveTab("specs")}
              >
                Thông số kỹ thuật
              </button>

              <button
                className={activeTab === "download" ? "active" : ""}
                onClick={() => setActiveTab("download")}
              >
                Tải xuống
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="yamaha-tab-content">
                <p className="product-detail-type">{product.type}</p>
                <h2>{product.name}</h2>
                <p className="product-detail-price">{product.price}</p>
                <p className="product-detail-desc">{product.description}</p>

                <h3>Đặc điểm nổi bật</h3>
                <ul>
                  {(product.features ?? []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <div className="product-detail-meta">
                  <p>
                    <strong>Thương hiệu:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>Loại kèn:</strong> {product.type}
                  </p>
                  <p>
                    <strong>Xuất xứ:</strong> {product.origin}
                  </p>
                  <p>
                    <strong>Bảo hành:</strong> {product.warranty}
                  </p>
                  <p>
                    <strong>Tình trạng:</strong> {product.status}
                  </p>
                </div>
              </div>
            )}
            

            {activeTab === "specs" && (
              <div className="yamaha-tab-content">
                <h2>Thông số kỹ thuật</h2>
                <div className="product-long-detail">
  <h2>Chi Tiết Sản Phẩm</h2>

  <h3>{product.name}</h3>

  <p>
    {product.name} là dòng Saxophone được thiết kế dành cho người mới học,
    học sinh âm nhạc và người chơi bán chuyên. Kèn sở hữu âm thanh sáng,
    dễ kiểm soát cùng hệ thống phím bấm nhẹ giúp việc luyện tập trở nên
    hiệu quả hơn.
  </p>

  <h3>Thiết Kế Chuyên Nghiệp</h3>

  <p>
    Thân kèn được chế tạo từ đồng thau chất lượng cao với lớp sơn vàng bóng,
    mang lại vẻ ngoài sang trọng và độ bền cao. Các chi tiết được gia công
    chính xác giúp tăng độ ổn định trong quá trình sử dụng.
  </p>

  <h3>Âm Thanh Ấn Tượng</h3>

  <p>
    Âm sắc sáng, rõ nét và cân bằng giúp người chơi dễ dàng luyện tập
    từ các bài cơ bản đến nâng cao. Khả năng phản hồi hơi tốt giúp việc
    kiểm soát âm thanh trở nên dễ dàng hơn.
  </p>

  <h3>Phù Hợp Nhiều Đối Tượng</h3>

  <p>
    Sản phẩm phù hợp với học sinh, sinh viên âm nhạc, người mới bắt đầu
    học Saxophone cũng như những người chơi muốn sở hữu một cây kèn có
    chất lượng ổn định với mức giá hợp lý.
  </p>

  <h3>Thông Tin Nổi Bật</h3>

  <ul>
    <li>Thương hiệu: {product.brand}</li>
    <li>Loại kèn: {product.type}</li>
    <li>Xuất xứ: Nhật Bản</li>
    <li>Bảo hành: 24 tháng</li>
    <li>Âm thanh sáng, dễ kiểm soát</li>
    <li>Thiết kế bền bỉ cho luyện tập hằng ngày</li>
  </ul>
</div>

                <div className="yamaha-spec-table">
                  {Object.entries(product.specs ?? {}).map(([key, value]) => (
                    <div className="yamaha-spec-row" key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
            

            {activeTab === "download" && (
              <div className="yamaha-tab-content">
                <h2>Tài liệu sản phẩm</h2>
                <p>
                  Tài liệu hướng dẫn, hình ảnh chi tiết và file thông tin sản
                  phẩm sẽ được cập nhật sau.
                </p>

                <button className="download-btn">
                  Chưa có tài liệu tải xuống
                </button>
              </div>
            )}
            <section className="buy-info-section">
  <h3>Cách Mua Hàng</h3>

  <p>
    Quý khách đặt hàng tại website và điền đầy đủ thông tin: Họ tên,
    số điện thoại, địa chỉ. Shop sẽ liên hệ lại để xác nhận và giao hàng.
  </p>

  <h4>Cách 1: Đặt hàng trực tiếp trên website</h4>
  <ul>
    <li>Chọn sản phẩm yêu thích</li>
    <li>Bấm “Thêm vào giỏ hàng”</li>
    <li>Vào giỏ hàng và nhập thông tin nhận hàng</li>
  </ul>

  <h4>Cách 2: Liên hệ tư vấn</h4>
  <ul>
    <li>Hotline/Zalo: 0912 19 12 18</li>
    <li>Hỗ trợ tư vấn chọn kèn phù hợp cho người mới học</li>
  </ul>

  <details>
    <summary>Lý Do Nên Mua Hàng Tại NhomTTTN Music</summary>
    <p>
      Sản phẩm chính hãng, hình ảnh rõ ràng, tư vấn tận tình, hỗ trợ kiểm tra
      hàng trước khi nhận và bảo hành theo từng sản phẩm.
    </p>
  </details>

  <details>
    <summary>Đánh Giá Của Khách Hàng</summary>
    <p>
      Nhiều khách hàng đánh giá cao chất lượng âm thanh, thiết kế đẹp và dịch vụ
      hỗ trợ nhanh chóng của cửa hàng.
    </p>
  </details>
</section>

            <div className="product-detail-actions">
              <button onClick={handleAddToCart}>Thêm Vào Giỏ Hàng</button>

              <Link href="/products">
                <button className="back-btn">Quay Lại</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="related-section">
        <h2>Sản Phẩm Liên Quan</h2>

        <div className="related-grid">
          {products
            .filter((item) => item.id !== product.id)
.slice(0, 8)
            .map((item) => (
              <Link
                href={`/product/${item.id}`}
                className="related-card"
                key={item.id}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={240}
                  height={240}
                />
                <p className="related-brand">{item.brand}</p>
                <h3>{item.name}</h3>
                <p className="related-price">{item.price}</p>
              </Link>
            ))}
        </div>
      </section>

      {showConfirm && (
        <div className="cart-popup-overlay">
          <div className="cart-popup">
            <div className="cart-popup-icon">🛒</div>

            <h2>Xác nhận thêm giỏ hàng</h2>

            <p>
              Bạn có chắc muốn thêm <strong>{product.name}</strong> vào giỏ
              hàng không?
            </p>

            <div className="cart-popup-actions">
              <button onClick={confirmAddToCart} className="confirm-btn">
                Đồng Ý
              </button>

              <button
                onClick={() => setShowConfirm(false)}
                className="cancel-btn"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="cart-success-toast">
          ✅ Đã thêm {product.name} vào giỏ hàng!
        </div>
      )}
    </main>
  );
}
