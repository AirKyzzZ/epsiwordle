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

    const file = e.target.files[0];
    
    // Validation côté client : taille maximale 1 Mo
    const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_SIZE) {
      setMessage("L'image est trop volumineuse. Taille maximale : 1 Mo. Veuillez compresser ou réduire la taille de votre image.");
      return;
    }

    setIsUploading(true);
    setMessage(null); // Clear previous messages
    
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const result = await uploadAvatar(formData);
      if (result?.error) {
        setMessage(result.error);
      } else if (result?.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        setMessage("Avatar mis à jour avec succès !");
      }
    } catch (e: any) {
      // Catch any unexpected errors
      if (e?.message?.includes("Body exceeded") || e?.message?.includes("1 MB")) {
        setMessage("L'image est trop volumineuse. Taille maximale : 1 Mo. Veuillez compresser ou réduire la taille de votre image.");
      } else {
        setMessage("Une erreur est survenue lors du téléchargement de l'image. Veuillez réessayer.");
        console.error("Upload failed", e);
      }
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
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-emerald-600 p-1.5 rounded-full text-white shadow-sm hover:bg-emerald-500 cursor-pointer transition-all duration-200 hover:scale-110">
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
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 placeholder:opacity-70 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
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
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 placeholder:opacity-70 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
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
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 placeholder:opacity-70 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
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
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
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
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 placeholder:opacity-70 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>

          <div className="sm:col-span-2 mt-4">
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-3">
              Préférence
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    id="frontend"
                    name="preference"
                    type="radio"
                    value="frontend"
                    defaultChecked={profile.preference === "frontend"}
                    className="peer h-5 w-5 appearance-none rounded-full border border-gray-300 checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-emerald-500 dark:focus:ring-offset-gray-900 transition-all"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="ml-3 block text-sm font-medium leading-6 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Frontend
                </span>
              </label>
              
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    id="backend"
                    name="preference"
                    type="radio"
                    value="backend"
                    defaultChecked={profile.preference === "backend"}
                    className="peer h-5 w-5 appearance-none rounded-full border border-gray-300 checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-emerald-500 dark:focus:ring-offset-gray-900 transition-all"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <span className="ml-3 block text-sm font-medium leading-6 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Backend
                </span>
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={`text-sm text-center p-3 rounded-md font-medium animate-in fade-in slide-in-from-top-2 ${message.includes("succès") ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
