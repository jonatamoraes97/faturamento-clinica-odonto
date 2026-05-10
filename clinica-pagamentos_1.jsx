import { useState, useMemo } from "react";

const INITIAL_DATA = [
  { id: 1, nome: "Ana Paula Ferreira", cpf: "529.982.247-25", valor: 1850.00, formaPagamento: "pix", vencimento: "2025-03-10", pago: false },
  { id: 2, nome: "Carlos Eduardo Mendes", cpf: "111.444.777-35", valor: 3200.00, formaPagamento: "cartao", vencimento: "2025-04-20", pago: true },
  { id: 3, nome: "Mariana Costa Silva", cpf: "987.654.321-00", valor: 750.00, formaPagamento: "boleto", vencimento: "2025-04-28", pago: false },
  { id: 4, nome: "João Roberto Alves", cpf: "456.123.789-09", valor: 5400.00, formaPagamento: "dinheiro", vencimento: "2025-05-05", pago: false },
];

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
}

function formatarCPF(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return v;
}

function formatarMoeda(v) {
  const num = v.replace(/\D/g, "");
  if (!num) return "";
  const val = (parseInt(num) / 100).toFixed(2);
  return parseFloat(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularDiasAtraso(vencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + "T00:00:00");
  const diff = Math.floor((hoje - venc) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function statusPagamento(item) {
  if (item.pago) return { tipo: "pago", label: "Pago", dias: 0 };
  const dias = calcularDiasAtraso(item.vencimento);
  if (dias > 0) return { tipo: "atrasado", label: `Atrasado`, dias };
  return { tipo: "pendente", label: "Pendente", dias: 0 };
}

const FORMAS = [
  { value: "pix", label: "PIX" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
];

const VAZIO = { nome: "", cpf: "", valor: "", formaPagamento: "", vencimento: "", pago: false };

export default function App() {
  const [registros, setRegistros] = useState(INITIAL_DATA);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [valorRaw, setValorRaw] = useState("");
  const [sucesso, setSucesso] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().replace(/\D/g, "");
    if (!busca) return registros;
    return registros.filter(r =>
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      r.cpf.replace(/\D/g, "").includes(q)
    );
  }, [registros, busca]);

  const stats = useMemo(() => {
    const total = registros.length;
    const pagos = registros.filter(r => r.pago).length;
    const atrasados = registros.filter(r => !r.pago && calcularDiasAtraso(r.vencimento) > 0).length;
    const valorTotal = registros.reduce((acc, r) => acc + r.valor, 0);
    return { total, pagos, atrasados, valorTotal };
  }, [registros]);

  function validarForm(f) {
    const e = {};
    if (!f.nome.trim()) e.nome = "Nome obrigatório";
    else if (f.nome.trim().length < 3) e.nome = "Nome muito curto";
    const cpfNum = f.cpf.replace(/\D/g, "");
    if (!cpfNum) e.cpf = "CPF obrigatório";
    else if (!validarCPF(f.cpf)) e.cpf = "CPF inválido";
    if (!valorRaw && !f.valor) e.valor = "Valor obrigatório";
    else {
      const num = parseFloat(String(f.valor).replace(/\D/g, "")) / 100;
      if (isNaN(num) || num <= 0) e.valor = "Valor deve ser maior que zero";
    }
    if (!f.formaPagamento) e.formaPagamento = "Selecione a forma de pagamento";
    if (!f.vencimento) e.vencimento = "Data de vencimento obrigatória";
    return e;
  }

  function abrirNovo() {
    setForm(VAZIO);
    setValorRaw("");
    setErros({});
    setEditandoId(null);
    setModalAberto(true);
  }

  function abrirEditar(reg) {
    setForm({ ...reg });
    const centavos = Math.round(reg.valor * 100);
    setValorRaw(String(centavos));
    setErros({});
    setEditandoId(reg.id);
    setModalAberto(true);
  }

  function salvar() {
    const e = validarForm(form);
    if (Object.keys(e).length > 0) { setErros(e); return; }
    const valorNum = parseFloat(valorRaw) / 100;
    if (editandoId !== null) {
      setRegistros(prev => prev.map(r => r.id === editandoId ? { ...form, valor: valorNum, id: editandoId } : r));
      setSucesso("Registro atualizado com sucesso!");
    } else {
      const novo = { ...form, valor: valorNum, id: Date.now() };
      setRegistros(prev => [...prev, novo]);
      setSucesso("Paciente cadastrado com sucesso!");
    }
    setModalAberto(false);
    setTimeout(() => setSucesso(""), 3000);
  }

  function excluir(id) {
    setRegistros(prev => prev.filter(r => r.id !== id));
  }

  function togglePago(id) {
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, pago: !r.pago } : r));
  }

  function handleValor(e) {
    const raw = e.target.value.replace(/\D/g, "");
    setValorRaw(raw);
    if (raw) {
      const num = parseInt(raw) / 100;
      setForm(f => ({ ...f, valor: num.toFixed(2) }));
    } else {
      setForm(f => ({ ...f, valor: "" }));
    }
  }

  const statusBadge = (item) => {
    const s = statusPagamento(item);
    if (s.tipo === "pago") return (
      <span style={{ background: "var(--color-background-success)", color: "var(--color-text-success)", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
        ✓ Pago
      </span>
    );
    if (s.tipo === "atrasado") return (
      <span style={{ background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
        ✕ Atrasado {s.dias}d
      </span>
    );
    return (
      <span style={{ background: "var(--color-background-warning)", color: "var(--color-text-warning)", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
        ⏱ Pendente
      </span>
    );
  };

  const inputStyle = (campo) => ({
    width: "100%", boxSizing: "border-box",
    border: erros[campo] ? "1.5px solid var(--color-border-danger)" : "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)", padding: "8px 12px", fontSize: 14,
    background: "var(--color-background-primary)", color: "var(--color-text-primary)",
    outline: "none",
  });

  return (
    <div style={{ padding: "1.5rem 1rem", fontFamily: "var(--font-sans)", maxWidth: 900, margin: "0 auto" }}>
      <h2 aria-hidden="false" style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
        Gestão de Pagamentos
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 1.5rem" }}>Clínica Odontológica — Painel Administrativo</p>

      {sucesso && (
        <div style={{ background: "var(--color-background-success)", color: "var(--color-text-success)", padding: "10px 14px", borderRadius: "var(--border-radius-md)", fontSize: 13, marginBottom: "1rem", border: "0.5px solid var(--color-border-success)" }}>
          {sucesso}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Total de pacientes", value: stats.total, color: "var(--color-text-primary)" },
          { label: "Pagamentos em dia", value: stats.pagos, color: "var(--color-text-success)" },
          { label: "Em atraso", value: stats.atrasados, color: "var(--color-text-danger)" },
          { label: "Receita total", value: stats.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), color: "var(--color-text-primary)" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{c.label}</p>
            <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", fontSize: 14, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
        />
        <button onClick={abrirNovo} style={{ padding: "8px 18px", fontSize: 14, fontWeight: 500, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", cursor: "pointer", whiteSpace: "nowrap" }}>
          + Novo paciente
        </button>
      </div>

      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Paciente", "CPF", "Valor", "Pagamento", "Vencimento", "Status", "Ações"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", fontSize: 12, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : filtrados.map((reg, idx) => {
                const s = statusPagamento(reg);
                const rowBg = s.tipo === "atrasado" ? "rgba(var(--color-background-danger), 0.03)" : "transparent";
                return (
                  <tr key={reg.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", background: idx % 2 === 0 ? "transparent" : "var(--color-background-secondary)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reg.nome}</td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{reg.cpf}</td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-primary)" }}>
                      {reg.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                      {FORMAS.find(f => f.value === reg.formaPagamento)?.label || reg.formaPagamento}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {new Date(reg.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{statusBadge(reg)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => togglePago(reg.id)}
                          title={reg.pago ? "Marcar como não pago" : "Marcar como pago"}
                          style={{ fontSize: 12, padding: "3px 8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
                        >
                          {reg.pago ? "↩" : "✓"}
                        </button>
                        <button
                          onClick={() => abrirEditar(reg)}
                          style={{ fontSize: 12, padding: "3px 8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => excluir(reg.id)}
                          style={{ fontSize: 12, padding: "3px 8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, background: "transparent", color: "var(--color-text-danger)", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 8 }}>
        {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""} exibido{filtrados.length !== 1 ? "s" : ""}
      </p>

      {modalAberto && (
        <div
          onClick={e => e.target === e.currentTarget && setModalAberto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
        >
          <div style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
                {editandoId !== null ? "Editar paciente" : "Novo paciente"}
              </h3>
              <button onClick={() => setModalAberto(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Nome completo *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome do paciente"
                  style={inputStyle("nome")}
                />
                {erros.nome && <p style={{ fontSize: 11, color: "var(--color-text-danger)", margin: "3px 0 0" }}>{erros.nome}</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>CPF *</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: formatarCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  style={{ ...inputStyle("cpf"), fontFamily: "var(--font-mono)" }}
                />
                {erros.cpf && <p style={{ fontSize: 11, color: "var(--color-text-danger)", margin: "3px 0 0" }}>{erros.cpf}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Valor do procedimento *</label>
                  <input
                    type="text"
                    value={valorRaw ? (parseInt(valorRaw) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}
                    onChange={handleValor}
                    placeholder="R$ 0,00"
                    style={inputStyle("valor")}
                  />
                  {erros.valor && <p style={{ fontSize: 11, color: "var(--color-text-danger)", margin: "3px 0 0" }}>{erros.valor}</p>}
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Forma de pagamento *</label>
                  <select
                    value={form.formaPagamento}
                    onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))}
                    style={inputStyle("formaPagamento")}
                  >
                    <option value="">Selecionar...</option>
                    {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  {erros.formaPagamento && <p style={{ fontSize: 11, color: "var(--color-text-danger)", margin: "3px 0 0" }}>{erros.formaPagamento}</p>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Data de vencimento *</label>
                  <input
                    type="date"
                    value={form.vencimento}
                    onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                    style={inputStyle("vencimento")}
                  />
                  {erros.vencimento && <p style={{ fontSize: 11, color: "var(--color-text-danger)", margin: "3px 0 0" }}>{erros.vencimento}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={form.pago}
                      onChange={e => setForm(f => ({ ...f, pago: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: "var(--color-text-success)" }}
                    />
                    Marcar como pago
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModalAberto(false)} style={{ padding: "8px 18px", fontSize: 14, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={salvar} style={{ padding: "8px 22px", fontSize: 14, fontWeight: 500, border: "none", borderRadius: "var(--border-radius-md)", background: "var(--color-text-primary)", color: "var(--color-background-primary)", cursor: "pointer" }}>
                {editandoId !== null ? "Salvar alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
