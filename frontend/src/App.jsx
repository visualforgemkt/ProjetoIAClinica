import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Assistant from './pages/Assistant';
import Insights from './pages/Insights';
import Campaigns from './pages/Campaigns';
import Creatives from './pages/Creatives';
import Settings from './pages/Settings';
import useAuthStore from './store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/assistente" replace />} />
          <Route path="/assistente" element={<Assistant />} />
          <Route path="/chat" element={<Navigate to="/assistente" replace />} />
          <Route path="/campanhas" element={<Campaigns />} />
          <Route path="/criativos" element={<Creatives />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/dashboard" element={<Navigate to="/insights" replace />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
