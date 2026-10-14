# 🩺 Avelliq

Sistema de agendamento para clínicas médicas: cadastro de médicos com dias e horários de atendimento, pacientes, consultas com horários livres calculados automaticamente, e um dashboard de faturamento. Toda conta começa no plano Free, e os planos pagos são cobrados via Stripe.

🔗 **Aplicação online:** [avelliq.vercel.app](https://avelliq.vercel.app)

> 💳 **Os planos pagos usam o modo de testes do Stripe.** Use o cartão `4242 4242 4242 4242`, com qualquer data de validade futura, CVC e CEP. **Não use dados reais de cartão.**

---

## ✨ Funcionalidades

- **Autenticação** com e-mail e senha ou conta Google ([Better Auth](https://www.better-auth.com)).
- **Clínica:** cada usuário trabalha dentro da sua clínica, e os dados de uma clínica não são visíveis para outra.
- **Médicos:** especialidade, valor da consulta, dias da semana e horário de atendimento.
- **Pacientes:** cadastro e listagem.
- **Agendamentos:** só oferece horários dentro do expediente do médico e que ainda não estejam ocupados.
- **Dashboard:** faturamento, número de consultas, médicos e especialidades mais procurados, e os agendamentos do dia.
- **Planos** Free, Essencial e Profissional, com Stripe Checkout para assinar e o portal do cliente para trocar de plano ou cancelar.

## 💼 Planos

| | Free | Essencial | Profissional |
|---|---|---|---|
| Médicos | 1 | 3 | Ilimitados |
| Pacientes | 25 | Ilimitados | Ilimitados |
| Agendamentos por mês | 40 | Ilimitados | Ilimitados |

- **Limites:** os limites são verificados no servidor, ao cadastrar médicos, pacientes e agendamentos. Ficam em [`src/lib/plans.ts`](src/lib/plans.ts).
- **Preços:** o valor exibido de cada plano pago vem do próprio Stripe, então é sempre o mesmo cobrado no checkout.
- **No banco:** um usuário sem assinatura tem `plan` vazio e é tratado como Free.

## 🚀 Tecnologias

| Área | Ferramentas |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Banco de dados | PostgreSQL, Drizzle ORM |
| Autenticação | Better Auth |
| Pagamentos | Stripe |
| Interface | Tailwind CSS, shadcn/ui (Radix UI), React Hook Form, Zod |
| Dados no cliente | next-safe-action, TanStack Query, nuqs |
| Datas | dayjs, date-fns |
| Testes | Vitest |
| Deploy | Vercel |

---

## 🧑‍💻 Rodando localmente

**Pré-requisitos:** Node.js 20+ e um banco PostgreSQL.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com as variáveis abaixo.

   | Variável | Para quê |
   |---|---|
   | `DATABASE_URL` | Conexão com o PostgreSQL |
   | `BETTER_AUTH_SECRET` | Chave usada para assinar as sessões (gere uma string aleatória longa) |
   | `BETTER_AUTH_URL` | URL base da aplicação, por exemplo `http://localhost:3000` |
   | `NEXT_PUBLIC_APP_URL` | URL pública da aplicação, usada nos redirecionamentos do Stripe |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login com Google |
   | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chaves do Stripe (modo de testes) |
   | `STRIPE_ESSENTIAL_PLAN_PRICE_ID` | ID do preço mensal do plano Essencial no Stripe |
   | `STRIPE_PROFESSIONAL_PLAN_PRICE_ID` | ID do preço mensal do plano Profissional no Stripe |
   | `STRIPE_WEBHOOK_SECRET` | Segredo do webhook (veja a seção do Stripe abaixo) |
   | `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` | Link do portal do cliente do Stripe |

3. Crie as tabelas no banco:

   ```bash
   npx drizzle-kit migrate
   ```

4. Inicie o servidor de desenvolvimento e abra [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes com Vitest |
| `npx drizzle-kit studio` | Interface visual do banco |

### Stripe em ambiente local

Para receber os eventos de pagamento na sua máquina, use a [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

O comando `stripe listen` mostra um segredo `whsec_...`. Coloque esse valor em `STRIPE_WEBHOOK_SECRET` no `.env`.

---

## 🕒 Fuso horário

A clínica opera no fuso `America/Sao_Paulo`, mas o servidor pode estar em qualquer fuso (na Vercel, é UTC). Por isso:

- O horário de atendimento dos médicos e a data das consultas são **gravados em UTC**.
- Tudo o que é exibido ou escolhido na interface está **no horário da clínica**.
- As conversões ficam todas em [`src/helpers/time.ts`](src/helpers/time.ts). Use essas funções em vez de converter datas diretamente com `dayjs()` ou `new Date()`, que dependem do fuso de quem executa o código.

---

## 📋 Próximos passos

- [ ] Verificação de e-mail
- [ ] Autenticação em dois fatores
- [ ] Campo `status` nos agendamentos
- [ ] Usar o fuso da clínica também nos filtros de data do dashboard (hoje eles usam o fuso do servidor)
- [ ] Atualizar `better-auth` e `drizzle-orm`, que têm vulnerabilidades conhecidas
