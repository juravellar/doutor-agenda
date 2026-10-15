import type { Metadata } from "next";
import Link from "next/link";

import { ContactEmail, LegalDocument } from "../_components/legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso | Avelliq",
};

export default function TermsOfUsePage() {
  return (
    <LegalDocument title="Termos de Uso">
      <p>
        Estes termos regem o uso do Avelliq, sistema de agendamento para
        clínicas. Ao criar uma conta ou continuar usando o serviço, você
        concorda com eles e com a{" "}
        <Link href="/privacidade" className="underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Avelliq permite cadastrar clínicas, médicos, pacientes e agendamentos
        e acompanhar o faturamento. O serviço é oferecido como está, e pode
        mudar ou ganhar recursos com o tempo.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Informe dados verdadeiros e mantenha sua senha em sigilo.</li>
        <li>
          Você responde pelo que for feito com a sua conta. Se suspeitar de
          acesso indevido, troque a senha e avise o suporte.
        </li>
      </ul>

      <h2>3. Dados de pacientes: responsabilidade da clínica</h2>
      <p>
        A clínica é a controladora dos dados que cadastra no Avelliq, e o
        Avelliq atua como operador (LGPD, arts. 5º, VI e VII, e 39). Ao usar o
        serviço, a clínica se compromete a:
      </p>
      <ul>
        <li>
          ter base legal para tratar os dados dos pacientes e informá-los sobre
          esse tratamento;
        </li>
        <li>cadastrar apenas os dados necessários ao agendamento;</li>
        <li>
          atender aos pedidos dos pacientes sobre os próprios dados, com o apoio
          das ferramentas do sistema;
        </li>
        <li>dar acesso à conta apenas a quem precisa dele para trabalhar.</li>
      </ul>
      <p>
        O Avelliq trata esses dados somente para prestar o serviço, conforme as
        instruções da clínica, e não os usa para nenhuma finalidade própria.
      </p>

      <h2>4. Planos e pagamento</h2>
      <ul>
        <li>
          Toda conta começa no plano Free, gratuito por 3 meses a partir da
          primeira clínica. Depois disso, a conta fica só leitura: os dados
          continuam visíveis, mas cadastrar e editar exige um plano pago.
        </li>
        <li>
          Os planos pagos são cobrados mensalmente pelo Stripe, com os limites
          descritos na página de assinatura. A assinatura pode ser cancelada a
          qualquer momento e vale até o fim do período já pago.
        </li>
      </ul>

      <h2>5. Uso aceitável</h2>
      <p>
        Não é permitido usar o Avelliq para atividades ilegais, tentar acessar
        dados de outras clínicas, sobrecarregar o serviço ou contornar os
        limites do plano. Contas que violarem estes termos podem ser suspensas.
      </p>

      <h2>6. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em{" "}
        <Link href="/account" className="underline">
          Minha conta
        </Link>
        , depois de baixar uma cópia dos dados, se quiser. A exclusão apaga
        definitivamente a conta e as clínicas que só você administra, com seus
        médicos, pacientes e agendamentos, e cancela a assinatura.
      </p>

      <h2>7. Responsabilidade</h2>
      <p>
        Trabalhamos para manter o serviço disponível e seguro, mas não
        garantimos funcionamento ininterrupto. O Avelliq não responde por
        decisões clínicas nem por dados cadastrados incorretamente pelos
        usuários.
      </p>

      <h2>8. Alterações e legislação</h2>
      <p>
        Quando estes termos mudarem, a nova versão será publicada nesta página e
        você será avisado no aplicativo para aceitá-la. Estes termos seguem a
        legislação brasileira.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <ContactEmail />.
      </p>
    </LegalDocument>
  );
}
