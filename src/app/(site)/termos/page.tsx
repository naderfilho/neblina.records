import { STORE } from "@/lib/constants";

export const metadata = {
  title: "Termos de uso",
  description: "Termos e condições de uso da Neblina Records.",
};

const UPDATED = "agosto de 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Sobre a Neblina Records",
    body: [
      "A Neblina Records é uma loja de discos de vinil, CDs e raridades com curadoria. Este site apresenta o acervo, permite criar uma conta, favoritar itens, ouvir prévias e iniciar a compra pelo WhatsApp.",
      "Ao acessar e usar o site, você concorda com estes Termos de Uso. Se não concordar, por favor não utilize o site.",
    ],
  },
  {
    title: "2. Cadastro e conta",
    body: [
      "Para comprar, comentar ou favoritar, é necessário criar uma conta com informações verdadeiras e atualizadas (nome, contato e demais dados solicitados).",
      "Você é responsável por manter a confidencialidade da sua senha e por toda atividade realizada na sua conta. Avise-nos em caso de uso não autorizado.",
      "Podemos suspender ou encerrar contas que violem estes termos ou que apresentem dados falsos.",
    ],
  },
  {
    title: "3. Produtos, preços e disponibilidade",
    body: [
      "Cada disco é, em geral, uma peça única. As descrições de estado de conservação (padrão Goldmine) são feitas com cuidado, mas pequenas variações são naturais em itens usados.",
      "Preços e disponibilidade podem mudar sem aviso prévio. Um item exibido não garante disponibilidade até a confirmação da compra.",
      "Imagens e prévias de áudio são meramente ilustrativas do item.",
    ],
  },
  {
    title: "4. Compras e pagamento",
    body: [
      "A compra é concluída por atendimento direto, normalmente pelo WhatsApp. Os valores, formas de pagamento e condições são confirmados nesse contato.",
      "A reserva de um item só é garantida após a confirmação do pagamento, conforme combinado no atendimento.",
    ],
  },
  {
    title: "5. Cupons de desconto",
    body: [
      "Cupons divulgados pela loja podem ter regras e prazo de validade. O desconto é aplicado na finalização da compra, informando o cupom no atendimento.",
      "Cupons não são cumulativos com outras promoções, salvo indicação em contrário, e podem ser encerrados a qualquer momento.",
    ],
  },
  {
    title: "6. Entrega e frete",
    body: [
      "As condições de envio (prazo, transportadora e valor de frete) são combinadas no atendimento, de acordo com o endereço de entrega.",
      "Os prazos de transporte dependem da transportadora e não incluem eventuais atrasos alheios à loja.",
    ],
  },
  {
    title: "7. Trocas e devoluções",
    body: [
      "Conforme o Código de Defesa do Consumidor, compras feitas fora do estabelecimento físico podem ser devolvidas em até 7 (sete) dias corridos após o recebimento (direito de arrependimento).",
      "Para itens que cheguem com divergência relevante em relação à descrição, entre em contato conosco para avaliarmos a troca ou devolução.",
    ],
  },
  {
    title: "8. Venda do seu disco para a loja",
    body: [
      "Na página “Venda seu disco”, você pode enviar informações de um disco que deseja vender. O envio é apenas uma proposta: a loja avalia e retorna com um valor, sem qualquer obrigação de compra por parte de nenhum dos lados até um acordo.",
      "Ao enviar uma proposta, você declara ser o legítimo proprietário do item e que as informações e fotos enviadas são verdadeiras.",
    ],
  },
  {
    title: "9. Conteúdo, comentários e conduta",
    body: [
      "Ao comentar ou enviar conteúdo, você se compromete a não publicar material ilegal, ofensivo, que viole direitos de terceiros ou que seja spam.",
      "Podemos remover conteúdos e moderar comentários a nosso critério.",
    ],
  },
  {
    title: "10. Propriedade intelectual",
    body: [
      "A marca, o layout, os textos e os elementos visuais do site pertencem à Neblina Records ou a seus licenciadores e não podem ser copiados sem autorização.",
      "Capas, nomes de artistas e obras são de titularidade de seus respectivos donos e aparecem aqui apenas para identificar os itens do acervo.",
    ],
  },
  {
    title: "11. Privacidade e dados",
    body: [
      "Coletamos apenas os dados necessários para o funcionamento do site e para o atendimento (como nome, contato e preferências), tratados de acordo com a LGPD.",
      "Não vendemos seus dados. Você pode solicitar a correção ou exclusão dos seus dados pelos canais de contato.",
      "O site registra acessos de forma agregada e anônima (sem identificar você pessoalmente) apenas para fins estatísticos.",
    ],
  },
  {
    title: "12. Alterações destes termos",
    body: [
      "Podemos atualizar estes Termos a qualquer momento. A versão vigente é sempre a publicada nesta página, com a data de atualização indicada.",
    ],
  },
];

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand">Legal</p>
      <h1 className="font-display text-4xl leading-tight text-ink">Termos de uso</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: {UPDATED}.</p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 font-display text-xl text-ink">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mb-2 leading-relaxed text-muted">{p}</p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="mb-2 font-display text-xl text-ink">13. Contato</h2>
          <p className="leading-relaxed text-muted">
            Dúvidas sobre estes Termos? Fale com a gente pelo e-mail{" "}
            <a href={`mailto:${STORE.email}`} className="text-brand hover:underline">{STORE.email}</a>{" "}
            ou pelo WhatsApp informado no rodapé do site.
          </p>
        </section>
      </div>
    </div>
  );
}
