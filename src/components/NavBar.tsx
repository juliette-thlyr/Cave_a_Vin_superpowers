import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function NavBar() {
  const { signOut } = useAuth();
  return (
    <nav className="flex gap-4 p-3 border-b bg-gray-50 text-sm">
      <Link to="/">Tableau de bord</Link>
      <Link to="/cellar">Ma cave</Link>
      <Link to="/add-bottle">Ajouter</Link>
      <Link to="/history">Historique</Link>
      <button onClick={() => signOut()} className="ml-auto text-red-600">
        Se deconnecter
      </button>
    </nav>
  );
}
