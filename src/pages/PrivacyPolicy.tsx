import { Layout } from "@/components/Layout";

const PrivacyPolicy = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-serif font-bold text-3xl text-foreground mb-2">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 26 de março de 2026</p>

      <div className="space-y-6 text-foreground leading-relaxed">
        <section>
          <h2 className="font-serif font-bold text-xl mb-2">1. Informações Gerais</h2>
          <p>A presente Política de Privacidade contém informações sobre coleta, uso, armazenamento, tratamento e proteção dos dados pessoais dos usuários e visitantes do site Web Rádio Vitória, com a finalidade de demonstrar absoluta transparência quanto ao assunto e esclarecer a todos interessados sobre os tipos de dados que são coletados, os motivos da coleta e a forma como os usuários podem gerenciar ou excluir as suas informações pessoais.</p>
          <p className="mt-2">Esta política aplica-se a todos os usuários e visitantes do site e integra os Termos e Condições Gerais de Uso.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">2. Dados Coletados</h2>
          <p>Os dados pessoais coletados podem incluir, mas não se limitam a:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Nome completo</li>
            <li>Endereço de e-mail</li>
            <li>Dados de navegação e acesso</li>
            <li>Endereço IP</li>
            <li>Informações do dispositivo utilizado para acesso</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">3. Finalidade do Tratamento</h2>
          <p>Os dados pessoais do usuário e do visitante coletados e armazenados pelo site têm por finalidade:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Bem-estar do usuário: melhorar o produto e/ou serviço oferecido</li>
            <li>Melhorias da plataforma: aprimorar o funcionamento do site</li>
            <li>Estatísticas: elaborar estatísticas gerais, sem identificação pessoal</li>
            <li>Comunicação: enviar informações relevantes ao usuário (mediante consentimento)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">4. Compartilhamento de Dados</h2>
          <p>Os dados pessoais não serão compartilhados com terceiros sem o consentimento do usuário, exceto nas hipóteses previstas em lei, incluindo cumprimento de obrigação legal ou regulatória, execução de contrato, e proteção do crédito.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">5. Segurança dos Dados</h2>
          <p>O site se compromete a aplicar as medidas técnicas e organizativas aptas a proteger os dados pessoais de acessos não autorizados e de situações de destruição, perda, alteração, comunicação ou difusão de tais dados.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">6. Cookies</h2>
          <p>O site utiliza cookies para melhorar a experiência de navegação. Cookies são pequenos arquivos de texto armazenados no dispositivo do usuário. O usuário pode configurar seu navegador para recusar cookies, embora isso possa afetar a funcionalidade do site.</p>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">7. Direitos do Usuário (LGPD / GDPR)</h2>
          <p>O usuário pode exercer os seguintes direitos a qualquer momento:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos dados pessoais</li>
            <li>Correção de dados incompletos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados</li>
            <li>Portabilidade dos dados</li>
            <li>Eliminação dos dados tratados com consentimento</li>
            <li>Revogação do consentimento</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif font-bold text-xl mb-2">8. Contato</h2>
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato através da página de <a href="/contato" className="text-primary hover:underline">Contato</a>.</p>
        </section>
      </div>
    </div>
  </Layout>
);

export default PrivacyPolicy;
