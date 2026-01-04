import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é rent na Solana?",
    answer: "Rent é uma taxa obrigatória que a Solana cobra para manter contas ativas na blockchain. Quando você cria uma conta de token SPL ou recebe um NFT, uma pequena quantidade de SOL (geralmente ~0.002 SOL) é reservada como rent. Essa quantia fica 'presa' até que você feche a conta."
  },
  {
    question: "Quais tipos de contas posso fechar?",
    answer: "Você pode fechar: 1) Contas de tokens SPL vazias (tokens que você já transferiu), 2) NFTs que você não quer mais (serão queimados), 3) Contas vazias sem nenhum propósito. Não fechamos contas que ainda possuem saldo ou que são necessárias para o funcionamento da sua wallet."
  },
  {
    question: "É seguro usar esta ferramenta?",
    answer: "Sim! Nunca solicitamos suas chaves privadas. Toda a operação é feita através de transações que você assina com sua própria wallet. Você tem controle total e pode revisar cada transação antes de aprovar. Somos 100% non-custodial."
  },
  {
    question: "Quanto custa usar o serviço?",
    answer: "Cobramos 5% sobre o total de SOL recuperado. Por exemplo, se você recuperar 0.1 SOL, a taxa será de 0.005 SOL. Essa taxa cobre os custos de desenvolvimento e manutenção da plataforma."
  },
  {
    question: "Posso reverter o fechamento de uma conta?",
    answer: "Não. O fechamento de contas é uma operação irreversível na blockchain Solana. Por isso, mostramos um aviso claro antes de você confirmar a transação. Tenha certeza de que deseja fechar as contas selecionadas."
  },
  {
    question: "Por que alguns NFTs aparecem como 'queimáveis'?",
    answer: "NFTs aparecem como queimáveis quando identificamos que são de coleções spam, airdrops indesejados, ou quando você explicitamente os selecionou para queimar. Ao queimar um NFT, você recupera o rent associado a ele."
  },
  {
    question: "Quanto tempo leva o processo?",
    answer: "O escaneamento leva alguns segundos. A transação de fechamento depende do número de contas selecionadas e do congestionamento da rede Solana, mas geralmente é processada em menos de 1 minuto."
  },
  {
    question: "Quais wallets são suportadas?",
    answer: "Suportamos as principais wallets Solana: Phantom, Solflare e Backpack. Outras wallets compatíveis com o padrão Solana Wallet Adapter também podem funcionar."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perguntas <span className="text-gradient">Frequentes</span>
            </h2>
            <p className="text-muted-foreground">
              Tire suas dúvidas sobre o SOL Reclaim.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass rounded-xl border-border/50 px-6 data-[state=open]:border-primary/30 transition-all duration-300"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
