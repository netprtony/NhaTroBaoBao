# Implementation Plan — Phase 3: Hệ thống gói đăng ký (Subscription)

> Xây dựng dựa trên: schema Phase 1 (`organizations.plan` đã có sẵn cột), cơ chế `trial_mode` + mock client local (đã thiết kế ở phase trước) — **tái sử dụng trực tiếp cho gói Free**, và bảng `platform_admins` (Phase 2D) để superadmin quản lý subscription.

---

## 1. Đề xuất 3 gói & căn cứ định giá

### Bài toán chi phí hạ tầng
Supabase Pro = **$25/tháng** (~625.000đ, tỷ giá ~25.000đ/USD) là chi phí **cố định** dùng chung cho toàn bộ khách hàng trả phí (Basic + VIP), không tính riêng theo từng org. Gói Free **không tạo thêm chi phí biến đổi đáng kể** vì dữ liệu lưu hoàn toàn ở thiết bị người dùng (IndexedDB), không chiếm dung lượng DB/bandwidth phía Supabase. Đây là lý do kỹ thuật hợp lý để Free tồn tại lâu dài như một "freemium" thật sự, không phải bản dùng thử giới hạn thời gian.

**Điểm hòa vốn hạ tầng:** cần tối thiểu ~7 khách Basic (ở mức giá đề xuất dưới đây) để bù chi phí Supabase Pro — con số này chưa tính chi phí SMS/email/domain/thời gian vận hành, nên định giá cần biên an toàn cao hơn nhiều so với hòa vốn kỹ thuật thuần túy.

### Bảng gói đề xuất

| Tiêu chí | **Free** | **Basic** | **VIP** |
|---|---|---|---|
| **Giá** | 0đ | **99.000đ/tháng** (990.000đ/năm — tiết kiệm ~17%) | **249.000đ/tháng** (2.490.000đ/năm — tiết kiệm ~17%) |
| **Lưu trữ dữ liệu** | Local (IndexedDB trên thiết bị) | Cloud (Supabase, multi-device) | Cloud (Supabase, multi-device) |
| **Số nhà trọ (properties)** | 1 | 3 | Không giới hạn |
| **Số phòng (rooms)** | Tối đa 5 | Tối đa 30 | Không giới hạn |
| **Tài khoản nhân viên (Staff)** | 0 (chỉ Owner) | 1 | Không giới hạn |
| **Cổng thông tin khách thuê** | ❌ | ✅ | ✅ |
| **Xuất hóa đơn PDF** | ✅ (watermark "BaoBao Stay Free") | ✅ | ✅ (không watermark, tùy chỉnh logo) |
| **Nhắc thanh toán tự động** | ❌ | Email | Email + SMS/Zalo |
| **Đồng bộ đa thiết bị / backup cloud** | ❌ | ✅ | ✅ |
| **Báo cáo thống kê nâng cao** | ❌ | Cơ bản (doanh thu/tháng) | Nâng cao (so sánh năm, xuất Excel) |
| **Hỗ trợ** | Cộng đồng/FAQ | Email, phản hồi trong 48h | Ưu tiên, phản hồi trong 12h |
| **Rủi ro mất dữ liệu** | Cao (mất khi xóa cache/đổi máy) — cảnh báo rõ trong UI | Không (backup tự động) | Không (backup tự động) |

### Ghi chú định giá
- Mức 99.000đ/tháng cho Basic tương đương ~1 ly cà phê/tuần — phù hợp chủ trọ quy mô nhỏ (dưới 30 phòng), dễ ra quyết định mua mà không cần duyệt ngân sách
- VIP nhắm chủ trọ quản lý nhiều dãy/nhiều nhà trọ — 249.000đ vẫn rẻ hơn đáng kể so với thuê 1 nhân viên quản lý bán thời gian
- Đề xuất **7 ngày dùng thử VIP miễn phí** khi tạo tài khoản mới (không cần thẻ tín dụng) để chủ trọ trải nghiệm cổng khách thuê + báo cáo trước khi hạ về Free — chuyển đổi tốt hơn so với bắt đầu ngay ở Free

---

## 2. Thiết kế Database (migration `20260501000000_phase3_subscription.sql`)

```sql
-- Chuẩn hóa giá trị cho cột organizations.plan đã có sẵn
alter table public.organizations
  add constraint organizations_plan_check check (plan in ('free', 'basic', 'vip'));

alter table public.organizations
  add column plan_started_at timestamptz not null default now(),
  add column plan_expires_at timestamptz, -- null với gói free (không hết hạn)
  add column plan_status text not null default 'active'
    check (plan_status in ('active', 'past_due', 'canceled', 'trialing'));

-- Lịch sử thanh toán / gia hạn
create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('basic', 'vip')),
  amount integer not null, -- VND
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  payment_method text not null check (payment_method in ('vnpay', 'momo', 'bank_transfer', 'stripe')),
  payment_gateway_txn_id text,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'refunded')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

-- Giới hạn theo từng gói (để dùng chung ở FE + BE, tránh hard-code rải rác)
create table public.plan_limits (
  plan text primary key check (plan in ('free', 'basic', 'vip')),
  max_properties integer, -- null = không giới hạn
  max_rooms integer,
  max_staff integer,
  tenant_portal_enabled boolean not null default false,
  sms_notification_enabled boolean not null default false
);

insert into public.plan_limits values
  ('free', 1, 5, 0, false, false),
  ('basic', 3, 30, 1, true, false),
  ('vip', null, null, null, true, true);
```

- RLS: `subscription_payments` chỉ owner của org đó và `is_platform_admin()` được SELECT; `plan_limits` cho phép SELECT với mọi authenticated user (dữ liệu công khai, dùng để hiển thị bảng giá)

---

## Phase 3A — Feature gating (chặn vượt hạn mức)

### 3A.1 Nguyên tắc: kiểm tra ở CẢ hai lớp
- **Client-side** (UX): disable nút "Thêm phòng" + hiện banner "Nâng cấp gói" khi chạm giới hạn — cải thiện trải nghiệm, không phải lớp bảo mật
- **Server-side (bắt buộc)**: mọi Server Action tạo mới `properties`/`rooms`/staff đều phải re-check giới hạn trước khi insert — **không tin dữ liệu từ client**, vì lớp UI có thể bị bypass

### 3A.2 Helper dùng chung
```ts
// lib/subscription/check-limit.ts
export async function assertCanCreateRoom(orgId: string) {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("plan").eq("id", orgId).single();
  const { data: limits } = await supabase.from("plan_limits").select("max_rooms").eq("plan", org.plan).single();
  if (limits.max_rooms === null) return; // không giới hạn

  const { count } = await supabase.from("rooms").select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (count >= limits.max_rooms) {
    throw new SubscriptionLimitError(`Gói ${org.plan} chỉ cho phép tối đa ${limits.max_rooms} phòng`);
  }
}
```
- [ ] Gọi `assertCanCreateRoom`/`assertCanCreateProperty`/`assertCanInviteStaff` ở đầu mỗi Server Action tương ứng
- [ ] Component `<PlanLimitBanner />` dùng chung, hiển thị thanh tiến trình "18/30 phòng đã dùng" + CTA nâng cấp khi đạt 80% hạn mức

### 3A.3 Xử lý downgrade (VIP/Basic → Free hoặc hết hạn thanh toán)
Đây là tình huống nhạy cảm nhất: org đang có 50 phòng (VIP) hết hạn thanh toán, rơi về Free (giới hạn 5 phòng) — **không được tự động xóa dữ liệu**.

- [ ] Khi `plan_status` chuyển `past_due` quá 7 ngày → hệ thống **không xóa** property/room thừa, chỉ **khóa chức năng tạo mới** và chuyển toàn bộ dữ liệu sang chế độ **read-only** (không phải mất dữ liệu vì Free vốn không lưu cloud — org này dữ liệu vẫn nằm trên Supabase, chỉ bị khóa ghi)
- [ ] Hiện banner rõ ràng: "Tài khoản đã hết hạn Basic/VIP — dữ liệu vẫn được giữ trên cloud 30 ngày, gia hạn để tiếp tục sử dụng đầy đủ"
- [ ] Sau 30 ngày không gia hạn: cho phép **xuất toàn bộ dữ liệu ra Excel/PDF** (1 lần, miễn phí) trước khi archive — tuyệt đối không cho org thật sự dùng "Free" mà vẫn giữ nguyên dữ liệu vượt hạn mức trên cloud vô thời hạn (vi phạm mô hình chi phí đã tính ở mục 1)

---

## Phase 3B — Gói Free: tái sử dụng kiến trúc `trial_mode` local

Đây là phần **tiết kiệm công sức nhất** vì gần như dùng lại nguyên xi cơ chế mock client + IndexedDB đã thiết kế cho trial trước đó — khác biệt chính: Free là trạng thái **vĩnh viễn của user đã đăng ký thật** (có tài khoản `auth.users` + `profiles`), không phải ẩn danh.

### Khác biệt so với `trial_mode` cũ

| | Trial (khách vãng lai) | Free (đã đăng ký) |
|---|---|---|
| Auth | Giả lập, không có `auth.users` thật | **Thật** — user đăng nhập bằng Supabase Auth (email/password) như bình thường |
| Vai trò cookie/flag | `trial_mode=1` (cookie tạm) | `organizations.plan = 'free'` (đọc từ DB sau khi đăng nhập) |
| Dữ liệu nghiệp vụ (rooms, invoices...) | Mock client → IndexedDB | **Vẫn** mock client → IndexedDB (không đổi) |
| `profiles`, `organizations` (metadata tài khoản) | Không tồn tại | Lưu thật trên Supabase (rất nhẹ, chỉ 1 dòng/org) |

- [ ] `client.ts` mở rộng điều kiện: trả mock client khi `trial_mode=1` **hoặc** khi `org.plan === 'free'` (đọc từ context đã fetch lúc login)
- [ ] Giữ bảng `organizations`/`profiles` thật trên Supabase cho **mọi** gói kể cả Free — chỉ dữ liệu nghiệp vụ (properties/rooms/tenants/invoices...) mới lưu local. Điều này giúp: user Free vẫn đăng nhập được nhiều thiết bị (thấy đúng thông tin tài khoản/gói), nhưng dữ liệu nhà trọ mỗi thiết bị là độc lập — cần banner cảnh báo rõ "Dữ liệu chỉ lưu trên thiết bị này"
- [ ] Nút "Nâng cấp lên Basic" ở Free: khi thanh toán thành công, hiện luồng "Nhập/Import dữ liệu từ máy" cho phép user **tự nguyện** đẩy dữ liệu local hiện có lên cloud (bulk insert 1 lần qua Server Action), tránh mất công nhập lại tay

---

## Phase 3C — Thanh toán (Payment Gateway)

### Lựa chọn gateway cho thị trường VN
- **VNPay** hoặc **Momo**: phù hợp người dùng VN, hỗ trợ QR/thẻ ATM nội địa, nhưng **không hỗ trợ recurring billing tự động** kiểu Stripe — cần tự xây cơ chế nhắc gia hạn
- **Đề xuất:** thanh toán theo chu kỳ thủ công (user bấm "Gia hạn" mỗi tháng/năm) + hệ thống **tự nhắc trước 7 ngày và 1 ngày** khi `plan_expires_at` sắp tới (email, và thông báo trong app) — đơn giản hơn nhiều so với tích hợp recurring token, phù hợp quy mô SaaS nhỏ giai đoạn đầu
- Cân nhắc **SePay/Casso** (dịch vụ webhook đối soát chuyển khoản ngân hàng VN) làm phương án bổ sung rẻ hơn phí gateway ví điện tử, đặc biệt cho gói năm (giá trị giao dịch lớn hơn)

### Luồng thanh toán
- [ ] Trang `/dashboard/billing`: hiện gói hiện tại, ngày hết hạn, nút "Nâng cấp"/"Gia hạn"
- [ ] Chọn gói + chu kỳ (tháng/năm) → tạo bản ghi `subscription_payments` status `pending` → redirect sang VNPay/Momo checkout
- [ ] Webhook `POST /api/webhooks/payment` xác thực chữ ký từ gateway → update `subscription_payments.status = 'success'` + update `organizations.plan`, `plan_expires_at`
- [ ] Cron job (Supabase Edge Function scheduled hoặc Vercel Cron) chạy hàng ngày: quét org có `plan_expires_at < now()` → chuyển `plan_status = 'past_due'`, kích hoạt luồng khóa ghi ở mục 3A.3

---

## Phase 3D — Quản lý subscription phía Superadmin (mở rộng Phase 2D)

- [ ] `/admin/subscriptions`: danh sách tất cả org kèm gói, trạng thái, ngày hết hạn, tổng doanh thu theo tháng
- [ ] `/admin/subscriptions/[orgId]`: lịch sử thanh toán, cho phép superadmin **gia hạn thủ công** (trường hợp chuyển khoản tay, hỗ trợ khách) — ghi vào `admin_audit_logs` (đã có ở Phase 2D)
- [ ] Dashboard doanh thu: MRR (Monthly Recurring Revenue), tỷ lệ churn, phân bổ số lượng org theo từng gói — dùng để theo dõi điểm hòa vốn hạ tầng đã tính ở mục 1

---

## Tổng hợp thứ tự triển khai

| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| 3.0 | Migration DB (organizations, subscription_payments, plan_limits) | Không |
| 3A | Feature gating (client + server, xử lý downgrade) | 3.0 |
| 3B | Gói Free dùng local storage (tái dùng trial_mode) | 3.0, đã có sẵn mock client từ trước |
| 3C | Tích hợp thanh toán VNPay/Momo + cron nhắc/khóa hạn | 3A |
| 3D | Trang superadmin quản lý subscription | 2D, 3.0 |

## Rủi ro cần lưu ý
- **Không có recurring billing thật** với VNPay/Momo → tỷ lệ quên gia hạn cao hơn Stripe, cần đầu tư kỹ luồng nhắc nhở (email + trong app) để giảm churn không chủ đích
- **Downgrade từ cloud về Free** dễ gây tranh cãi hỗ trợ khách hàng nếu chính sách xóa/khóa dữ liệu không rõ ràng — nên có trang Điều khoản dịch vụ nêu rõ thời hạn giữ dữ liệu (đề xuất 30 ngày ở mục 3A.3) trước khi launch
- Giá đề xuất (99k/249k) dựa trên ước lượng thị trường SaaS ngách VN, nên **thử nghiệm giá** (A/B hoặc khảo sát trực tiếp vài chủ trọ tiềm năng) trước khi cam kết cứng, vì đây là quyết định kinh doanh ngoài phạm vi kỹ thuật thuần túy
