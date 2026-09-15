import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BaoBao Stay - Phần Mềm Quản Lý Nhà Trọ Thông Minh",
  description: "Giải pháp SaaS quản lý nhà trọ, căn hộ dịch vụ, phòng trọ, hóa đơn điện nước và khách thuê chuyên nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
