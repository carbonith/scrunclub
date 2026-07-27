// Netlify Function: recebe inscrições e repassa ao Google Sheets / Zapier / Make.
// Env vars necessárias: SHEETS_WEBHOOK_URL
// Env vars opcionais:  RECAPTCHA_SECRET, WEBHOOK_TOKEN

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

const reply = (status, body) => ({ statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) });
const digits = (s) => String(s || '').replace(/\D+/g, '');
const clean = (s, max = 500) => String(s || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'method_not_allowed' });

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'invalid_json' });
  }

  // honeypot (defesa em profundidade — o front já barra)
  if (data._gotcha) return reply(200, { ok: true });

  const nome = clean(data.nome, 120);
  const telefone = digits(data.telefone);

  if (nome.length < 2) return reply(422, { error: 'nome_invalido' });
  if (telefone.length < 10 || telefone.length > 13) return reply(422, { error: 'telefone_invalido' });
  if (data.consentimento !== true) return reply(422, { error: 'consentimento_obrigatorio' });

  // reCAPTCHA v3 (só valida se o segredo estiver configurado)
  if (process.env.RECAPTCHA_SECRET) {
    try {
      const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: data.token || '' })
      });
      const v = await r.json();
      if (!v.success || (typeof v.score === 'number' && v.score < 0.4)) {
        return reply(429, { error: 'suspeita_de_bot' });
      }
    } catch {
      // se o serviço falhar, não bloqueia a inscrição legítima
    }
  }

  const registro = {
    nome,
    telefone,
    nivel: clean(data.nivel, 60),
    servico: clean(data.servico, 80),
    unidade: clean(data.unidade, 120),
    observacoes: clean(data.observacoes, 1000),
    tipo: clean(data.tipo, 30) || 'reserva',
    consentimento: 'sim',
    origem: clean(data.origem, 80),
    enviadoEm: new Date().toISOString(),
    ip: clean(event.headers['x-nf-client-connection-ip'] || '', 45)
  };

  const hook = process.env.SHEETS_WEBHOOK_URL;
  if (!hook) {
    console.error('SHEETS_WEBHOOK_URL não configurada. Registro perdido:', registro.nome);
    return reply(500, { error: 'webhook_nao_configurado' });
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.WEBHOOK_TOKEN) headers['Authorization'] = 'Bearer ' + process.env.WEBHOOK_TOKEN;

    const res = await fetch(hook, { method: 'POST', headers, body: JSON.stringify(registro) });
    if (!res.ok) throw new Error('webhook HTTP ' + res.status);

    return reply(200, { ok: true });
  } catch (err) {
    console.error('Falha ao repassar inscrição:', err.message, registro.nome);
    return reply(502, { error: 'falha_no_envio' });
  }
};
