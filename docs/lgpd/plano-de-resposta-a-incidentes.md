# Plano de resposta a incidentes de segurança

Base: art. 48 da LGPD e Resolução CD/ANPD nº 15/2024. **Revise com um advogado.**

## 1. Responsáveis

Preencha numa cópia privada, fora deste repositório público.

| Papel | Quem |
|---|---|
| Coordenação e decisão de comunicar | _definir_ |
| Técnico (contenção e investigação) | _definir_ |
| Encarregado (DPO) | _definir_ |

## 2. O que é um incidente

Qualquer acesso não autorizado, vazamento, perda, alteração ou destruição de dados pessoais. Exemplos: credencial do banco exposta, conta de usuário invadida, falha que mostre dados de uma clínica a outra, backup perdido.

## 3. Passo a passo

1. **Conter (imediato):**
   - revogar credenciais expostas (`DATABASE_URL`, chaves do Stripe e do Resend, `BETTER_AUTH_SECRET`, `CRON_SECRET`);
   - encerrar sessões (`DELETE FROM sessions`);
   - tirar do ar a funcionalidade afetada.
2. **Registrar:** abrir um registro com data e hora da descoberta, quem descobriu e o que se sabe. Manter tudo atualizado: a ANPD pode pedir esse registro.
3. **Avaliar (até 24 h):**
   - quais dados, de quais clínicas e de quantos titulares;
   - se há dados sensíveis (agendamentos são);
   - risco de dano relevante (discriminação, fraude, exposição de saúde).
   A tabela `audit_logs` e os logs da Vercel ajudam a reconstruir o que aconteceu.
4. **Comunicar (em até 3 dias úteis, se houver risco ou dano relevante):**
   - à **ANPD**, pelo formulário de comunicação de incidente;
   - às **clínicas afetadas**, que são as controladoras dos dados de pacientes, para que comuniquem os seus titulares;
   - aos **titulares de contas** afetados, diretamente.
   A comunicação deve dizer: natureza dos dados, titulares envolvidos, medidas de segurança usadas, riscos, motivo de eventual demora e medidas tomadas para reverter ou reduzir os efeitos.
5. **Corrigir e revisar:** corrigir a causa, documentar o que mudou e atualizar este plano.

## 4. Registro de incidentes

Guarde, por pelo menos 5 anos, o registro de todo incidente, inclusive os que não foram comunicados, com o motivo da decisão.
