import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Clientes from "./pages/Clientes";

export default function App() {
  return (
    <div style={styles.container}>

      {/* Sidebar fixa — presente em todas as telas */}
      <Sidebar />

      {/* Área de conteúdo — muda conforme a rota */}
      <div style={styles.content}>
        <Routes>

          {/* Rota padrão: redireciona "/" para "/clientes" */}
          <Route path="/" element={<Navigate to="/clientes" replace />} />

          {/* Clientes */}
          <Route path="/clientes" element={<Clientes />} />

          {/* Rotas futuras — descomentar conforme as páginas forem criadas */}
          {/* <Route path="/dashboard"     element={<Dashboard />}     /> */}
          {/* <Route path="/emprestimos"   element={<Emprestimos />}   /> */}
          {/* <Route path="/relatorios"    element={<Relatorios />}    /> */}
          {/* <Route path="/configuracoes" element={<Configuracoes />} /> */}

        </Routes>
      </div>

    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
};
