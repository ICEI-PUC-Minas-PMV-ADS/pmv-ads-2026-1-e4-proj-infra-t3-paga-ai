import { useLocation, useNavigate } from "react-router-dom";
import { getUsuarioLogado, logout } from "../services/authService";

const navItems = [
  { icon: "📊", label: "Dashboard",    path: "/dashboard"    },
  { icon: "👥", label: "Clientes",     path: "/clientes"     },
  { icon: "💳", label: "Empréstimos",  path: "/emprestimos"  },
  { icon: "📈", label: "Relatórios",   path: "/relatorios"   },
  { icon: "⚙️", label: "Configurações", path: "/configuracoes" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const usuario = getUsuarioLogado();
  const user = {
    initials: usuario?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "??",
    name:     usuario?.nome  ?? "Usuário",
    email:    usuario?.email ?? "",
  };

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoWrapper}>
        <div style={styles.logoIcon}>💰</div>
        <span style={styles.logoText}>Paga Aí</span>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{
                ...styles.navLabel,
                ...(isActive ? styles.navLabelActive : {}),
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.avatar}>{user.initials}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Sair</button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "256px",
    height: "100vh",
    backgroundColor: "#ffffff",
    borderRight: "1px solid rgba(229, 231, 235, 1)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    position: "fixed",
    top: 0,
    left: 0,
    overflowY: "auto",
    zIndex: 100,
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 16px 16px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(143deg, rgba(124,58,237,1) 0%, rgba(109,40,217,1) 100%)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    color: "rgba(31, 41, 55, 1)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px 16px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background-color 0.15s ease",
  },
  navItemActive: {
    backgroundColor: "rgba(243, 244, 246, 1)",
  },
  navIcon: {
    fontSize: "16px",
  },
  navLabel: {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    color: "rgba(107, 114, 128, 1)",
  },
  navLabelActive: {
    color: "rgba(124, 58, 237, 1)",
    fontWeight: 700,
  },
  footer: {
    borderTop: "1px solid rgba(229, 231, 235, 1)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  footerTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(143deg, rgba(124,58,237,1) 0%, rgba(109,40,217,1) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflow: "hidden",
  },
  userName: {
    fontFamily: "Inter, sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "rgba(31, 41, 55, 1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    color: "rgba(107, 114, 128, 1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid rgba(229, 231, 235, 1)",
    backgroundColor: "rgba(243, 244, 246, 1)",
    color: "rgba(107, 114, 128, 1)",
    fontFamily: "Inter, sans-serif",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
};
