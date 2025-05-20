"use client"
import React, { useState, useEffect } from "react";
import { updatePassword } from "@/services/auth";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si nous avons un token de réinitialisation
    const token = searchParams.get('token');
    if (!token) {
      setMessage({
        type: "error",
        text: "Lien de réinitialisation invalide ou expiré",
      });
      setTimeout(() => {
        router.push("/Login");
      }, 3000);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);

    try {
      if (!password || !confirmPassword) {
        throw new Error("Veuillez remplir tous les champs");
      }

      if (password !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }

      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      const token = searchParams.get('token');
      if (!token) {
        throw new Error("Lien de réinitialisation invalide ou expiré");
      }

      await updatePassword(password, token);
      setMessage({
        type: "success",
        text: "Mot de passe mis à jour avec succès",
      });
      
      setTimeout(() => {
        router.push("/Login");
      }, 2000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Réinitialiser le mot de passe
        </h2>
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre nouveau mot de passe"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirmez votre nouveau mot de passe"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
} 