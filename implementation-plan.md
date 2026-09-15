# Implementation Plan: SaaS Quản Lý Nhà Trọ

## 1. Tổng Quan Dự Án

**Tên sản phẩm:** (đặt tên sau) — SaaS quản lý nhà trọ/phòng trọ cho chủ nhà trọ
**Tech stack:**
- **Frontend:** Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime, Row Level Security)
- **Hosting:** CouldFlare Pages (frontend) + Supabase Cloud (backend)
- **Thanh toán (nếu SaaS trả phí):** Stripe hoặc VNPay/Momo (phát triển sau)
- **Email:** Resend hoặc Supabase Auth email mặc định

### Đối tượng người dùng
- Chủ nhà trọ / quản lý nhà trọ (Owner/Admin)
- Nhân viên quản lý (Staff) — vai trò phụ, tùy chọn
- (Tùy chọn mở rộng) Người thuê trọ tự xem hóa đơn qua cổng riêng

---

## 2. Phân Tích Nghiệp Vụ (Core Features)

### Module bắt buộc (MVP)
1. **Xác thực & phân quyền người dùng**
   - Đăng ký/đăng nhập (email + password, Google OAuth)
   - Quên mật khẩu, xác thực email
   - Phân quyền: Owner, Staff (RLS theo `tenant_id`)
2. **Quản lý nhà trọ (Properties)**
   - CRUD nhà trọ (tên, địa chỉ, số tầng, mô tả)
   - Upload ảnh nhà trọ
3. **Quản lý phòng (Rooms)**
   - CRUD phòng: mã phòng, diện tích, giá thuê, trạng thái (trống/đang thuê/bảo trì)
   - Gắn phòng vào nhà trọ cụ thể
4. **Quản lý khách thuê (Tenants)**
   - Thông tin khách thuê: tên, SĐT, CCCD, ngày vào ở
   - Hợp đồng thuê (ngày bắt đầu/kết thúc, tiền cọc, giá thuê)
   - Lưu file hợp đồng (Supabase Storage)
5. **Quản lý hóa đơn & thu tiền (Invoices)**
   - Tạo hóa đơn hàng tháng (tiền phòng + điện + nước + dịch vụ khác)
   - Nhập chỉ số điện/nước (đầu kỳ - cuối kỳ, tự tính tiền)
   - Đánh dấu đã thanh toán / chưa thanh toán
   - Xuất hóa đơn PDF
6. **Dashboard tổng quan**
   - Tổng doanh thu theo tháng
   - Tỷ lệ lấp đầy phòng
   - Danh sách hóa đơn quá hạn
7. **Cài đặt tài khoản / nhà trọ**
   - Giá điện/nước mặc định
   - Thông tin thanh toán (ngân hàng, QR code)

### Module mở rộng (Phase 2+)
- Cổng cho khách thuê xem hóa đơn & thanh toán online
- Gửi thông báo nhắc thanh toán qua Zalo/SMS/Email tự động
- Quản lý bảo trì, sửa chữa
- Multi-tenant SaaS (gói subscription: Free/Pro), tích hợp Stripe/VNPay
- Báo cáo, thống kê nâng cao (biểu đồ doanh thu, so sánh theo năm)
- Ứng dụng mobile (React Native / PWA)

---

## 3. Thiết Kế Cơ Sở Dữ Liệu (Supabase/Postgres)

### Bảng chính (dự kiến)

```
organizations (nếu multi-tenant SaaS)
  id, name, owner_id, plan, created_at

users_profile (mở rộng từ auth.users)
  id (FK -> auth.users), org_id, full_name, phone, role, created_at

properties
  id, org_id, name, address, description, created_at

rooms
  id, property_id, room_code, area, base_price, status, created_at

tenants (khách thuê)
  id, org_id, full_name, phone, id_card_number, created_at

leases (hợp đồng thuê)
  id, room_id, tenant_id, start_date, end_date, deposit,
  monthly_rent, contract_file_url, status, created_at

utility_readings (chỉ số điện nước)
  id, room_id, period, electricity_old, electricity_new,
  water_old, water_new, created_at

invoices
  id, lease_id, period, rent_amount, electricity_amount,
  water_amount, other_fees, total_amount, status,
  due_date, paid_at, created_at

invoice_items (chi tiết hóa đơn - tùy chọn)
  id, invoice_id, label, amount
```

### Row Level Security (RLS)
- Mọi bảng đều có `org_id`, RLS policy giới hạn user chỉ thấy dữ liệu của `org_id` mình thuộc về
- Policy mẫu: `org_id = (SELECT org_id FROM users_profile WHERE id = auth.uid())`

---

## 4. Kiến Trúc Hệ Thống

```
Next.js App Router
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── rooms/
│   │   ├── tenants/
│   │   ├── invoices/
│   │   └── settings/
│   ├── api/ (route handlers nếu cần server actions/webhooks)
│   └── layout.tsx
├── lib/
│   ├── supabase/ (client, server, middleware helpers)
│   └── utils/
├── components/
│   ├── ui/ (shadcn)
│   └── features/ (theo module)
└── middleware.ts (bảo vệ route, refresh session)
```

- Dùng **Supabase Auth Helpers cho Next.js** (`@supabase/ssr`) để quản lý session giữa client/server
- Server Components để fetch dữ liệu (đọc), Server Actions hoặc Route Handlers để ghi dữ liệu
- Middleware kiểm tra session, redirect nếu chưa đăng nhập

---

## 5. Xác Thực Người Dùng (Chi Tiết)

1. Cài `@supabase/supabase-js` và `@supabase/ssr`
2. Tạo Supabase client cho 3 ngữ cảnh: browser, server component, middleware
3. Luồng đăng ký:
   - User đăng ký → Supabase Auth tạo user → Trigger Postgres function tạo dòng trong `users_profile` + `organizations` (nếu là owner đầu tiên)
4. Luồng đăng nhập: email/password + OAuth Google
5. Middleware `middleware.ts`: refresh session token, chặn truy cập `/dashboard/*` nếu chưa đăng nhập
6. Bảo vệ route bằng cách kiểm tra `role` (Owner/Staff) ở layout của từng nhóm route

---

## 6. Lộ Trình Triển Khai (Roadmap)

### Giai đoạn 1 — Setup nền tảng (Tuần 1)
- [ ] Khởi tạo Next.js project + TailwindCSS + shadcn/ui
- [ ] Tạo project Supabase, thiết kế schema DB, viết migration
- [ ] Cấu hình Supabase Auth (email/password, Google OAuth)
- [ ] Setup RLS policies cơ bản
- [ ] Deploy khung project lên CloudFlare Pages

### Giai đoạn 2 — Xác thực & quản lý cốt lõi (Tuần 2-3)
- [ ] Trang đăng ký/đăng nhập/quên mật khẩu
- [ ] Onboarding: tạo tổ chức + nhà trọ đầu tiên
- [ ] CRUD Properties
- [ ] CRUD Rooms

### Giai đoạn 3 — Khách thuê & hợp đồng (Tuần 4)
- [ ] CRUD Tenants
- [ ] Quản lý hợp đồng thuê (leases), upload file hợp đồng

### Giai đoạn 4 — Hóa đơn & thanh toán (Tuần 5-6)
- [ ] Nhập chỉ số điện/nước
- [ ] Tạo hóa đơn tự động hàng tháng
- [ ] Xuất PDF hóa đơn
- [ ] Đánh dấu thanh toán, lịch sử thanh toán

### Giai đoạn 5 — Dashboard & hoàn thiện (Tuần 7)
- [ ] Dashboard thống kê doanh thu, tỷ lệ lấp đầy
- [ ] Cài đặt tài khoản/nhà trọ
- [ ] Kiểm thử toàn bộ luồng, sửa lỗi

### Giai đoạn 6 — SaaS hóa & mở rộng (Tuần 8+)
- [ ] Tích hợp thanh toán subscription (Stripe/VNPay)
- [ ] Multi-tenant hoàn chỉnh, giới hạn theo gói (số phòng, số nhà trọ)
- [ ] Thông báo tự động (email/Zalo/SMS)
- [ ] Cổng khách thuê xem hóa đơn

---

## 7. Rủi Ro & Lưu Ý
- **RLS phức tạp:** Cần test kỹ multi-tenant để tránh rò rỉ dữ liệu giữa các chủ nhà trọ khác nhau
- **Tính tiền điện/nước:** Cần xử lý cẩn thận trường hợp đổi công tơ, số âm, làm tròn
- **File hợp đồng/hóa đơn:** Giới hạn dung lượng Supabase Storage free tier, cân nhắc nén ảnh
- **Thanh toán VN:** Nếu nhắm thị trường Việt Nam, ưu tiên tích hợp VNPay/Momo/chuyển khoản QR thay vì chỉ Stripe

---

## 8. Bước Tiếp Theo Đề Xuất
1. Xác nhận lại phạm vi MVP (bao nhiêu module ở trên là bắt buộc ngay từ đầu)
2. Thiết kế wireframe/UI cơ bản cho các trang chính
3. Viết SQL migration chi tiết + RLS policies
4. Khởi tạo repo và bắt đầu Giai đoạn 1
