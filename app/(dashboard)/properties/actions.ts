"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionState = { error?: string; success?: boolean } | null

export async function createProperty(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase.from("profiles").select("org_id").single()
    
    if (profileError || !profile?.org_id) {
      return { error: "Không tìm thấy thông tin tổ chức" }
    }

    const name = formData.get("name") as string
    const address = formData.get("address") as string
    const description = formData.get("description") as string

    if (!name || !address) {
      return { error: "Tên và địa chỉ không được để trống" }
    }

    const { error } = await supabase.from("properties").insert({
      org_id: profile.org_id,
      name,
      address,
      description
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/properties")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}

export async function updateProperty(prevState: ActionState, formData: FormData) {
  try {
    const supabase = await createClient()
    
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const address = formData.get("address") as string
    const description = formData.get("description") as string

    if (!id || !name || !address) {
      return { error: "Thiếu thông tin bắt buộc" }
    }

    const { error } = await supabase.from("properties").update({
      name,
      address,
      description
    }).eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/properties")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}

export async function deleteProperty(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/properties")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
    return { error: message }
  }
}
