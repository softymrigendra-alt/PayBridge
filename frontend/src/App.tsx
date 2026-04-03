import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import DemoOnboardingPage from './pages/DemoOnboardingPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demo/onboarding" element={<DemoOnboardingPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/opportunities" replace />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
      </Route>
    </Routes>
  );
}
