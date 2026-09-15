import Link from "next/link";
import { 
  Building2, 
  Home, 
  Users, 
  Receipt, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">BaoBao Stay</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                SaaS Quản Lý Nhà Trọ
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors shadow-blue-500/25"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
                <ShieldCheck className="h-4 w-4" />
                <span>Nền tảng quản lý phòng trọ thế hệ mới</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-tight">
                Quản lý nhà trọ <span className="text-blue-600">thông minh</span>, không lo thất thoát
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Tự động hóa toàn bộ quy trình: từ tính tiền điện nước, xuất hóa đơn, nhắc phí đến theo dõi hợp đồng và khách thuê. Tiết kiệm 90% thời gian mỗi tháng.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
                >
                  Trải nghiệm ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
                >
                  Đăng nhập tài khoản
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Miễn phí khởi tạo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Dữ liệu bảo mật đa tầng RLS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Hỗ trợ 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Tính năng vượt trội cho chủ nhà trọ
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Thiết kế trực quan, dễ dùng trên mọi thiết bị máy tính, máy tính bảng và điện thoại.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                  <Home className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Quản lý nhà & phòng trực quan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Theo dõi trạng thái phòng trống, đang thuê hay bảo trì với giao diện dạng thẻ màu sắc rõ ràng.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Chỉ số điện nước thông minh</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nhập số đầu kỳ - cuối kỳ cực nhanh, hệ thống tự động tính lũy tiến và tổng tiền chính xác.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Tạo hóa đơn tự động & xuất PDF</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tổng hợp tiền phòng, điện nước và dịch vụ thành hóa đơn chuẩn chỉnh, xuất file PDF gửi khách ngay lập tức.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Hồ sơ khách thuê & hợp đồng</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Lưu trữ thông tin CCCD, tiền cọc, ngày bắt đầu và kết thúc hợp đồng. Nhắc nhở khi sắp hết hạn thuê.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Quản lý nhiều tòa nhà (Multi-property)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Dễ dàng mở rộng từ 1 dãy trọ nhỏ đến hàng chục tòa nhà căn hộ mini ở các quận huyện khác nhau.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Bảo mật dữ liệu đám mây</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Dữ liệu được lưu trữ an toàn trên nền tảng Supabase Postgres với phân quyền Row-Level Security tiêu chuẩn doanh nghiệp.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BaoBao Stay. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <span>Bảo mật</span>
            <span>Điều khoản dịch vụ</span>
            <span>Hỗ trợ kỹ thuật</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
