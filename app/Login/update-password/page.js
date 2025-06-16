'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePassword() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Supabase gère automatiquement le token OTP à l’arrivée sur cette page
  }, []);

  const handleUpdate = async () => {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage('Erreur : ' + error.message);
    } else {
      setMessage('Mot de passe mis à jour avec succès !');
      router.push('/Login'); // ou une autre page
    }
  };

  return (
    <div className="p-4">
      <h1>Définir un nouveau mot de passe</h1>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 my-2 w-full"
      />
      <button onClick={handleUpdate} className="bg-indigo-600 text-white px-4 py-2 rounded">
        Mettre à jour
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
