import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoansPage from './pages/Emprestimos';

function App() {
  return (
    <Router>
      <Routes>
        {/* Define que o componente LoansPage só aparece em /emprestimos */}
        <Route path="/emprestimos" element={<LoansPage />} />

        {/* Faz com que quem acessar a raiz (/) seja enviado para /emprestimos */}
        <Route path="/" element={<Navigate to="/emprestimos" />} />
        
        {/* Opcional: Uma rota 404 caso digitem algo errado */}
        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
