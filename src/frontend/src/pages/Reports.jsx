import { useState } from "react";
import { getUsuarioLogado } from "../services/authService";

const API_URL = "http://localhost:5169/api/report";

export default function Reports() {
    const cobrador = getUsuarioLogado()?.nome ?? "";
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [relatorio, setRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const formatMoney = (value) =>
        Number(value ?? 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    const formatDate = (date) => {
        if (!date) return "-";
        return date.substring(0, 10).split("-").reverse().join("/");
    };

    async function buscarRelatorio() {
        if (!dataInicio || !dataFim) {
            alert("Selecione a data inicial e a data final.");
            return;
        }

        try {
            setLoading(true);
            setErro("");

            const response = await fetch(
                `${API_URL}?dataInicio=${dataInicio}&dataFim=${dataFim}&cobrador=${encodeURIComponent(cobrador)}`
            );

            if (!response.ok) {
                throw new Error("Erro ao buscar relatório.");
            }

            const data = await response.json();
            setRelatorio(data);
        } catch (error) {
            console.error(error);
            setErro("Não foi possível carregar o relatório.");
        } finally {
            setLoading(false);
        }
    }

    async function exportarPdf() {
        if (!dataInicio || !dataFim) {
            alert("Selecione a data inicial e a data final.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/export-pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dataInicio,
                    dataFim,
                    cobrador,
                }),
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "relatorio.pdf";
            a.click();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            alert("Não foi possível exportar o PDF.");
        }
    }

    return (
        <main style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Relatórios</h1>
                    <p style={styles.subtitle}>
                        Acompanhe pagamentos, pendências e lucro dos empréstimos.
                    </p>
                </div>

                <button style={styles.primaryButton} onClick={exportarPdf}>
                    📄 Exportar PDF
                </button>
            </div>

            <section style={styles.filterCard}>
                <div style={styles.filterHeader}>
                    <h3 style={styles.filterTitle}>Filtrar relatório</h3>
                    <p style={styles.filterText}>
                        Selecione o período para visualizar os dados financeiros.
                    </p>
                </div>

                <div style={styles.filters}>
                    <div style={styles.field}>
                        <label style={styles.label}>Data inicial</label>
                        <input
                            style={styles.input}
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Data final</label>
                        <input
                            style={styles.input}
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />
                    </div>

                    <button style={styles.filterButton} onClick={buscarRelatorio}>
                        {loading ? "Buscando..." : "Filtrar"}
                    </button>
                </div>

                {erro && <p style={styles.error}>{erro}</p>}
            </section>

            <section style={styles.kpiGrid}>
                <KpiCard
                    label="TOTAL EMPRESTADO"
                    value={formatMoney(relatorio?.totalEmprestado)}
                    description="Todos os empréstimos"
                />
                <KpiCard
                    label="TOTAL RECEBIDO"
                    value={formatMoney(relatorio?.totalRecebido)}
                    description="Pagamentos recebidos"
                />
                <KpiCard
                    label="TOTAL PENDENTE"
                    value={formatMoney(relatorio?.totalPendente)}
                    description="Saldo a receber"
                />
                <KpiCard
                    label="LUCRO TOTAL"
                    value={formatMoney(relatorio?.lucroTotal)}
                    description="Juros recebidos"
                />
            </section>

            <section style={styles.tableCard}>
                <h3 style={styles.tableTitle}>Empréstimos por Devedor</h3>

                <table style={styles.table}>
                    <thead>
                        <tr>
                            <Th>DEVEDOR</Th>
                            <Th>QUANTIDADE</Th>
                            <Th>TOTAL EMPRESTADO</Th>
                            <Th>RECEBIDO</Th>
                            <Th>PENDENTE</Th>
                            <Th>TAXA MÉDIA</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {relatorio?.emprestimosPorDevedor?.length > 0 ? (
                            relatorio.emprestimosPorDevedor.map((item, index) => (
                                <tr key={index}>
                                    <Td>{item.devedor}</Td>
                                    <Td>{item.quantidade}</Td>
                                    <Td>{formatMoney(item.totalEmprestado)}</Td>
                                    <Td>{formatMoney(item.recebido)}</Td>
                                    <Td>{formatMoney(item.pendente)}</Td>
                                    <Td>{(item.taxaMedia * 100).toFixed(2)}%</Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td colSpan={6}>Nenhum dado encontrado para o período.</Td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section style={styles.tableCard}>
                <h3 style={styles.tableTitle}>Pagamentos Recentes</h3>

                <table style={styles.table}>
                    <thead>
                        <tr>
                            <Th>DATA</Th>
                            <Th>DEVEDOR</Th>
                            <Th>VALOR</Th>
                            <Th>MÉTODO</Th>
                            <Th>REFERÊNCIA</Th>
                            <Th>STATUS</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {relatorio?.pagamentosRecentes?.length > 0 ? (
                            relatorio.pagamentosRecentes.map((pagamento, index) => (
                                <tr key={index}>
                                    <Td>{formatDate(pagamento.data)}</Td>
                                    <Td>{pagamento.devedor}</Td>
                                    <Td>{formatMoney(pagamento.valor)}</Td>
                                    <Td>{pagamento.metodo}</Td>
                                    <Td>{pagamento.referencia}</Td>
                                    <Td>
                                        <span style={styles.status}>{pagamento.status}</span>
                                    </Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <Td colSpan={6}>Nenhum pagamento encontrado.</Td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </main>
    );
}

function KpiCard({ label, value, description }) {
    return (
        <div style={styles.kpiCard}>
            <small style={styles.kpiLabel}>{label}</small>
            <h2 style={styles.kpiValue}>{value}</h2>
            <p style={styles.kpiDescription}>{description}</p>
        </div>
    );
}

function Th({ children }) {
    return <th style={styles.th}>{children}</th>;
}

function Td({ children, colSpan }) {
    return (
        <td style={styles.td} colSpan={colSpan}>
            {children}
        </td>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "32px 48px",
        fontFamily: "Inter, Segoe UI, sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
    },
    title: {
        margin: 0,
        fontSize: "28px",
        fontWeight: 700,
        color: "#111827",
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "14px",
    },
    primaryButton: {
        backgroundColor: "#7c3aed",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 20px",
        fontWeight: 600,
        cursor: "pointer",
    },
    filterCard: {
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "24px",
    },
    filterHeader: {
        marginBottom: "18px",
    },
    filterTitle: {
        margin: 0,
        fontSize: "18px",
        color: "#111827",
    },
    filterText: {
        margin: "4px 0 0",
        fontSize: "13px",
        color: "#6b7280",
    },
    filters: {
        display: "flex",
        gap: "16px",
        alignItems: "end",
        flexWrap: "wrap",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#6b7280",
    },
    input: {
        width: "180px",
        height: "42px",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        padding: "0 14px",
        fontSize: "14px",
        backgroundColor: "#fff",
        color: "#111827",
    },
    filterButton: {
        height: "42px",
        padding: "0 22px",
        border: "none",
        borderRadius: "10px",
        backgroundColor: "#7c3aed",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
    },
    error: {
        marginTop: "12px",
        color: "#dc2626",
        fontSize: "13px",
        fontWeight: 600,
    },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "28px",
    },
    kpiCard: {
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px 20px",
    },
    kpiLabel: {
        fontSize: "10px",
        fontWeight: 600,
        color: "#9ca3af",
        letterSpacing: "1px",
    },
    kpiValue: {
        margin: "6px 0",
        fontSize: "22px",
        color: "#111827",
    },
    kpiDescription: {
        margin: 0,
        fontSize: "12px",
        color: "#9ca3af",
    },
    tableCard: {
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        marginBottom: "16px",
        overflow: "hidden",
    },
    tableTitle: {
        margin: 0,
        padding: "16px 20px",
        fontSize: "15px",
        color: "#111827",
        borderBottom: "1px solid #e5e7eb",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        backgroundColor: "#f9fafb",
        padding: "12px 16px",
        textAlign: "left",
        fontSize: "11px",
        fontWeight: 600,
        color: "#9ca3af",
        letterSpacing: "0.8px",
        borderBottom: "1px solid #e5e7eb",
    },
    td: {
        padding: "14px 16px",
        fontSize: "14px",
        color: "#374151",
        borderBottom: "1px solid #f3f4f6",
    },
    status: {
        backgroundColor: "#d1fae5",
        color: "#059669",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
    },
};