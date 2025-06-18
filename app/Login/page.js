"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Utilise le helper pour créer le client Supabase côté client
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Stocke le token dans un cookie pour le backend Express
        document.cookie = `token=${data.session.access_token}; path=/; secure; samesite=strict`;
        window.location.href = '/dashboard';
      } else {
        throw new Error("Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100">
     <div className=" text-center bg-gray-100 mt-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">ASBU</h1>
        <p className="text-xl text-gray-700 mb-1">اتحاد إذاعات الدول العربية</p>
        <p className="text-md text-gray-500">جامعة الدول العربية</p>
      </div>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
       
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Login
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="exemple@mail.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">

              </div>
              <div className="text-sm">
                <Link href="/Login/ResetPassword" className="font-medium text-blue-600 hover:text-blue-500">
                  forgot your password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? "Connexion en cours..." : "Connect"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
