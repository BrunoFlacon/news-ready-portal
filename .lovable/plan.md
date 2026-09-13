# Unificação do portal Web Rádio Vitória

## Objetivo
Transformar o projeto em um portal jornalístico dark, coeso e profissional, com a Web Rádio Vitória integrada à experiência editorial. Todo o conteúdo atual será preservado; a mudança será de organização, apresentação, consistência e navegação.

## Direção aprovada
- Base visual dark, com carvão e superfícies escuras.
- Dourado como assinatura da rádio e vermelho como sinal de urgência editorial.
- Títulos em Libre Baskerville e interface em IBM Plex Sans.
- Estrutura magazine: notícias em primeiro plano e conteúdo institucional integrado em faixas editoriais.
- Composição baseada na direção “Professional editorial broadcast portal v4”.

## O que será feito

### 1. Sistema visual único
- Substituir os estilos concorrentes por tokens semânticos compartilhados para cores, tipografia, bordas, sombras e estados.
- Aplicar o mesmo padrão dark ao início, notícias, artigos, contato, páginas legais e página de erro.
- Remover cores diretas e estilos isolados, garantindo contraste, consistência e suporte responsivo.
- Padronizar botões, títulos, etiquetas, campos, cartões, links e estados interativos.

### 2. Cabeçalho, navegação e transmissão
- Criar um cabeçalho global único em todas as páginas, com marca, navegação, menu móvel e acesso à transmissão.
- Integrar o player existente ao cabeçalho e manter o estado seguro “Em breve” quando não houver URL de transmissão.
- Organizar a navegação em Início, Notícias, Política, Tecnologia, Entretenimento, Institucional e Contato.
- Criar um rodapé único com redes sociais, páginas legais, dados institucionais e identidade da rádio.

### 3. Nova página principal editorial
- Abrir com um grande banner rotativo de capa para manchetes, breaking news e lives, usando os artigos já existentes.
- Adicionar controles discretos de navegação, indicação do item ativo e chamadas para ler ou assistir.
- Posicionar programação e assuntos em alta na coluna lateral, sem inventar uma grade real de horários; usar somente conteúdo institucional já disponível ou rótulos genéricos claramente demonstrativos.
- Exibir a primeira seleção de cards jornalísticos ao lado da barra lateral.

### 4. Conteúdo social e audiovisual
- Criar uma seção conjunta com três Reels e três Stories, cada grupo com navegação horizontal discreta para ver mais.
- Usar capas visuais derivadas dos materiais existentes e estados de reprodução demonstrativos, sem afirmar que vídeos inexistentes estão ao vivo.
- Criar uma terceira seção com cards adicionais de notícias.
- Criar uma quarta seção horizontal para vídeos e cortes de lives, com capa, manchete, duração e controles laterais discretos.
- Garantir boa operação por toque no celular, teclado e leitores de tela.

### 5. Área institucional integrada
- Preservar história, proposta, serviços, valores, depoimentos, números, contato e redes sociais existentes.
- Reorganizar esse conteúdo em uma área institucional própria dentro do mesmo padrão editorial, acessível pela navegação.
- Evitar a repetição atual do formulário de contato na página principal e na página de contato: a página principal terá uma chamada institucional; o formulário completo continuará em Contato.
- Manter player, mapa alternativo, envio de contato, páginas legais e compartilhamento de artigos.

### 6. Portal, artigos e páginas auxiliares
- Atualizar a listagem de notícias para a mesma hierarquia visual da página principal, mantendo filtros e dados atuais.
- Melhorar a leitura dos artigos, informações de autoria, imagem e compartilhamento.
- Aplicar o layout unificado ao Contato, Política de Privacidade, Termos de Serviço e página 404.
- Corrigir o contraste insuficiente observado na página de contato.
- Manter as URLs públicas atuais exigidas para verificação de APIs.

### 7. Qualidade e validação
- Ajustar imagens com carregamento progressivo, dimensões estáveis e textos alternativos.
- Respeitar preferência por movimento reduzido e evitar mudanças de layout durante o carregamento.
- Atualizar os testes para navegação, filtros, player, carrosséis, conteúdo institucional e páginas legais.
- Validar em desktop e celular: menu, banner, rolagens horizontais, formulário, artigos, páginas legais e ausência de sobreposição.
- Revisar metadados, hierarquia de títulos e conteúdo público para SEO e aprovação de APIs.

## Estrutura resultante
```text
Cabeçalho global + player
└── Banner editorial: capas, breaking news e lives
    ├── Programação e assuntos em alta
    ├── Manchetes em cards
    ├── Reels + Stories
    ├── Mais notícias
    ├── Vídeos e cortes de lives
    └── Faixa institucional da Web Rádio Vitória
Rodapé global
```

## Observações
- Nenhuma integração externa nova será criada nesta etapa.
- Reels, Stories e cortes usarão conteúdo demonstrativo e capas existentes até que arquivos ou links reais sejam fornecidos.
- A configuração real de transmissão e envio de mensagens continuará dependendo dos endereços externos já previstos no projeto.
