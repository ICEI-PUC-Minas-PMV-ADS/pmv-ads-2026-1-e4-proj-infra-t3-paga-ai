import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@hooks/useAuth';
import api from '@services/api';
import { CLIENTES, EMPRESTIMOS, REPORT } from '@constants/endpoints';
import { Emprestimo, fmt } from '@types/emprestimo';

interface Stats {
  clientes: number;
  emprestimos: number;
  emDia: number;
  atraso: number;
  investido: number;
  aReceber: number;
  lucro: number;
}

function calcularStatus(e: Emprestimo) {
  if (e.pago) return 'pago';
  const diff = Math.ceil((new Date(e.dataVencimento).getTime() - Date.now()) / 86400000);
  return diff < 0 ? 'atraso' : 'emDia';
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const acoes = [
  { icon: '👥', label: 'Clientes',    desc: 'Gerenciar devedores',     cor: '#7C3AED', rota: '/(tabs)/clientes' },
  { icon: '💳', label: 'Empréstimos', desc: 'Controle de empréstimos', cor: '#2563EB', rota: '/(tabs)/emprestimos' },
  { icon: '📈', label: 'Relatórios',  desc: 'Visualizar relatórios',   cor: '#16A34A', rota: '/(tabs)/relatorios' },
  { icon: '🔔', label: 'Notificações',desc: 'Avisos e alertas',        cor: '#F59E0B', rota: '/(tabs)/notificacoes' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const nome = user?.nome?.split(' ')[0] ?? 'Usuário';

  const [stats, setStats] = useState<Stats | null>(null);
  const [vencendo, setVencendo] = useState<Emprestimo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const cobrador = user?.nome ?? '';
        const [resClientes, resCarteira, resLucro] = await Promise.all([
          api.get(CLIENTES),
          api.get(`${EMPRESTIMOS}/carteira/${encodeURIComponent(cobrador)}`),
          api.get(`${REPORT}/relatorio-lucro/${encodeURIComponent(cobrador)}`),
        ]);

        const clientes: unknown[] = Array.isArray(resClientes.data) ? resClientes.data : [];
        const lista: Emprestimo[] = Array.isArray(resCarteira.data) ? resCarteira.data : [];
        const lucro = resLucro.data;

        const emDia     = lista.filter((e) => calcularStatus(e) === 'emDia');
        const atrasados = lista.filter((e) => calcularStatus(e) === 'atraso');
        const proximos  = lista
          .filter((e) => !e.pago)
          .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
          .slice(0, 4);

        setVencendo(proximos);
        setStats({
          clientes:    clientes.length,
          emprestimos: lista.length,
          emDia:       emDia.length,
          atraso:      atrasados.length,
          investido:   lucro?.resumoGeral?.investimentoTotal      ?? 0,
          aReceber:    lucro?.resumoGeral?.recebimentoTotalGeral  ?? 0,
          lucro:       lucro?.resumoGeral?.lucroTotalProjetado    ?? 0,
        });
      } catch {
        setStats({ clientes: 0, emprestimos: 0, emDia: 0, atraso: 0, investido: 0, aReceber: 0, lucro: 0 });
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [user]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.saudacao}>{saudacao()}, {nome} 👋</Text>
        <Text style={s.titulo}>Painel</Text>
      </View>

      {/* Cards de contagem */}
      <View style={s.statsGrid}>
        <StatCard icon="👥" label="Clientes"    valor={stats?.clientes}    cor="#7C3AED" carregando={carregando} />
        <StatCard icon="💳" label="Empréstimos" valor={stats?.emprestimos} cor="#2563EB" carregando={carregando} />
        <StatCard icon="✅" label="Em dia"       valor={stats?.emDia}       cor="#16A34A" carregando={carregando} />
        <StatCard icon="⚠️" label="Em atraso"   valor={stats?.atraso}      cor="#DC2626" carregando={carregando} />
      </View>

      {/* Cards financeiros */}
      <View style={s.finGrid}>
        <FinCard label="Total Investido" valor={fmt(stats?.investido ?? 0)} cor="#7C3AED" carregando={carregando} />
        <FinCard label="Total a Receber" valor={fmt(stats?.aReceber  ?? 0)} cor="#2563EB" carregando={carregando} />
        <FinCard label="Lucro Projetado" valor={fmt(stats?.lucro     ?? 0)} cor="#16A34A" carregando={carregando} />
      </View>

      {/* Próximos vencimentos */}
      <View style={s.section}>
        <Text style={s.secaoTitulo}>Próximos vencimentos</Text>
        {carregando ? (
          <ActivityIndicator color="#7C3AED" style={{ marginVertical: 16 }} />
        ) : vencendo.length === 0 ? (
          <Text style={s.vazio}>Nenhum empréstimo pendente.</Text>
        ) : (
          vencendo.map((e) => {
            const diff     = Math.ceil((new Date(e.dataVencimento).getTime() - Date.now()) / 86400000);
            const atrasado = diff < 0;
            return (
              <View key={e.id} style={s.vencRow}>
                <View>
                  <Text style={s.vencNome}>{e.cliente}</Text>
                  <Text style={s.vencData}>
                    {atrasado
                      ? `${Math.abs(diff)} dia(s) em atraso`
                      : diff === 0 ? 'Vence hoje'
                      : `Vence em ${diff} dia(s)`}
                  </Text>
                </View>
                <Text style={[s.vencValor, { color: atrasado ? '#DC2626' : '#7C3AED' }]}>
                  {fmt(e.valorFinal)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Acesso rápido */}
      <View style={s.section}>
        <Text style={s.secaoTitulo}>Acesso rápido</Text>
        <View style={s.acoesGrid}>
          {acoes.map((a) => (
            <TouchableOpacity key={a.label} style={s.acaoCard} onPress={() => router.push(a.rota as never)}>
              <View style={[s.acaoIconeWrap, { backgroundColor: `${a.cor}18` }]}>
                <Text style={s.acaoIcone}>{a.icon}</Text>
              </View>
              <Text style={s.acaoLabel}>{a.label}</Text>
              <Text style={s.acaoDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, valor, cor, carregando }: {
  icon: string; label: string; valor?: number; cor: string; carregando: boolean;
}) {
  return (
    <View style={[s.statCard, { borderTopColor: cor, borderTopWidth: 4 }]}>
      <Text style={[s.statIcon, { color: cor }]}>{icon}</Text>
      <View>
        {carregando
          ? <ActivityIndicator color={cor} size="small" />
          : <Text style={s.statValor}>{valor ?? 0}</Text>}
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function FinCard({ label, valor, cor, carregando }: {
  label: string; valor: string; cor: string; carregando: boolean;
}) {
  return (
    <View style={[s.finCard, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
      <Text style={s.finLabel}>{label}</Text>
      {carregando
        ? <ActivityIndicator color={cor} size="small" style={{ marginTop: 4 }} />
        : <Text style={[s.finValor, { color: cor }]}>{valor}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  page:         { flex: 1, backgroundColor: '#F5F3FF' },
  content:      { padding: 20, paddingBottom: 40 },
  header:       { marginBottom: 20 },
  saudacao:     { fontSize: 14, color: '#6B7280' },
  titulo:       { fontSize: 28, fontWeight: '700', color: '#1F2937', marginTop: 4 },

  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statCard:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row',
                  alignItems: 'center', gap: 12, width: '48%',
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon:     { fontSize: 26 },
  statValor:    { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  statLabel:    { fontSize: 11, color: '#6B7280', marginTop: 2 },

  finGrid:      { gap: 10, marginBottom: 16 },
  finCard:      { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  finLabel:     { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  finValor:     { fontSize: 18, fontWeight: '700' },

  section:      { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  secaoTitulo:  { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },

  vencRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  vencNome:     { fontWeight: '600', fontSize: 14, color: '#1F2937' },
  vencData:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  vencValor:    { fontWeight: '700', fontSize: 14 },
  vazio:        { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },

  acoesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  acaoCard:     { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
                  borderRadius: 10, padding: 14, width: '48%' },
  acaoIconeWrap:{ borderRadius: 8, padding: 8, alignSelf: 'flex-start', marginBottom: 6 },
  acaoIcone:    { fontSize: 20 },
  acaoLabel:    { fontWeight: '600', fontSize: 13, color: '#1F2937' },
  acaoDesc:     { fontSize: 11, color: '#6B7280', marginTop: 2 },
});
