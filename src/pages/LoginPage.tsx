import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(mode: 'signin' | 'signup') {
    setError(null);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">CaveAVin</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          className="border rounded w-full p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded w-full p-2"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white rounded p-2" onClick={() => handleSubmit('signin')}>
            Se connecter
          </button>
          <button className="flex-1 border rounded p-2" onClick={() => handleSubmit('signup')}>
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
