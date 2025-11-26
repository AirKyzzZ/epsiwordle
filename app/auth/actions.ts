"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  if (!email.endsWith("@ecoles-epsi.net")) {
    return { error: "Veuillez utiliser votre adresse email EPSI (@ecoles-epsi.net)" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/game");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  
  const supabase = await createClient();

  if (!email.endsWith("@ecoles-epsi.net")) {
    return { error: "Veuillez utiliser votre adresse email EPSI (@ecoles-epsi.net)" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/game");
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  if (!email.endsWith("@ecoles-epsi.net")) {
    return { error: "Veuillez utiliser votre adresse email EPSI (@ecoles-epsi.net)" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Lien de connexion envoyé ! Vérifiez votre boîte mail." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

