"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  class: z.string().optional(),
  campus: z.string().optional(),
  favorite_subject: z.string().optional(),
  preference: z.enum(["frontend", "backend"]).optional(),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const rawData = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    class: formData.get("class"),
    campus: formData.get("campus"),
    favorite_subject: formData.get("favorite_subject"),
    preference: formData.get("preference"),
  };

  const validatedFields = profileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Données invalides", details: validatedFields.error.flatten() };
  }

  const { error } = await supabase
    .from("profiles")
    .update(validatedFields.data)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: "Profil mis à jour avec succès" };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("avatar") as File;
  if (!file) {
    return { error: "Aucun fichier sélectionné" };
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profile");
  return { success: "Avatar mis à jour", avatarUrl: publicUrl };
}

