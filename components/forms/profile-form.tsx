"use client";

import { updateProfile, uploadAvatar } from "@/app/profile/actions";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Camera } from "lucide-react";

interface ProfileFormProps {
  profile: any;
}

const CAMPUSES = [
  "Arras", "Auxerre", "Bordeaux", "Brest", "Caen", "Clermont-Ferrand", "Dijon", 
  "Grenoble", "Lille", "Lyon", "Montpellier", "Nantes", "Paris", "Reims", "Rennes", "Toulouse"
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await updateProfile(formData);
      if (result?.error) setMessage(result.error);
      if (result?.success) setMessage(result.success);
    } catch (e) {
      setMessage("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);

    try {
      const result = await uploadAvatar(formData);
      if (result?.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 relative">
            {avatarUrl ? (
              <Image 
                src={avatarUrl} 
                alt="Avatar" 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl text-gray-400 font-bold">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-emerald-600 p-1.5 rounded-full text-white shadow-sm hover:bg-emerald-500 cursor-pointer">
            <Camera size={16} />
          </label>
          <input 
            id="avatar-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </div>
        <h2 className="mt-4 text-xl font-semibold">{profile.first_name} {profile.last_name}</h2>
        <p className="text-gray-500 text-sm">{profile.email}</p>
      </div>

      <form action={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Prénom
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="first_name"
                id="first_name"
                defaultValue={profile.first_name}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Nom
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="last_name"
                id="last_name"
                defaultValue={profile.last_name}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="class" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Classe
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="class"
                id="class"
                defaultValue={profile.class}
                placeholder="Ex: B3 Dév"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="campus" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Campus
            </label>
            <div className="mt-2">
              <select
                id="campus"
                name="campus"
                defaultValue={profile.campus || ""}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              >
                <option value="">Sélectionner un campus</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="favorite_subject" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Matière préférée
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="favorite_subject"
                id="favorite_subject"
                defaultValue={profile.favorite_subject}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
              Préférence
            </label>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="frontend"
                  name="preference"
                  type="radio"
                  value="frontend"
                  defaultChecked={profile.preference === "frontend"}
                  className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="frontend" className="ml-3 block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                  Frontend
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="backend"
                  name="preference"
                  type="radio"
                  value="backend"
                  defaultChecked={profile.preference === "backend"}
                  className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="backend" className="ml-3 block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                  Backend
                </label>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`text-sm text-center p-2 rounded ${message.includes("succès") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

