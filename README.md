# 🩺 Doutor Agenda

Aplicação web desenvolvida com [Next.js](https://nextjs.org) para gerenciamento de agendamentos médicos.

🔗 **Acesse a aplicação online:**
👉 [https://doutor-agenda-gold.vercel.app](https://doutor-agenda-gold.vercel.app)

---

## ⚠️ Atenção para Testes de Pagamento

> 💳 **Durante a assinatura, utilize o cartão de teste do Stripe:**
> Número do cartão: `4242 4242 4242 4242`
> Expiração, CVC e CEP podem ser preenchidos com qualquer valor válido.

⚠️ **Não insira dados reais de cartão de crédito.** Esse ambiente é exclusivo para testes.

---

## 🚀 Tecnologias Utilizadas

* **Next.js** (App Router)
* **TypeScript**
* **Drizzle ORM**
* **PostgreSQL**
* **Stripe (pagamentos)**
* **Radix UI / Tailwind CSS**
* **Deploy via Vercel**

---

## 🧑‍💻 Como rodar localmente

Clone o projeto e instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para visualizar.

---

## 💳 Integração com Stripe (Testes Locais)

1. Faça login no Stripe:

```bash
stripe login
```

2. Inicie o listener de Webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Atualize a variável de ambiente `.env` com o valor de `STRIPE_WEBHOOK_SECRET`.

---

## 🛠️ Ferramentas do Projeto

* **Fontes otimizadas com** [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) (Geist da Vercel)
* **Painel visual do banco com Drizzle Studio**:

```bash
npx drizzle-kit studio
```

---

## 📋 TODO

* Implementar verificação de e-mail
* Implementar verificação de dois fatores
* Adicionar campo `status` na tabela de agendamentos (`appointments`)
* Buscar por outros TODO's ao longo do projeto

---

## 📚 Aprenda Mais

* [Documentação do Next.js](https://nextjs.org/docs)
* [Tutorial interativo do Next.js](https://nextjs.org/learn)
* [Repositório oficial no GitHub](https://github.com/vercel/next.js)