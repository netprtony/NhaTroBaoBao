import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/settings-client"
import { Tables } from "@/types/database.types"

export const metadata = {
  title: "Cài đặt - BaoBao Stay",
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Lấy hồ sơ cá nhân
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/dashboard")
  }

  // Lấy thông tin tổ chức bao gồm các cài đặt thanh toán VietQR
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single()

  if (orgError || !orgData) {
    console.error("Lỗi lấy thông tin tổ chức:", orgError)
    redirect("/dashboard")
  }

  return (
    <SettingsClient
      organization={orgData as Tables<"organizations">}
      profile={profile as Tables<"profiles">}
      userEmail={user.email || ""}
    />
  )
}
