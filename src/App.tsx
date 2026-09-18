import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AddBottlePage } from './pages/AddBottlePage';
import { DashboardPage } from './pages/DashboardPage';
import { CellarListPage } from './pages/CellarListPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-bottle"
        element={
          <ProtectedRoute>
            <AddBottlePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cellar"
        element={
          <ProtectedRoute>
            <CellarListPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
