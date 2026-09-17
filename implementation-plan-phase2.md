# Implementation Plan — Phase 2: BaoBao Stay

> Dựa trên schema thực tế `20260315000000_phase1_schema.sql` (organizations, profiles, properties, rooms, tenants, leases, utility_readings, invoices, invoice_items — đã có RLS theo `org_id` qua `get_auth_org_id()`).

Phase 2 gồm 5 nhóm việc lớn, được chia thành **5 phase con** để triển khai tuần tự, vì cổng khách thuê và trang superadmin đều phụ thuộc vào việc sửa ràng buộc dữ liệu trước.

**Thứ tự khuyến nghị:** 2A (Ràng buộc dữ liệu) → 2B (Cổng khách thuê) → 2C (Owner xem chỉ số) → 2D (Superadmin) → 2E (Hiệu năng/UX)
Lý do: 2A phải làm trước vì cổng khách thuê (2B) và superadmin (2D) đều truy vấn dữ liệu liên bảng — nếu chưa chốt quy tắc xóa/update thì dễ phải sửa lại RLS và server actions nhiều lần.

---

## Phase 2A — Kiểm tra & củng cố ràng buộc dữ liệu (Referential Integrity Audit)

### 2A.1 Audit hành vi FK hiện tại

| Bảng con | Bảng cha | Hành vi hiện tại | Vấn đề |
|---|---|---|---|
| `rooms.property_id` → `properties.id` | properties | `on delete cascade` | Xóa 1 property sẽ **tự động xóa hết phòng** bên trong — rủi ro cao, không có cảnh báo |
| `leases.room_id` → `rooms.id` | rooms | `on delete restrict` | Đúng hướng, nhưng lỗi Postgres trả về khi xóa phòng sẽ là mã lỗi khó hiểu cho người dùng cuối |
| `leases.tenant_id` → `tenants.id` | tenants | `on delete restrict` | Chặn xóa tenant nếu **còn bất kỳ hợp đồng nào**, kể cả hợp đồng đã `expired`/`terminated` — có thể quá chặt |
| `utility_readings.room_id` → `rooms.id` | rooms | `on delete cascade` | Xóa phòng sẽ **xóa luôn lịch sử chỉ số điện nước** — mất dữ liệu lịch sử, không cảnh báo |
| `invoices.lease_id` → `leases.id` | leases | `on delete restrict` | Đúng hướng, chặn xóa hợp đồng nếu còn hóa đơn |
| `invoice_items.invoice_id` → `invoices.id` | invoices | `on delete cascade` | Hợp lý (chi tiết hóa đơn phụ thuộc hoàn toàn vào hóa đơn) |

**Xung đột dây chuyền cần lưu ý:** Xóa `properties` → cascade xóa `rooms` → nhưng `rooms` bị `leases` restrict → nếu phòng có hợp đồng, **toàn bộ lệnh xóa property sẽ fail** (Postgres rollback cả cascade), nhưng thông báo lỗi sẽ chỉ ra bảng `leases` chứ không nói rõ "vì phòng X có hợp đồng Y" — cần xử lý ở application layer để hiện thông báo rõ ràng.

### 2A.2 Quy tắc nghiệp vụ đề xuất (cần Product Owner xác nhận)

1. **Xóa Room:**
   - Chặn nếu có `lease` với `status = 'active'` → thông báo "Phòng đang có người thuê"
   - Nếu chỉ có lease `expired`/`terminated` (lịch sử) → cho phép xóa nhưng **cảnh báo sẽ xóa kèm lịch sử chỉ số điện nước** (do cascade), yêu cầu xác nhận 2 bước
   - Đề xuất đổi `utility_readings.room_id` từ `cascade` → giữ `cascade` nhưng thêm soft-delete cho `rooms` (cột `deleted_at`) thay vì xóa cứng, để giữ lịch sử báo cáo doanh thu
2. **Xóa Tenant:**
   - Chặn nếu có **bất kỳ** lease nào (kể cả đã kết thúc) — vì lịch sử hóa đơn/hợp đồng cần giữ để tra cứu, kể cả khi tenant đã chuyển đi
   - Đề xuất: không cho xóa cứng tenant có lease, chỉ cho phép "Vô hiệu hóa" (soft-delete) nếu cần ẩn khỏi danh sách
3. **Xóa Property:**
   - Chặn nếu còn **bất kỳ** room nào (kể cả `available`) → owner phải xóa hết room trước, hoặc dùng "Xóa toàn bộ" có xác nhận rõ ràng liệt kê số phòng/hợp đồng/hóa đơn sẽ bị ảnh hưởng
   - Đổi `rooms.property_id` từ `on delete cascade` → `on delete restrict` để tránh xóa nhầm hàng loạt
4. **Update Lease (đổi phòng, đổi ngày):**
   - Khi `status` chuyển từ `active` → `terminated`, cần validate: không cho set `end_date` < ngày của hóa đơn `paid` gần nhất
   - Khi đổi `room_id` của 1 lease đang active: chặn nếu phòng mới đang có lease active khác (tránh 2 hợp đồng active cùng 1 phòng)
5. **Update Room status:**
   - Không cho set `status = 'available'` bằng tay nếu còn lease `active` gắn với phòng đó — nên tự động đồng bộ `status` qua trigger khi lease được tạo/kết thúc, thay vì để owner tự sửa tay (tránh sai lệch dữ liệu)

### 2A.3 Việc cần làm (migration `20260401000000_phase2_constraints.sql`)

- [ ] Đổi `rooms.property_id` FK: `on delete cascade` → `on delete restrict`
- [ ] Thêm cột `deleted_at timestamptz` (soft-delete) cho `properties`, `rooms`, `tenants`
- [ ] Cập nhật tất cả RLS SELECT policies để thêm điều kiện `deleted_at is null` (trừ khi cần xem lịch sử)
- [ ] Viết trigger `sync_room_status()`: tự động set `rooms.status = 'occupied'` khi tạo lease active, `= 'available'` khi lease kết thúc (chỉ khi không có lease active khác)
- [ ] Viết Postgres function `can_delete_room(room_id)`, `can_delete_tenant(tenant_id)`, `can_delete_property(property_id)` trả về `{allowed: bool, reason: text, blocking_count: jsonb}` để frontend gọi trước khi xóa và hiện modal xác nhận chi tiết
- [ ] Thêm constraint `check` cho `leases`: `end_date is null or end_date > start_date`
- [ ] Thêm unique partial index: `create unique index one_active_lease_per_room on leases(room_id) where status = 'active'` — đảm bảo DB tự chặn 2 hợp đồng active cùng phòng, không phụ thuộc hoàn toàn vào logic app

### 2A.4 Frontend

- [ ] Trước mọi hành động xóa (Room/Tenant/Property), gọi function `can_delete_*` → nếu `allowed = false`, hiện modal giải thích lý do + liên kết đến bản ghi đang chặn (VD: "Không thể xóa vì hợp đồng #123 đang active")
- [ ] Với xóa Property có rooms: hiện danh sách tổng hợp (số phòng, số hợp đồng, số hóa đơn) trước khi cho xác nhận

---

## Phase 2B — Cổng thông tin khách thuê (Tenant Portal)

### 2B.1 Vấn đề cần giải quyết trước
`tenants` hiện **không liên kết với `auth.users`** — cần thiết kế cơ chế đăng nhập riêng cho khách thuê, tách biệt khỏi tài khoản chủ trọ (owner/staff dùng `profiles`).

### 2B.2 Thiết kế Database

```sql
-- Thêm liên kết auth cho tenant (1 tenant = 1 tài khoản đăng nhập cổng)
alter table public.tenants
  add column auth_user_id uuid references auth.users(id) on delete set null,
  add column portal_enabled boolean not null default false;

create unique index idx_tenants_auth_user_id on public.tenants(auth_user_id) where auth_user_id is not null;
```

- Đăng nhập bằng **SĐT hoặc email**: Supabase Auth cho phép định danh theo email hoặc phone (SMS OTP cần nhà cung cấp SMS — chi phí + cần cấu hình). Đề xuất 2 lựa chọn:
  - **Phương án A (khuyến nghị, không tốn phí SMS):** Owner "mời" tenant qua email → tenant đặt mật khẩu → đăng nhập bằng **email + password**. Nếu tenant không có email, dùng **SĐT dạng giả email** nội bộ (`0901234567@tenant.baobaostay.app`) làm định danh Supabase Auth, nhưng UI vẫn cho tenant gõ SĐT để login (BE tự map SĐT → email giả trước khi gọi `signInWithPassword`)
  - **Phương án B:** Bật Supabase Phone Auth thật (SMS OTP qua Twilio/MSG91) — tốn phí mỗi lần gửi OTP, cần đăng ký nhà cung cấp SMS tại VN
- **Function `get_auth_tenant_id()`** (tương tự `get_auth_org_id()`):
```sql
create or replace function public.get_auth_tenant_id()
returns uuid language sql stable security invoker set search_path = public as $$
  select id from public.tenants where auth_user_id = (select auth.uid());
$$;
```

### 2B.3 RLS Policies mới (chỉ SELECT, tenant không được sửa dữ liệu nghiệp vụ)

- [ ] `leases`: policy SELECT thêm điều kiện `tenant_id = (select get_auth_tenant_id())`
- [ ] `invoices`: SELECT qua join `leases.tenant_id = get_auth_tenant_id()`
- [ ] `invoice_items`: SELECT qua join `invoices → leases.tenant_id`
- [ ] `utility_readings`: SELECT qua điều kiện `room_id in (select room_id from leases where tenant_id = get_auth_tenant_id())` — **chỉ những kỳ đọc số từ lúc lease bắt đầu** (`utility_readings.period >= to_char(lease.start_date, 'YYYY-MM')`)
- [ ] `tenants`: policy SELECT/UPDATE riêng cho chính mình (`id = get_auth_tenant_id()`), UPDATE chỉ cho phép sửa `full_name`, không cho tự sửa `phone`/`id_card_number` (owner quản lý)

### 2B.4 Tính năng cổng khách thuê

- [ ] Trang đăng nhập riêng `/portal/login` (SĐT hoặc email + password)
- [ ] Trang `/portal/dashboard`: thông tin phòng đang thuê, hợp đồng hiện tại
- [ ] Trang `/portal/invoices`: lịch sử hóa đơn (tất cả các kỳ từ lúc lập hợp đồng), trạng thái thanh toán, xem chi tiết từng hóa đơn
- [ ] Trang `/portal/contract`: xem thông tin + file hợp đồng (PDF) đã upload
- [ ] Trang `/portal/meter-readings`: lịch sử chỉ số điện nước theo từng kỳ, kèm biểu đồ tiêu thụ theo tháng
- [ ] Trang `/portal/settings`: đổi mật khẩu (`supabase.auth.updateUser({ password })`), cập nhật tên hiển thị
- [ ] Owner side: trang "Mời khách thuê" trong chi tiết Tenant → gửi email/tạo link mời kích hoạt `portal_enabled = true`

### 2B.5 Server Actions cần viết
- [ ] `inviteTenantToPortal(tenantId)` — server action, dùng service role, tạo `auth.users` + gán `auth_user_id`
- [ ] `tenantChangePassword(newPassword)`
- [ ] `tenantUpdateProfile({ full_name })`

---

## Phase 2C — Owner xem chỉ số điện nước theo phòng của mình

> Về mặt RLS, owner **đã có quyền SELECT `utility_readings`** trong org của mình (policy sẵn có). Phần việc chính ở đây là UI/UX chứ không phải bảo mật dữ liệu.

- [ ] Trang `/dashboard/rooms/[roomId]/readings`: bảng lịch sử chỉ số điện/nước của riêng phòng đó, sort theo `period` giảm dần
- [ ] Biểu đồ tiêu thụ điện/nước theo tháng (dùng `recharts`) để owner phát hiện bất thường (VD: dùng điện tăng đột biến)
- [ ] Form nhập nhanh chỉ số mới ngay tại trang chi tiết phòng, tự động lấy `electricity_old`/`water_old` = giá trị `new` của kỳ liền trước (tránh nhập sai số đầu kỳ)
- [ ] Validation: `electricity_new >= electricity_old` và `water_new >= water_old` (trừ trường hợp đổi công tơ — cần checkbox "Đã thay công tơ" để cho phép số mới nhỏ hơn số cũ)
- [ ] Bộ lọc theo `property_id` để xem toàn bộ chỉ số các phòng trong 1 nhà trọ cùng lúc (dạng bảng tổng hợp, hữu ích khi ghi số cuối tháng)

---

## Phase 2D — Trang quản lý Superadmin

### 2D.1 Thiết kế phân quyền

Superadmin là **admin của nền tảng SaaS**, không thuộc `org_id` nào — cần tách hẳn khỏi mô hình multi-tenant hiện tại.

```sql
-- Bảng riêng cho platform admin, KHÔNG dùng chung profiles.role
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
-- Không tạo policy SELECT cho authenticated → chỉ truy cập qua service role ở server

create or replace function public.is_platform_admin()
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (select 1 from public.platform_admins where id = (select auth.uid()));
$$;
```

- [ ] Thêm policy SELECT bổ sung (`using (org_id = get_auth_org_id() or is_platform_admin())`) cho các bảng `properties`, `rooms`, `tenants`, `leases`, `invoices`, `utility_readings` để superadmin đọc được dữ liệu mọi org
- [ ] **Không** cấp quyền INSERT/UPDATE/DELETE cho superadmin qua RLS trực tiếp — mọi thao tác ghi của superadmin (nếu cần, VD: khóa tài khoản vi phạm) đi qua Server Actions dùng **service role key** (bypass RLS có kiểm soát), kèm ghi log audit

### 2D.2 Audit log (khuyến nghị đi kèm)
```sql
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.platform_admins(id),
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```
- [ ] Ghi log mỗi lần superadmin xem/sửa dữ liệu nhạy cảm (tối thiểu: xem chi tiết 1 org, khóa/mở tài khoản)

### 2D.3 Tính năng trang superadmin (`/admin/*`, route group riêng, middleware kiểm tra `is_platform_admin()`)

- [ ] `/admin/organizations`: danh sách tất cả chủ trọ (org), số lượng property/room/tenant, ngày tạo, trạng thái hoạt động
- [ ] `/admin/organizations/[orgId]`: chi tiết 1 org — danh sách property, room, tenant, lease, invoice (read-only)
- [ ] `/admin/organizations/[orgId]/invoices`: theo dõi doanh thu, tỷ lệ hóa đơn quá hạn của org đó
- [ ] `/admin/stats`: thống kê toàn hệ thống (tổng số org, tổng doanh thu ước tính qua các gói, org mới trong tháng)
- [ ] Chức năng khóa/mở khóa 1 org (thêm cột `organizations.is_suspended boolean`) — khi suspended, chặn login của mọi user thuộc org đó (kiểm tra ở middleware hoặc RLS)
- [ ] Không cho superadmin sửa/xóa dữ liệu nghiệp vụ (invoice, lease...) trực tiếp — chỉ xem, tránh rủi ro pháp lý/tranh chấp dữ liệu giữa các chủ trọ

---

## Phase 2E — Tối ưu hiệu năng & hiệu ứng UX

### 2E.1 Lazy loading & code splitting
- [ ] Sidebar: tách từng nhóm menu (Properties/Rooms/Tenants/Invoices/Settings) thành dynamic import (`next/dynamic`) với `loading: () => <SidebarSkeleton />`
- [ ] Route-level code splitting tự động của Next.js App Router — đảm bảo không import toàn bộ icon set/chart library ở layout gốc, chỉ import ở component thực sự dùng
- [ ] Dùng `React.Suspense` + skeleton loading (dạng shimmer) cho từng khối dữ liệu (bảng invoices, danh sách rooms) thay vì spinner toàn trang — tạo cảm giác trang phản hồi ngay dù dữ liệu đang tải

### 2E.2 Chiến lược tải dữ liệu
- [ ] Dùng Server Components + streaming (`loading.tsx` theo route) cho các trang danh sách nặng
- [ ] Cache dữ liệu ít đổi (VD: `properties`, danh sách `rooms`) bằng Next.js `revalidateTag`/`unstable_cache`, invalidate khi có thay đổi qua Server Action
- [ ] Client-side: dùng `@tanstack/react-query` hoặc SWR cho các trang cần realtime-ish (invoices, dashboard) để tránh refetch toàn bộ khi chuyển tab

### 2E.3 Hiệu ứng modal blur (đồng bộ toàn app)
- [ ] Tạo 1 component `<Modal>` dùng chung (Radix Dialog hoặc shadcn `Dialog`) với overlay `backdrop-blur-sm bg-black/30`, transition `duration-200 ease-out`
- [ ] Áp dụng lại tất cả các modal hiện có (form thêm/sửa Property, Room, Tenant, Lease, Invoice, xác nhận xóa) qua component chung này — tránh mỗi trang tự viết modal riêng
- [ ] Thêm animation scale-in nhẹ (`data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`) cho nội dung modal

### 2E.4 Tối ưu tải trang chung
- [ ] Audit bundle size bằng `@next/bundle-analyzer`, loại bỏ thư viện nặng không cần thiết ở client
- [ ] Tối ưu ảnh (property photos, avatar) qua `next/image` + Supabase Storage transform (resize on the fly)
- [ ] Bật `Partial Prerendering` (nếu dùng Next.js 15) hoặc ISR cho các trang ít đổi (VD: trang giới thiệu, pricing)
- [ ] Đo lường bằng Lighthouse/Web Vitals trước và sau tối ưu để so sánh (LCP, INP, CLS)

---

## Tổng hợp thứ tự triển khai

| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| 2A | Ràng buộc dữ liệu, soft-delete, trigger đồng bộ status | Không |
| 2B | Cổng khách thuê (auth riêng, RLS mới, các trang portal) | Cần 2A xong (để RLS/soft-delete ổn định trước khi thêm role mới) |
| 2C | Owner xem chỉ số điện nước theo phòng | Độc lập, có thể làm song song 2B |
| 2D | Trang Superadmin | Cần 2A xong (đọc dữ liệu chuẩn), nên làm sau 2B để tái sử dụng UI component |
| 2E | Hiệu năng & UX (lazy load, blur modal) | Làm sau cùng, áp dụng lên toàn bộ UI đã có ở Phase 1 + 2A–2D |

## Rủi ro cần lưu ý thêm
- Đổi FK `rooms.property_id` từ cascade → restrict là **breaking change** nếu đã có dữ liệu thật — cần kiểm tra dữ liệu hiện có trước khi chạy migration ở production
- Cơ chế login SĐT cho tenant portal (dùng email giả) cần tài liệu rõ ràng nội bộ, tránh nhầm lẫn khi debug sau này
- RLS cho superadmin đọc chéo org cần test kỹ — 1 policy viết sai có thể lộ dữ liệu giữa các chủ trọ với nhau, nên viết test tự động (pgTAP hoặc test script) cho toàn bộ policies liên quan đến `is_platform_admin()`
