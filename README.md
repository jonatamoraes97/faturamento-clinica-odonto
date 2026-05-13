# 🦷 OdontoGestão — Sistema de Gestão de Pagamentos

Sistema web completo para gestão de pagamentos de uma clínica odontológica fictícia, desenvolvido como projeto de portfólio. Combina um painel administrativo web, automação com Python e banco de dados em nuvem.

---

## 🖥️ Protótipo

🔗 [sorrisobanguela-odonto.netlify.app](https://sorrisobanguela-odonto.netlify.app)

---

## 💡 Como o projeto foi desenvolvido

Este projeto foi construído de forma colaborativa com **[Claude](https://claude.ai)**, o modelo de linguagem da Anthropic, utilizado como assistente de programação diretamente pelo chat.

O processo foi totalmente orientado por prompts: eu descrevia o que queria — as funcionalidades, as regras de negócio, os ajustes visuais — e o Claude gerava e refinava o código em tempo real. Cada iteração era testada, e os erros eram reportados de volta para o Claude corrigir.

Esse fluxo de trabalho simulou na prática o ciclo de desenvolvimento ágil: levantar requisito → implementar → testar → ajustar.

### O que eu defini e conduzi:
- Os requisitos do sistema (regras de negócio da clínica)
- As decisões de arquitetura (Supabase, Netlify, estrutura do banco)
- Os testes manuais e identificação de bugs
- A integração entre as partes (site + Python + banco de dados)
- A lógica de negócio específica (vencimento automático, status por forma de pagamento)

### O que o Claude programou:
- Todo o HTML, CSS e JavaScript do painel web
- As correções de bugs identificados durante os testes

---

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Banco de dados | Supabase (PostgreSQL) |
| Automação | Python 3, Selenium, openpyxl |
| Deploy | Netlify |
| Assistente de código | Claude (Anthropic) |

---

## ✅ Funcionalidades

### Painel Web (`clinica-pagamentos.html`)
- **Dashboard** com KPIs em tempo real: total de pacientes, pagamentos em dia, inadimplentes e receita
- **Cadastro de pacientes** com validação de CPF pelo algoritmo oficial dos dígitos verificadores
- **Máscaras automáticas** para CPF e valor monetário (R$)
- **Status automático** por forma de pagamento:
  - PIX, Dinheiro e Cartão de Débito → marcados como **Pago** automaticamente
  - Cartão de Crédito e Boleto → vencimento calculado para **+1 mês** após a consulta
- **Destaque visual** por status: verde (pago), vermelho (atrasado), amarelo (pendente)
- **Cálculo automático** de dias em atraso
- **Consulta** com busca por nome ou CPF e filtros por status e forma de pagamento
- **Validador de CPF** independente com detalhamento dos critérios
- **Relatório financeiro** com gráficos de barras por forma de pagamento e exportação em CSV
- **Dados persistidos** em nuvem via Supabase — sem localStorage

### Automação Python (`automacao.py`)
- Lê os dados dos clientes de uma planilha Excel (`dados_clientes.xlsx`)
- Abre o navegador automaticamente com Selenium
- Preenche e submete o formulário de cadastro para cada cliente
- Coleta os resultados exibidos no site após o cadastro
- Salva os resultados na planilha de fechamento (`planilha_fechamento.xlsx`)
- Grava simultaneamente no banco de dados Supabase

---

## 🗄️ Banco de dados

Utilizando **Supabase** (PostgreSQL gerenciado em nuvem) com duas tabelas:

**`pacientes`** — usada pelo painel web
```sql
id        uuid primary key
nome      text
cpf       text
valor     numeric(10,2)
forma     text
venc      date
pago      boolean
criado_em timestamp
```

**`pagamentos`** — usada pela automação Python
```sql
id              uuid primary key
nome            text
cpf             text
valor           numeric(10,2)
forma_pagamento text
data_consulta   date
vencimento      date
status          text
metodo_site     text
status_planilha text
criado_em       timestamp
```

---

## 🚀 Como executar a automação

### Pré-requisitos
- Python 3.10+
- Google Chrome instalado
- Conta no [Supabase](https://supabase.com) com as tabelas criadas

### Instalação das dependências
```bash
pip install selenium openpyxl python-dotenv supabase
```

### Configuração
Renomeie `.env.example` para `.env` e preencha com suas credenciais do Supabase:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica-aqui
```

Verifique também os caminhos dos arquivos Excel no topo do `automacao.py`:
```python
DADOS_FILE    = r"caminho\para\dados_clientes.xlsx"
FECHAMENTO_FILE = r"caminho\para\planilha_fechamento.xlsx"
```

### Execução
```bash
python automacao.py
```

O Chrome abrirá automaticamente, processará cada cliente da planilha e encerrará ao final.

---

## 📁 Estrutura do projeto

```
odonto-gestao/
├── clinica-pagamentos.html   # Sistema web completo (frontend + integração Supabase)
├── automacao.py              # Script de automação Python
├── .env.example              # Modelo do arquivo de credenciais
├── .gitignore                # Ignora .env e arquivos Excel com dados reais
└── README.md
```

---

## 📸 Screenshots

<img width="1902" height="896" alt="image" src="https://github.com/user-attachments/assets/dfbc3bd2-d1b4-4c66-ad43-7652c7a062f0" />

<img width="1914" height="924" alt="image" src="https://github.com/user-attachments/assets/25cd9db5-069a-4cbf-86d6-f2218211f04f" />

<img width="1916" height="928" alt="image" src="https://github.com/user-attachments/assets/82aac96b-1251-443b-ad24-e81cd93c5d38" />

<img width="1916" height="924" alt="image" src="https://github.com/user-attachments/assets/10e5cdaa-1f36-4b4e-8b6a-c2e65a8ae8ec" />




####

---

## 🧠 Aprendizados do projeto

Desenvolver este projeto com auxílio de IA foi uma experiência muito boa para o desenvolvimento de novas habilidades. Os principais aprendizados foram:

- Como descrever requisitos com clareza para obter código funcional
- Identificar e reportar bugs com contexto suficiente para corrigi-los
- Integrar partes distintas de um sistema (frontend, automação, banco de dados)
- Entender o código gerado para poder adaptá-lo e mantê-lo
- Tomar decisões de arquitetura e tecnologia de forma autônoma
