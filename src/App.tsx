import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AddBottlePage } from './pages/AddBottlePage';
import { DashboardPage } from './pages/DashboardPage';
import { CellarListPage } from './pages/CellarListPage';
import { BottleDetailPage } from './pages/BottleDetailPage';
import { TastingFormPage } from './pages/TastingFormPage';
import { TastingHistoryPage } from './pages/TastingHistoryPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <NavBar />
      {children}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/add-bottle"
        element={
          <AuthenticatedLayout>
            <AddBottlePage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/cellar"
        element={
          <AuthenticatedLayout>
            <CellarListPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/bottles/:id"
        element={
          <AuthenticatedLayout>
            <BottleDetailPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/bottles/:id/taste"
        element={
          <AuthenticatedLayout>
            <TastingFormPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/history"
        element={
          <AuthenticatedLayout>
            <TastingHistoryPage />
          </AuthenticatedLayout>
        }
      />
    </Routes>
  );
}

export default App;
