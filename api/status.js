const DB_ID = '42abf6e264884d67b45dc90ce425355c';

const STAGES = [
  { key: '🆕 Novo',             label: 'Briefing recebido',    desc: 'Seu briefing foi recebido e está na fila de análise.' },
  { key: '🔍 Em análise',       label: 'Em análise',           desc: 'Estamos analisando seu briefing para preparar o orçamento.' },
  { key: '📄 Proposta enviada', label: 'Proposta enviada',     desc: 'O orçamento foi preparado e enviado para você.' },
  { key: '✅ Aprovado',         label: 'Projeto aprovado',     desc: 'Projeto aprovado! Em breve entraremos em contato para o kick-off.' },
  { key: '🎬 Em produção',      label: 'Em produção',          desc: 'O projeto está sendo produzido pela equipe Tochi.' },
  { key: '📦 Entregue',         label: 'Entregue',             desc: 'Projeto concluído e entregue. Obrigado pela confiança!' },
];

export default async function handler(req, res) {
  const TOKEN = process.env.NOTION_TOKEN;
  const raw   = req.query.id || '';
  const num   = parseInt(raw.replace(/PROP-?/i, ''));
  if (!num) return res.status(400).send('<h1>ID inválido</h1>');

  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ filter: { property: 'N. Proposta', unique_id: { equals: num } } })
    });
    const data = await r.json();
    if (!r.ok || !data.results?.length) return res.status(404).send('<h1>Projeto não encontrado</h1>');

    const p     = data.results[0].properties;
    const uid   = p['N. Proposta']?.unique_id;
    const propId= uid?.number ? `PROP-${String(uid.number).padStart(3,'0')}` : '—';
    const nome  = p['Nome']?.title?.[0]?.text?.content || '—';
    const empresa = p['Empresa']?.rich_text?.[0]?.text?.content || '';
    const clientDisplay = empresa || nome;
    const status= p['Status']?.select?.name || '🆕 Novo';
    const servicos = (p['Serviços']?.multi_select || []).map(o => o.name).join(' · ') || '—';
    const prazo = p['Prazo']?.select?.name || '—';
    const isCancelled = status === '❌ Cancelado';

    const curIdx = STAGES.findIndex(s => s.key === status);
    const stageIdx = curIdx >= 0 ? curIdx : 0;
    const stage = STAGES[stageIdx] || STAGES[0];
    const pct = isCancelled ? 100 : Math.round((stageIdx / (STAGES.length - 1)) * 100);

    const prazoMap = {'Urgente até 2 dias':'Urgente (2 dias)', 'Padrão 10+ dias':'Padrão (10–15 dias)', 'Sem urgência':'Sem urgência definida'};

    const stepsHTML = STAGES.map((s, i) => {
      const done    = !isCancelled && i <= stageIdx;
      const current = !isCancelled && i === stageIdx;
      return `
      <div class="step ${done ? 'done' : ''} ${current ? 'current' : ''}">
        <div class="step-dot">
          ${done && !current ? `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : ''}
          ${current ? `<div class="step-pulse"></div>` : ''}
        </div>
        <div class="step-body">
          <div class="step-label">${s.label}</div>
          ${current ? `<div class="step-desc">${s.desc}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    const logoSVG = `<svg viewBox="315 320 450 437" xmlns="http://www.w3.org/2000/svg"><polygon fill="#f5f5f0" points="363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03"/><path fill="#f5f5f0" d="M480.75,330.63c-6.71-6.9-17.33-10.34-31.88-10.34s-25.09,3.44-31.6,10.34c-6.51,6.89-9.76,18-9.76,33.31v351.54c0,15.32,3.35,26.53,10.05,33.61,6.7,7.09,17.32,10.62,31.88,10.62s25.08-3.63,31.59-10.91c6.51-7.27,9.77-18.38,9.77-33.32v-351.54c0-15.31-3.36-26.42-10.05-33.31ZM458.06,728.12h-17.81v-376.24h17.81v376.24Z"/><path fill="#f5f5f0" d="M597.06,528.23v-164.29c0-15.31-3.35-26.42-10.05-33.31-6.7-6.9-17.33-10.34-31.88-10.34s-25.08,3.44-31.59,10.34c-6.52,6.89-9.77,18-9.77,33.31v345.8c0,17.62,3.25,30.35,9.77,38.2,6.51,7.85,17.23,11.77,32.17,11.77s25.07-3.92,31.59-11.77c6.51-7.85,9.76-20.58,9.76-38.2v-111.44h-32.74v129.82h-17.8v-376.24h17.8v176.35h32.74Z"/><path fill="#f5f5f0" d="M652.78,377.75v-57.46h-32.74v436.55h32.74v-346.87h17.81v346.87h32.74v-379.13l-50.55.04Z"/><path fill="#f5f5f0" d="M732.04,377.73v379.11h32.75v-379.11h-32.75Z"/><path fill="red" d="M668.26,320.29v42.5h96.53v-42.5h-96.53Z"/></svg>`;

    const accentColor = isCancelled ? '#888' : stageIdx >= 5 ? '#1a7a3c' : '#e01010';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tochi — Status ${propId}</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='315 320 450 437' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='800' fill='%230d0d0d'/%3E%3Cpolygon fill='%23f5f5f0' points='363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03'/%3E%3Cpath fill='red' d='M668.26,320.29v42.5h96.53v-42.5h-96.53Z'/%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="Status do projeto ${propId} · ${clientDisplay}">
<meta property="og:description" content="Acompanhe o andamento do seu projeto de pós-produção com a Tochi.">
<meta property="og:image" content="https://tochi-briefing.vercel.app/og.png">
<meta property="og:site_name" content="Tochi">
<meta name="theme-color" content="${accentColor}">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--black:#0d0d0d;--white:#f5f5f0;--red:${accentColor};--gray:#2a2a2a;--gray-light:#888}
body{background:var(--black);color:var(--white);font-family:'Barlow Condensed',sans-serif;min-height:100vh}
.page{max-width:640px;margin:0 auto;padding:0 2rem 6rem}
header{display:flex;justify-content:space-between;align-items:center;padding:2rem 0;border-bottom:1px solid var(--gray)}
.logo{width:40px}
.doc-meta{text-align:right;font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);line-height:1.8;letter-spacing:.04em}
.doc-meta span{color:var(--white)}
.hero{padding:4rem 0 3rem;border-bottom:1px solid var(--gray)}
.label{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--red);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
.label::before{content:'';display:inline-block;width:14px;height:2px;background:var(--red);flex-shrink:0}
.hero-title{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:.9;letter-spacing:-.02em;text-transform:uppercase;margin-bottom:1.5rem}
.hero-title em{font-style:normal;color:var(--red)}
.meta-row{display:flex;gap:2rem;flex-wrap:wrap;margin-top:1.5rem}
.meta-item{display:flex;flex-direction:column;gap:.25rem}
.meta-lbl{font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-light)}
.meta-val{font-size:.9rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.progress-section{padding:3rem 0;border-bottom:1px solid var(--gray)}
.progress-label{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gray-light);margin-bottom:1.5rem;display:flex;justify-content:space-between}
.progress-bar{height:3px;background:#1a1a1a;position:relative;margin-bottom:3rem}
.progress-fill{height:100%;background:var(--red);width:${pct}%;transition:width 1s ease}
.steps{display:flex;flex-direction:column;gap:0}
.step{display:flex;gap:1.25rem;padding:1.1rem 0;border-bottom:1px solid #111;align-items:flex-start}
.step:last-child{border-bottom:none}
.step-dot{width:20px;height:20px;border:1px solid #333;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;margin-top:.15rem}
.step.done .step-dot{border-color:var(--red);background:var(--red)}
.step.done .step-dot svg{width:12px;height:12px;fill:#fff}
.step.current .step-dot{border-color:var(--red)}
.step-pulse{width:8px;height:8px;background:var(--red);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
.step-body{flex:1}
.step-label{font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--gray-light)}
.step.done .step-label,.step.current .step-label{color:var(--white)}
.step-desc{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--gray-light);letter-spacing:.04em;line-height:1.6;margin-top:.35rem}
${isCancelled ? `.cancel-notice{padding:2rem;background:#1a1a1a;border:1px solid #333;border-left:3px solid #888;font-family:'DM Mono',monospace;font-size:.72rem;color:var(--gray-light);letter-spacing:.04em;line-height:1.65;margin:2rem 0}` : ''}
.contact{padding:3rem 0}
.contact-title{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gray-light);margin-bottom:1rem}
.contact-body{font-family:'DM Mono',monospace;font-size:.75rem;color:var(--gray-light);line-height:1.8}
.contact-body a{color:var(--red);text-decoration:none}
footer{border-top:1px solid var(--gray);padding:2rem 0 0;display:flex;justify-content:space-between;align-items:center}
.f-site{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--gray-light);letter-spacing:.06em}
.f-site span{color:var(--red)}
.accent-bar{height:3px;background:var(--red);width:100%;margin-top:2rem}
</style>
</head>
<body>
<div class="page">
  <header>
    <svg class="logo" viewBox="315 320 450 437" xmlns="http://www.w3.org/2000/svg">${logoSVG.replace(/<svg[^>]*>/,'').replace('</svg>','')}</svg>
    <div class="doc-meta">STATUS DO PROJETO &nbsp;·&nbsp; <span>${propId}</span></div>
  </header>

  <div class="hero">
    <div class="label">Acompanhamento</div>
    <h1 class="hero-title">${clientDisplay.split(' ')[0]}<br><em>${clientDisplay.split(' ').slice(1).join(' ') || '&nbsp;'}</em></h1>
    <div class="meta-row">
      <div class="meta-item"><div class="meta-lbl">Serviços</div><div class="meta-val">${servicos}</div></div>
      <div class="meta-item"><div class="meta-lbl">Prazo</div><div class="meta-val">${prazoMap[prazo]||prazo}</div></div>
    </div>
  </div>

  <div class="progress-section">
    <div class="progress-label">
      <span>${isCancelled ? '❌ Projeto cancelado' : stage.label}</span>
      <span>${isCancelled ? '' : `${pct}%`}</span>
    </div>
    ${!isCancelled ? `<div class="progress-bar"><div class="progress-fill"></div></div>` : ''}
    ${isCancelled ? `<div class="cancel-notice">Este projeto foi cancelado. Entre em contato pelo WhatsApp ou e-mail caso tenha dúvidas ou queira retomar.</div>` : ''}
    <div class="steps">${stepsHTML}</div>
  </div>

  <div class="contact">
    <div class="contact-title">Precisa de ajuda?</div>
    <div class="contact-body">
      Entre em contato pelo WhatsApp ou e-mail.<br>
      <a href="https://wa.me/5511966488535" target="_blank">WhatsApp → +55 11 96648-8535</a><br>
      <a href="mailto:eduardo@tochi.com.br">eduardo@tochi.com.br</a>
    </div>
  </div>

  <footer>
    <div class="f-site"><a href="https://tochi.com.br" style="color:inherit;text-decoration:none"><span>tochi</span>.com.br</a></div>
    <div style="font-family:'DM Mono',monospace;font-size:.65rem;color:#333;letter-spacing:.06em">${propId}</div>
  </footer>
  <div class="accent-bar"></div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);

  } catch (err) {
    return res.status(500).send(`<h1>Erro: ${err.message}</h1>`);
  }
}
