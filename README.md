# SC Run Club — link-in-bio

Landing page de conversão do SC Run Club (Santo Amaro da Imperatriz).
Site estático + uma Netlify Function. Sem build, sem framework, sem dependências.

**Produção:** https://scrunclub.netlify.app

---

## Estrutura

    index.html              markup + CSS crítico inline
    privacidade.html        política de privacidade (LGPD)
    styles.css              tokens de design e componentes
    app.js                  render dos cards, modais, formulário, GA4
    _data/content.json      TODO o conteúdo editável
    assets/                 logo e imagens otimizadas
    netlify/functions/
      inscricao.js          valida e repassa inscrições ao Google Sheets
    netlify.toml            headers, cache, redirects curtos

---

## Deploy

1. No Netlify, abra o projeto **scrunclub** e vá em **Project configuration → Build & deploy → Link repository**.
2. Escolha GitHub e selecione **carbonith/scrunclub**, branch **main**.
3. Build command: deixe vazio. Publish directory: a raiz. Functions directory: netlify/functions.
4. Configure as variáveis de ambiente listadas abaixo.
5. Pronto: cada commit na branch main publica o site automaticamente.

### Variáveis de ambiente

| Nome | Obrigatória | Para quê |
|---|---|---|
| SHEETS_WEBHOOK_URL | sim | endpoint que grava na planilha (Apps Script, Zapier ou Make) |
| WEBHOOK_TOKEN | não | token Bearer para autenticar no webhook |
| RECAPTCHA_SECRET | não | ativa a validação reCAPTCHA v3 no servidor |

---

## Como editar o conteúdo

**Tudo** — textos, links, cards, microcopy — está em **_data/content.json**.
Não é necessário mexer em HTML, CSS ou JS para o dia a dia.

- **Horário ou endereço:** objeto *encontro* (hoje: todos os sábados, 07:30, Rua Salete Broering Becker).
- **Faixa de destaque do topo:** objeto *destaque*. Use "ativo": false para esconder.
- **Adicionar ou remover card:** inclua um item no array *cards*. O campo *tipo* aceita:
  - "link" abre a URL do campo *href* em nova aba;
  - "modal" abre o modal indicado em *modal* (guia, programas, unidades, comunidade);
  - "form" abre o formulário. Use "formVariante": "parceria" para a versão de franquia.
- **Logo:** substitua **assets/logo.svg**. Para o ícone de app, adicione assets/logo-512.png.
- **Imagens dos cards:** exporte em .webp, 112x112 px, e aponte no campo *icone*.
- **Hero:** preencha *perfil.hero* com o caminho da imagem. Deixe vazio para esconder.

Links já configurados: Instagram @sc.runclub, clube 2201431 no Strava e o grupo do WhatsApp.

**Ainda pendente:** trocar TROCAR_EMAIL (e-mail de contato, aparece no footer e na política de privacidade) e G-TROCAR (ID do Google Analytics 4).

### Opção de CMS

O projeto está preparado para edição direta pelo GitHub, que é o caminho mais simples.
Se quiserem interface visual, adicione o Decap CMS (ex-Netlify CMS) em /admin apontando para _data/content.json — nada no front precisa mudar.

---

## Formulário para Google Sheets

Caminho recomendado, grátis e sem Zapier:

1. Crie uma planilha com uma aba chamada **Inscricoes** e o cabeçalho: enviadoEm, nome, telefone, nivel, servico, unidade, observacoes, tipo, consentimento, origem.
2. Vá em **Extensões → Apps Script** e cole:

       function doPost(e) {
         var d = JSON.parse(e.postData.contents);
         var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inscricoes");
         sh.appendRow([d.enviadoEm, d.nome, "'" + d.telefone, d.nivel, d.servico,
                       d.unidade, d.observacoes, d.tipo, d.consentimento, d.origem]);
         return ContentService.createTextOutput(JSON.stringify({ok: true}))
           .setMimeType(ContentService.MimeType.JSON);
       }

3. **Implantar → Nova implantação → App da Web**, executar como você, acesso para qualquer pessoa.
4. Copie a URL gerada e coloque em SHEETS_WEBHOOK_URL no Netlify.

Alternativa: crie um webhook no Zapier ou no Make e use aquela URL na mesma variável. A function não muda.

### Anti-spam

Honeypot (campo _gotcha) validado no front e no back. Para ligar o reCAPTCHA v3, descomente o script no fim do index.html, troque SUA_SITE_KEY em index.html e app.js, e defina RECAPTCHA_SECRET.

---

## Analytics

Coloque o ID em *analytics.ga4* no JSON. O app.js injeta o gtag sozinho, com IP anonimizado.

Eventos personalizados: click_card, send_form, form_error, click_whatsapp, click_strava, click_social, click_maps, click_instagram, click_horario.

No GA4, marque **send_form** e **click_whatsapp** como conversões.

---

## Atalhos curtos

O netlify.toml cria redirects prontos para usar na bio e nos stories:

    scrunclub.netlify.app/whatsapp
    scrunclub.netlify.app/strava
    scrunclub.netlify.app/instagram

---

## Acessibilidade e performance

Contraste AA no par dourado sobre preto, foco visível em todos os interativos, modal com aria-modal, focus trap e fechamento por Esc, labels associados a todos os campos, mensagens de retorno com role de status e respeito a prefers-reduced-motion.

CSS crítico inline, fontes carregadas de forma assíncrona, imagens com lazy loading, JS único com defer e nenhuma biblioteca externa.

---

## Notas de estratégia

O clube funciona como topo de funil: o encontro semanal gratuito é a porta de entrada, e a retenção acontece no WhatsApp e no Strava. Por isso o CTA principal é "quero participar", que abre conversa, e não venda direta — os serviços pagos aparecem em cards próprios, deliberadamente fora do fluxo do primeiro contato.

Vale montar um onboarding de três mensagens após a inscrição: boas-vindas com o essencial do primeiro dia, uma dica prática no meio da semana e o convite explícito para o segundo encontro. A métrica que importa não é volume de inscrições, e sim taxa de retorno ao segundo e terceiro sábado. Se ela cair, o problema está na experiência do encontro, não na página.

---

## Ainda falta enviar

- Logo final em SVG e PNG 512x512 (hoje há um logo provisório em assets/logo.svg).
- Fotos do grupo para hero, cards e imagem de compartilhamento (assets/og.webp, 1200x630).
- E-mail oficial de contato.
- ID da propriedade GA4.
- Definição sobre usar ou não pixel da Meta.
