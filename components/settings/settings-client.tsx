"use client"

import { useState, useActionState } from "react"
import {
  Building2,
  CreditCard,
  Zap,
  User,
  Crown,
  CheckCircle2,
  Loader2,
  QrCode,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  updatePaymentSettings,
  updateOrganizationSettings,
  updateDefaultRates,
  updateProfileSettings,
} from "@/app/(dashboard)/settings/actions"
import { Tables } from "@/types/database.types"

export const VIETNAM_BANKS = [
  { id: "MB", name: "MBBank - Ngân hàng Quân Đội" },
  { id: "VCB", name: "Vietcombank - Ngoại Thương Việt Nam" },
  { id: "ICB", name: "VietinBank - Công Thương Việt Nam" },
  { id: "BIDV", name: "BIDV - Đầu tư và Phát triển VN" },
  { id: "TCB", name: "Techcombank - Kỹ Thương Việt Nam" },
  { id: "ACB", name: "ACB - Á Châu" },
  { id: "VPB", name: "VPBank - Việt Nam Thịnh Vượng" },
  { id: "TPB", name: "TPBank - Tiên Phong" },
  { id: "STB", name: "Sacombank - Sài Gòn Thương Tín" },
  { id: "HDB", name: "HDBank - Phát triển TP.HCM" },
  { id: "VIB", name: "VIB - Quốc tế" },
  { id: "SHB", name: "SHB - Sài Gòn - Hà Nội" },
  { id: "MSB", name: "MSB - Hàng Hải" },
  { id: "OCB", name: "OCB - Phương Đông" },
  { id: "LPB", name: "LPBank - Lộc Phát Việt Nam" },
  { id: "SEAB", name: "SeABank - Đông Nam Á" },
  { id: "ABB", name: "AnBinhBank - An Bình" },
  { id: "BVB", name: "BVBank - Bản Việt" },
  { id: "VAB", name: "VietABank - Việt Á" },
  { id: "NAB", name: "NamABank - Nam Á" },
  { id: "NCB", name: "NCB - Quốc Dân" },
  { id: "KLB", name: "Kienlongbank - Kiên Long" },
  { id: "CAKE", name: "CAKE by VPBank" },
  { id: "TIMO", name: "Timo by BVBank" },
]

interface SettingsClientProps {
  organization: Tables<"organizations">
  profile: Tables<"profiles">
  userEmail: string
}

export function SettingsClient({ organization, profile, userEmail }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("payment")

  // State cho Form thanh toán & VietQR
  const [bankId, setBankId] = useState(organization.bank_id || "MB")
  const [accountNo, setAccountNo] = useState(organization.bank_account_no || "")
  const [accountName, setAccountName] = useState(organization.bank_account_name || "")
  const [showQr, setShowQr] = useState(organization.show_qr_invoice ?? true)
  const [transferTemplate, setTransferTemplate] = useState(
    organization.transfer_template || "Phong {room_code} {period}"
  )

  // Server Action hooks
  const [payState, payAction, isPayPending] = useActionState(updatePaymentSettings, null)
  const [orgState, orgAction, isOrgPending] = useActionState(updateOrganizationSettings, null)
  const [ratesState, ratesAction, isRatesPending] = useActionState(updateDefaultRates, null)
  const [profState, profAction, isProfPending] = useActionState(updateProfileSettings, null)

  // Live QR Preview URL
  const previewTransferInfo = "Phong 101 09/2026"
  const qrPreviewUrl = accountNo.trim()
    ? `https://img.vietqr.io/image/${bankId}-${accountNo.trim()}-compact2.png?amount=1500000&addInfo=${encodeURIComponent(
        previewTransferInfo
      )}&accountName=${encodeURIComponent(accountName.trim() || "CHU TAI KHOAN")}`
    : null

  const selectedBankObj = VIETNAM_BANKS.find((b) => b.id === bankId)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Tiêu đề & Giới thiệu */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cài đặt hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tùy chỉnh cấu hình thanh toán VietQR trên hóa đơn, thông tin nhà trọ và đơn giá dịch vụ.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-200/70 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="payment" className="gap-2 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 text-blue-600" />
            Thanh toán & VietQR
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2 text-xs sm:text-sm">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Cơ sở & Nhà trọ
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2 text-xs sm:text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            Đơn giá mặc định
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <User className="h-4 w-4 text-slate-600" />
            Tài khoản cá nhân
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2 text-xs sm:text-sm">
            <Crown className="h-4 w-4 text-amber-500" />
            Gói dịch vụ SaaS
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THANH TOÁN & VIETQR */}
        <TabsContent value="payment">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form cấu hình ngân hàng */}
            <Card className="lg:col-span-7 shadow-sm border bg-white">
              <form action={payAction}>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      Tài khoản ngân hàng nhận tiền
                    </span>
                    <Badge variant={showQr ? "default" : "secondary"} className={showQr ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}>
                      {showQr ? "Đang bật VietQR" : "Đã tắt VietQR"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cấu hình tài khoản ngân hàng để in mã QR chuyển khoản trực tiếp lên hóa đơn tiền phòng.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {payState?.success && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{payState.message}</span>
                    </div>
                  )}

                  {payState?.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>{payState.error}</span>
                    </div>
                  )}

                  {/* Tùy chọn bật/tắt in mã QR trên hóa đơn */}
                  <div className="p-3.5 rounded-xl border bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showQrToggle" className="font-semibold text-slate-900 cursor-pointer">
                          In mã VietQR trên hóa đơn
                        </Label>
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                          {showQr
                            ? "Khách thuê có thể quét mã QR chuyển khoản trực tiếp qua App ngân hàng."
                            : "Ẩn khối mã QR trên hóa đơn (phù hợp với chủ trọ chỉ thu tiền mặt)."}
                        </p>
                      </div>
                      <button
                        id="showQrToggle"
                        type="button"
                        role="switch"
                        aria-checked={showQr}
                        onClick={() => setShowQr(!showQr)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
                          showQr ? "bg-blue-600" : "bg-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                            showQr ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                    <input type="hidden" name="showQrInvoice" value={showQr ? "true" : "false"} />
                  </div>

                  {/* Chọn ngân hàng */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bankSelect">
                      Ngân hàng thụ hưởng <span className="text-red-500">*</span>
                    </Label>
                    <Select value={bankId} onValueChange={setBankId}>
                      <SelectTrigger id="bankSelect">
                        <SelectValue placeholder="-- Chọn ngân hàng --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {VIETNAM_BANKS.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="bankId" value={bankId} />
                  </div>

                  {/* Số tài khoản */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bankAccountNo">
                      Số tài khoản ngân hàng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bankAccountNo"
                      name="bankAccountNo"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      required
                    />
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bankAccountName">
                      Tên chủ tài khoản (In hoa không dấu) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bankAccountName"
                      name="bankAccountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      required
                    />
                  </div>

                  {/* Mẫu nội dung chuyển khoản */}
                  <div className="space-y-1.5">
                    <Label htmlFor="transferTemplate">Mẫu nội dung chuyển khoản mặc định</Label>
                    <Input
                      id="transferTemplate"
                      name="transferTemplate"
                      value={transferTemplate}
                      onChange={(e) => setTransferTemplate(e.target.value)}
                      placeholder="Phong {room_code} {period}"
                    />
                    <p className="text-[11px] text-slate-400">
                      Gợi ý thẻ tự động: <code>{"{room_code}"}</code> (Mã phòng), <code>{"{period}"}</code> (Kỳ thu tiền).
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Dữ liệu được lưu vĩnh viễn trên Supabase Cloud</span>
                  <Button
                    type="submit"
                    disabled={isPayPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                  >
                    {isPayPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPayPending ? "Đang lưu..." : "Lưu cài đặt thanh toán"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Live VietQR Preview Card */}
            <Card className="lg:col-span-5 shadow-sm border bg-gradient-to-b from-slate-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  Xem trước mã VietQR hóa đơn
                </CardTitle>
                <CardDescription className="text-xs">
                  Mã QR sẽ hiển thị trên phiếu báo tiền phòng và ảnh gửi Zalo.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                {showQr ? (
                  accountNo.trim() ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
                      <div className="inline-block p-2 bg-white rounded-lg border shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrPreviewUrl || ""}
                          alt="Mã VietQR xem trước"
                          className="w-48 h-48 mx-auto object-contain rounded-md"
                        />
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{accountName || "CHU TAI KHOAN"}</div>
                        <div className="font-mono font-semibold text-blue-700">
                          {accountNo} ({bankId})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedBankObj?.name || "Ngân hàng thụ hưởng"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50 text-[11px] text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Bạn có thể mở app ngân hàng quét thử ngay để xác nhận!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed text-slate-400 space-y-2">
                      <QrCode className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="text-xs">Vui lòng nhập Số tài khoản và Tên chủ tài khoản để xem trước mã QR.</p>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center bg-slate-100 rounded-xl border text-slate-500 space-y-2">
                    <AlertCircle className="h-10 w-10 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Đang tắt tính năng VietQR trên hóa đơn</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Hóa đơn tiền phòng sẽ được xuất dưới dạng phiếu thu truyền thống không in mã thanh toán.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: CƠ SỞ & NHÀ TRỌ */}
        <TabsContent value="organization">
          <Card className="shadow-sm border bg-white max-w-2xl">
            <form action={orgAction}>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Thông tin cơ sở & Nhà trọ
                </CardTitle>
                <CardDescription className="text-xs">
                  Tên thương hiệu, số hotline và lời dặn dò in ở đầu và chân mỗi hóa đơn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {orgState?.success && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{orgState.message}</span>
                  </div>
                )}

                {orgState?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{orgState.error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="orgName">
                    Tên cơ sở kinh doanh / Nhà trọ <span className="text-red-500">*</span>
                  </Label>
                  <Input id="orgName" name="name" defaultValue={organization.name} required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgPhone">Số điện thoại hotline quản lý</Label>
                  <Input
                    id="orgPhone"
                    name="phone"
                    defaultValue={organization.phone || ""}
                    placeholder="Ví dụ: 0912 345 678"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgAddress">Địa chỉ văn phòng / Nhà trọ</Label>
                  <Input
                    id="orgAddress"
                    name="address"
                    defaultValue={organization.address || ""}
                    placeholder="Ví dụ: 123 Đường Nguyễn Trãi, Quận 1, TP.HCM"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invoiceNotes">Lời dặn dò / Ghi chú chân trang hóa đơn</Label>
                  <Textarea
                    id="invoiceNotes"
                    name="invoiceNotes"
                    rows={3}
                    defaultValue={
                      organization.invoice_notes ||
                      "Quý khách vui lòng thanh toán đúng hạn trước ngày 10 hàng tháng. Xin cảm ơn!"
                    }
                    placeholder="Ghi chú in ở cuối hóa đơn gửi khách..."
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isOrgPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isOrgPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isOrgPending ? "Đang lưu..." : "Lưu thông tin cơ sở"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: ĐƠN GIÁ MẶC ĐỊNH */}
        <TabsContent value="rates">
          <Card className="shadow-sm border bg-white max-w-xl">
            <form action={ratesAction}>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Đơn giá dịch vụ mặc định
                </CardTitle>
                <CardDescription className="text-xs">
                  Thiết lập đơn giá điện và nước áp dụng khi tạo phòng mới hoặc tự động điền vào hóa đơn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {ratesState?.success && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{ratesState.message}</span>
                  </div>
                )}

                {ratesState?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{ratesState.error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="defaultElec">Đơn giá điện mặc định (VNĐ / kWh)</Label>
                  <Input
                    id="defaultElec"
                    name="defaultElectricityPrice"
                    type="number"
                    min={0}
                    step={100}
                    defaultValue={organization.default_electricity_price || 3500}
                    required
                  />
                  <p className="text-[11px] text-slate-400">Giá thông thường: 3.000đ - 4.000đ / kWh</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="defaultWater">Đơn giá nước mặc định (VNĐ / m³ hoặc người)</Label>
                  <Input
                    id="defaultWater"
                    name="defaultWaterPrice"
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={organization.default_water_price || 20000}
                    required
                  />
                  <p className="text-[11px] text-slate-400">Giá thông thường: 15.000đ - 25.000đ / m³</p>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isRatesPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isRatesPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isRatesPending ? "Đang lưu..." : "Lưu đơn giá mặc định"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 4: TÀI KHOẢN CÁ NHÂN */}
        <TabsContent value="profile">
          <Card className="shadow-sm border bg-white max-w-xl">
            <form action={profAction}>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-700" />
                  Hồ sơ tài khoản cá nhân
                </CardTitle>
                <CardDescription className="text-xs">
                  Cập nhật họ tên và thông tin liên hệ của chủ tài khoản quản trị.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {profState?.success && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{profState.message}</span>
                  </div>
                )}

                {profState?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{profState.error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email đăng nhập</Label>
                  <Input id="email" value={userEmail} disabled className="bg-slate-100 text-slate-500" />
                  <p className="text-[11px] text-slate-400">Email dùng để đăng nhập và nhận thông báo.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fullName">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <Input id="fullName" name="fullName" defaultValue={profile.full_name || ""} required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profilePhone">Số điện thoại cá nhân</Label>
                  <Input
                    id="profilePhone"
                    name="phone"
                    defaultValue={profile.phone || ""}
                    placeholder="Ví dụ: 0909 123 456"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Vai trò trong tổ chức</Label>
                  <div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase">
                      {profile.role || "owner"}
                    </Badge>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isProfPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProfPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isProfPending ? "Đang lưu..." : "Cập nhật hồ sơ"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 5: GÓI DỊCH VỤ SAAS */}
        <TabsContent value="subscription">
          <Card className="shadow-sm border bg-white max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Gói dịch vụ BaoBao Stay SaaS
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Thông tin gói đăng ký và các tính năng mở rộng của nền tảng quản lý nhà trọ.
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Gói Chuyên Nghiệp (Pro)
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <strong className="text-blue-900 font-bold text-sm block">
                    Đầy đủ quyền năng quản lý nhà trọ không giới hạn
                  </strong>
                  <p className="text-blue-700">
                    Tài khoản của bạn đã được kích hoạt trọn gói toàn bộ các tính năng: Quản lý không giới hạn số cơ sở nhà trọ, lập hóa đơn tự động, thanh toán VietQR động, và quản lý chỉ số điện nước.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quyền lợi của tài khoản
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Quản lý không giới hạn nhà trọ</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Quản lý không giới hạn số phòng</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Xuất hóa đơn PDF & Ảnh Zalo sắc nét</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>VietQR động chuẩn NAPAS 247</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Lưu trữ chỉ số điện nước kế thừa</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Bảo mật Row-Level Security đa tổ chức</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-4 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
              <span>Phiên bản phần mềm: BaoBao Stay v1.2.0</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống hoạt động ổn định
              </span>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
