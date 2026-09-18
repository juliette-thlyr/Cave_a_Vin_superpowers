import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-white p-4">
              <h1 className="text-2xl font-bold">CaveAVin</h1>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
