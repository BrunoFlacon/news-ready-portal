import { Layout } from "@/components/Layout";

const TermsOfService = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-serif font-bold text-3xl text-foreground mb-2">Termos de Serviço</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 26 de março de 2026</p>

      <div className="space-y-6 text-foreground leading-relaxed">
        <section>
          <h2 className="font-serif font-bold text-xl mb-2">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o site Web Rádio Vitória, o usuário concorda com os termos e condições aqui estabelecidos. Caso não concorde com algum dos termos, recomendamos que não utilize o site.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">2. Descrição do Serviço</h2>
          <p>O Web Rádio Vitória é um portal de notícias e conteúdo informativo que oferece artigos, reportagens e informações sobre diversos temas, incluindo política, tecnologia, entretenimento e cultura.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">3. Uso do Site</h2>
          <p>O usuário se compromete a utilizar o site de forma ética e em conformidade com a legislação vigente, comprometendo-se a não:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Publicar ou transmitir conteúdo ilegal, difamatório ou ofensivo</li>
            <li>Utilizar o site para fins comerciais não autorizados</li>
            <li>Tentar acessar áreas restritas do sistema</li>
            <li>Reproduzir conteúdo sem autorização expressa</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">4. Propriedade Intelectual</h2>
          <p>Todo o conteúdo publicado no site, incluindo textos, imagens, logotipos e design, é protegido por direitos autorais e propriedade intelectual. A reprodução total ou parcial sem autorização prévia é proibida.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">5. Responsabilidades</h2>
          <p>O Web Rádio Vitória não se responsabiliza por:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Eventuais indisponibilidades temporárias do site</li>
            <li>Danos causados por vírus ou ataques cibernéticos</li>
            <li>Conteúdo de sites externos referenciados</li>
            <li>Decisões tomadas com base nas informações publicadas</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">6. Links Externos</h2>
          <p>O site pode conter links para sites de terceiros. O Web Rádio Vitória não se responsabiliza pelo conteúdo, políticas de privacidade ou práticas desses sites externos.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">7. Modificações dos Termos</h2>
          <p>O Web Rádio Vitória reserva-se o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site. O uso continuado após alterações constitui aceitação dos novos termos.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">8. Legislação Aplicável</h2>
          <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca da sede do Web Rádio Vitória.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">9. Contato</h2>
          <p>Para dúvidas sobre estes termos, entre em contato através da página de <a href="/contato" className="text-primary hover:underline">Contato</a>.</p>
        </section>
      </div>
    </div>
  </Layout>
);

export default TermsOfService;
