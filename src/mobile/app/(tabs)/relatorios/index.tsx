import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getRelatorio, exportarPdf, type Relatorio } from '@services/relatorios.service';
import { useAuth } from '@hooks/useAuth';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';

const hoje = new Date();
const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatDateBR(d: Date) {
  return d.toLocaleDateString('pt-BR');
}

const relatorioVazio: Relatorio = {
  totalEmprestado: 0,
  totalRecebido: 0,
  totalPendente: 0,
  lucroTotal: 0,
  emprestimosPorDevedor: [],
  pagamentosRecentes: [],
};

export default function RelatoriosScreen() {
  const { user } = useAuth();
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [mostrarPickerInicio, setMostrarPickerInicio] = useState(false);
  const [mostrarPickerFim, setMostrarPickerFim] = useState(false);
  const [relatorio, setRelatorio] = useState<Relatorio>(relatorioVazio);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [filtrado, setFiltrado] = useState(false);

  async function handleExportarPdf() {
    if (!filtrado) {
      Alert.alert('Atenção', 'Filtre o período antes de exportar.');
      return;
    }
    setExportando(true);
    try {
      const arrayBuffer = await exportarPdf(toInputDate(dataInicio), toInputDate(dataFim), user?.nome);
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const path = `${FileSystem.cacheDirectory}relatorio.pdf`;
      await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(path, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro ao exportar PDF', msg);
    } finally {
      setExportando(false);
    }
  }

  async function buscar() {
    setLoading(true);
    try {
      const data = await getRelatorio(toInputDate(dataInicio), toInputDate(dataFim), user?.nome);
      setRelatorio(data);
      setFiltrado(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o relatório.');
      setRelatorio(relatorioVazio);
    } finally {
      setLoading(false);
    }
  }

 return (
  <View style={s.container}>
  <View style={s.header}>
    <Text style={s.titulo}>Relatórios</Text>
  </View>
  <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
      

      {/* Filtros */}
      <View style={s.card}>
        <Text style={s.cardTitulo}>Filtrar por período</Text>
        <View style={s.row}>
          {/* Data início */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Data início</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setMostrarPickerInicio(true)}>
              <Text style={s.dateBtnIcone}>📅</Text>
              <Text style={s.dateBtnTxt}>{formatDateBR(dataInicio)}</Text>
            </TouchableOpacity>
          </View>

          {/* Data fim */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Data fim</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setMostrarPickerFim(true)}>
              <Text style={s.dateBtnIcone}>📅</Text>
              <Text style={s.dateBtnTxt}>{formatDateBR(dataFim)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pickers */}
        {mostrarPickerInicio && (
          <DateTimePicker
            value={dataInicio}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={hoje}
            onChange={(_, date) => {
              setMostrarPickerInicio(false);
              if (date) setDataInicio(date);
            }}
          />
        )}
        {mostrarPickerFim && (
          <DateTimePicker
            value={dataFim}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={dataInicio}
            maximumDate={hoje}
            onChange={(_, date) => {
              setMostrarPickerFim(false);
              if (date) setDataFim(date);
            }}
          />
        )}

        <TouchableOpacity style={s.btn} onPress={buscar} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.btnTxt}>Filtrar</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnPdf, (!filtrado || exportando) && s.btnDisabled]}
          onPress={handleExportarPdf}
          disabled={!filtrado || exportando}
        >
          {exportando
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.btnTxt}>📄 Exportar PDF</Text>}
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && <ActivityIndicator color="#6D28D9" size="large" style={{ marginTop: 24 }} />}

      {/* KPIs */}
      {!loading && (
        <>
          <View style={s.kpiGrid}>
            <KpiCard label="Total Emprestado" value={formatBRL(relatorio.totalEmprestado)} color="#6D28D9" />
            <KpiCard label="Total Recebido"   value={formatBRL(relatorio.totalRecebido)}   color="#059669" />
            <KpiCard label="Total Pendente"   value={formatBRL(relatorio.totalPendente)}   color="#D97706" />
            <KpiCard label="Lucro Total"      value={formatBRL(relatorio.lucroTotal)}      color="#2563EB" />
          </View>

          {/* Empréstimos por devedor */}
          <View style={s.card}>
            <Text style={s.cardTitulo}>Empréstimos por Devedor</Text>
            {!filtrado
              ? <Text style={s.vazio}>Selecione um período e clique em Filtrar.</Text>
              : relatorio.emprestimosPorDevedor.length === 0
                ? <Text style={s.vazio}>Nenhum dado encontrado para o período.</Text>
                : relatorio.emprestimosPorDevedor.map((item, i) => (
                  <View key={i} style={s.devedorItem}>
                    <Text style={s.devedorNome}>{item.devedor}</Text>
                    <View style={s.devedorRow}>
                      <DevedorInfo label="Qtd"        value={String(item.quantidade)} />
                      <DevedorInfo label="Emprestado" value={formatBRL(item.totalEmprestado)} />
                      <DevedorInfo label="Recebido"   value={formatBRL(item.recebido)} />
                      <DevedorInfo label="Pendente"   value={formatBRL(item.pendente)} />
                    </View>
                    <Text style={s.taxaMedia}>Taxa média: {item.taxaMedia.toFixed(1)}%</Text>
                  </View>
                ))}
          </View>

          {/* Pagamentos recentes */}
          <View style={s.card}>
            <Text style={s.cardTitulo}>Pagamentos Recentes</Text>
            {!filtrado
              ? <Text style={s.vazio}>Selecione um período e clique em Filtrar.</Text>
              : relatorio.pagamentosRecentes.length === 0
                ? <Text style={s.vazio}>Nenhum pagamento encontrado.</Text>
                : relatorio.pagamentosRecentes.map((p, i) => (
                  <View key={i} style={s.pagItem}>
                    <View style={s.pagHeader}>
                      <Text style={s.pagDevedor}>{p.devedor}</Text>
                      <Text style={[s.pagStatus, p.status === 'Pago' ? s.statusPago : s.statusPendente]}>
                        {p.status}
                      </Text>
                    </View>
                    <View style={s.pagRow}>
                      <Text style={s.pagInfo}>{formatDate(p.data)}</Text>
                      <Text style={s.pagValor}>{formatBRL(p.valor)}</Text>
                      <Text style={s.pagInfo}>{p.metodo}</Text>
                    </View>
                  </View>
                ))}
          </View>
        </>
      )}
    </ScrollView>
</View>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.kpiCard, { borderLeftColor: color }]}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

function DevedorInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.devedorInfo}>
      <Text style={s.devedorInfoLabel}>{label}</Text>
      <Text style={s.devedorInfoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F3FF' },
  header:      { padding: 20, paddingBottom: 12 },  
  content:     { padding: 16, paddingBottom: 100 },
  titulo:      { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 16 },

  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  cardTitulo:  { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },

  row:         { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputWrap:   { flex: 1 },
  label:       { fontSize: 12, color: '#6B7280', marginBottom: 4 },

  dateBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  dateBtnIcone:{ fontSize: 16 },
  dateBtnTxt:  { fontSize: 14, color: '#1F2937', fontWeight: '500' },

  btn:         { backgroundColor: '#6D28D9', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnPdf:      { backgroundColor: '#059669', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnTxt:      { color: '#fff', fontWeight: '600', fontSize: 15 },

  kpiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  kpiCard:     { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  kpiLabel:    { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  kpiValue:    { fontSize: 16, fontWeight: '700' },

  devedorItem: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 12 },
  devedorNome: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  devedorRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  devedorInfo: { minWidth: '22%' },
  devedorInfoLabel: { fontSize: 11, color: '#9CA3AF' },
  devedorInfoValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  taxaMedia:   { fontSize: 12, color: '#6B7280', marginTop: 6 },

  pagItem:     { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 12 },
  pagHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pagDevedor:  { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  pagStatus:   { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusPago:  { backgroundColor: '#D1FAE5', color: '#065F46' },
  statusPendente: { backgroundColor: '#FEF3C7', color: '#92400E' },
  pagRow:      { flexDirection: 'row', gap: 16 },
  pagInfo:     { fontSize: 13, color: '#6B7280' },
  pagValor:    { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  vazio:       { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
});
