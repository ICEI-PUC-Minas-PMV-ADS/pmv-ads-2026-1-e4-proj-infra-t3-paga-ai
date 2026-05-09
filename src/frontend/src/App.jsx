import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Clientes from "./pages/Clientes";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { isAuthenticated } from "./services/authService";
import Dashboard from "./pages/Dashboard";
import Emprestimos from "./pages/Emprestimos";
import Configuracoes from "./pages/Configuracoes";
import Notificacoes from "./pages/Notificacoes";

export default function App() {
  const location = useLocation();
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/"];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const authenticated = isAuthenticated();

  return (
    <div style={styles.container}>
      {!isPublicRoute && authenticated && <Sidebar />}

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={authenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={authenticated ? <Navigate to="/clientes" replace /> : <Register />}
          />
          <Route
            path="/forgot-password"
            element={authenticated ? <Navigate to="/clientes" replace /> : <ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={authenticated ? <Navigate to="/clientes" replace /> : <ResetPassword />}
          />
          <Route
            path="/clientes"
            element={authenticated ? <Clientes /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/relatorios"
            element={authenticated ? <Reports /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/dashboard"
            element={authenticated ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/emprestimos"
            element={authenticated ? <Emprestimos /> : <Navigate to="/login" replace />}
                  />

          <Route
            path="/configuracoes"
            element={authenticated ? <Configuracoes /> : <Navigate to="/login" replace />}
                  />

                  <Route
                      path="/notificacoes"
                      element={authenticated ? <Notificacoes /> : <Navigate to="/login" replace />}
                  />
                
        </Routes>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
  },
  content: {
    flex: 1,
    minHeight: "100vh",
    marginLeft: "256px",
  },
};

