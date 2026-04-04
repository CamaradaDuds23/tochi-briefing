const DB_ID = '42abf6e264884d67b45dc90ce425355c';

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
    if (!r.ok || !data.results?.length) return res.status(404).send('<h1>Briefing não encontrado</h1>');

    const p   = data.results[0].properties;
    const txt = k => p[k]?.rich_text?.[0]?.text?.content || '';
    const sel = k => p[k]?.select?.name || '';
    const ms  = k => (p[k]?.multi_select || []).map(o => o.name);
    const num2= k => p[k]?.number ?? null;
    const uid = p['N. Proposta']?.unique_id;
    const propId = uid?.number ? `PROP-${String(uid.number).padStart(3,'0')}` : '—';
    const nome   = p['Nome']?.title?.[0]?.text?.content || '—';
    const empresa= txt('Empresa');
    const wa     = p['WhatsApp']?.phone_number || '—';
    const email  = p['Email']?.email || '—';
    const desc   = txt('Descrição');
    const briefLink = p['Brief Link']?.url || '';
    const prazo  = sel('Prazo') || '—';
    const servicos = ms('Serviços');
    const estimativa = num2('Estimativa');
    const fmt = n => n != null ? `R$\u00a0${n.toLocaleString('pt-BR')}` : '—';
    const today = new Date().toLocaleDateString('pt-BR');

    // Blocks
    const blocks = [];

    // Edição
    const formato = sel('Formato');
    const servicosEd = ms('Serviços Ed');
    const material = ms('Material Ed');
    const durH = sel('Duração H');
    const durV = sel('Duração V');
    const qtyH = num2('Qty H');
    const qtyV = num2('Qty V');
    const obsEd = txt('Obs Edição');
    if (servicos.includes('Edição de Vídeo')) {
      const qty = formato === 'Ambos' ? `${qtyH||0} horizontal${(qtyH||0)!==1?'is':''} + ${qtyV||0} vertical${(qtyV||0)!==1?'is':''}` : `${(qtyH||qtyV||1)} vídeo${(qtyH||qtyV||1)!==1?'s':''}`;
      blocks.push({ title: '✂️ Edição de Vídeo', rows: [
        ['Formato', formato || '—'],
        ['Quantidade', qty],
        ...(durH ? [['Duração horizontal', durH]] : []),
        ...(durV ? [['Duração vertical', durV]] : []),
        ...(servicosEd.length ? [['Serviços', servicosEd.join(', ')]] : []),
        ...(material.length ? [['Material disponível', material.join(', ')]] : []),
        ...(obsEd ? [['Observações', obsEd]] : []),
      ]});
    }

    // Motion
    const tiposMotion = ms('Tipos Motion');
    const complexMo = ms('Complexidade Mo');
    const durMo = sel('Duração Motion');
    const qtyMo = num2('Qty Motion');
    const assetsMo = ms('Assets Mo');
    const obsMo = txt('Obs Motion');
    if (servicos.includes('Motion Design')) {
      blocks.push({ title: '🎨 Motion Design', rows: [
        ...(tiposMotion.length ? [['Tipos', tiposMotion.join(', ')]] : []),
        ...(durMo ? [['Duração', durMo]] : []),
        ...(qtyMo != null ? [['Quantidade', `${qtyMo} entregável${qtyMo!==1?'s':''}`]] : []),
        ...(complexMo.length ? [['Complexidade', complexMo.join(', ')]] : []),
        ...(assetsMo.length ? [['Assets disponíveis', assetsMo.join(', ')]] : []),
        ...(obsMo ? [['Observações', obsMo]] : []),
      ]});
    }

    // IA
    const servicosIA = ms('Serviços IA');
    const minVideo = num2('Qty Min Vídeo');
    const minAudio = num2('Qty Min Áudio');
    const obsIA = txt('Obs IA');
    if (servicos.includes('Produção com IA') && servicosIA.length) {
      blocks.push({ title: '🤖 Produção com IA', rows: [
        ['Serviços', servicosIA.join(', ')],
        ...(minVideo != null ? [['Duração vídeo', `${minVideo} min`]] : []),
        ...(minAudio != null ? [['Duração narração', `${minAudio} min`]] : []),
        ...(obsIA ? [['Observações', obsIA]] : []),
      ]});
    }

    const refs = txt('Referências');
    const obs  = txt('Observações');

    const blockHTML = blocks.map(b => `
      <div class="section">
        <div class="section-header">
          <span class="section-title">${b.title}</span>
        </div>
        <div class="rows-list">
          ${b.rows.map(([k,v]) => `
            <div class="row-item">
              <div class="row-key">${k}</div>
              <div class="row-val">${v}</div>
            </div>`).join('')}
        </div>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tochi — Briefing ${propId} · ${clientDisplay}</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='315 320 450 437' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='800' fill='%230d0d0d'/%3E%3Cpolygon fill='%23f5f5f0' points='363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03'/%3E%3Cpath fill='red' d='M668.26,320.29v42.5h96.53v-42.5h-96.53Z'/%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="Briefing ${propId} · ${clientDisplay}">
<meta property="og:description" content="Briefing de projeto · ${servicos}">
<!-- og:image será adicionado quando o banner estiver pronto -->
<meta property="og:site_name" content="Tochi">
<meta name="theme-color" content="#0d0d0d">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
:root{--black:#0d0d0d;--white:#f5f5f0;--red:#e01010;--gray:#2a2a2a;--gray-mid:#444;--gray-light:#888}
body{background:var(--black);color:var(--white);font-family:'Barlow Condensed',sans-serif;min-height:100vh}
.page{max-width:900px;margin:0 auto;padding:0 2rem 6rem}
.print-btn{position:fixed;bottom:2rem;right:2rem;z-index:100;display:flex;align-items:center;gap:.5rem;background:var(--gray);border:1px solid #444;color:var(--gray-light);font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:.6rem 1rem;cursor:pointer;transition:border-color .15s,color .15s}
.print-btn:hover{border-color:var(--white);color:var(--white)}
.print-btn svg{width:13px;height:13px;fill:currentColor}
@media print{.print-btn{display:none!important}body{background:var(--black)!important}.page{padding:0 1.5rem 2rem;max-width:100%}.section{page-break-inside:avoid}}
header{display:flex;justify-content:space-between;align-items:center;padding:2rem 0;border-bottom:1px solid var(--gray)}
.logo-lg{display:block;width:52px}
.doc-meta{text-align:right;font-family:'DM Mono',monospace;font-size:.72rem;color:var(--gray-light);line-height:1.8;letter-spacing:.04em}
.doc-meta span{color:var(--white)}
.hero{padding:4rem 0 3.5rem;border-bottom:1px solid var(--gray)}
.label{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--red);margin-bottom:1rem;display:flex;align-items:center;gap:.6rem}
.label::before{content:'';display:inline-block;width:18px;height:2px;background:var(--red);flex-shrink:0}
.hero-title{font-size:clamp(3rem,8vw,6rem);font-weight:900;line-height:.92;letter-spacing:-.01em;text-transform:uppercase;margin-bottom:2rem}
.hero-title em{font-style:normal;color:var(--red)}
.client-tag{display:inline-flex;align-items:center;gap:.75rem;background:var(--gray);border:1px solid #333;padding:.5rem 1rem;font-size:.9rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-light)}
.client-tag strong{color:var(--white)}
.id-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--gray);border:1px solid var(--gray);margin-top:2.5rem}
.id-cell{background:var(--black);padding:1.25rem 1.5rem}
.id-label{font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-light);margin-bottom:.35rem}
.id-value{font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.02em;word-break:break-all}
.id-value a{color:var(--red);text-decoration:none}
.section{padding:3rem 0;border-bottom:1px solid var(--gray)}
.section-header{margin-bottom:2rem}
.section-title{font-size:.72rem;font-family:'DM Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gray-light)}
.rows-list{display:flex;flex-direction:column}
.row-item{display:grid;grid-template-columns:200px 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid #1a1a1a;align-items:start}
.row-item:last-child{border-bottom:none}
.row-key{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--gray-light);letter-spacing:.06em;text-transform:uppercase;padding-top:.1rem}
.row-val{font-size:1rem;font-weight:600;text-transform:uppercase;letter-spacing:.02em;line-height:1.5}
.row-val.low{text-transform:none;font-weight:400;font-family:'DM Mono',monospace;font-size:.82rem;letter-spacing:.02em;color:var(--white)}
.section-desc{font-family:'DM Mono',monospace;font-size:.82rem;color:var(--gray-light);line-height:1.75;letter-spacing:.02em}
.est-block{display:flex;align-items:flex-end;gap:1rem;padding:3rem 0;border-bottom:1px solid var(--gray)}
.est-currency{font-size:2rem;font-weight:300;color:var(--gray-light);line-height:1;margin-bottom:.5rem}
.est-value{font-size:clamp(4rem,10vw,7rem);font-weight:900;line-height:.9;letter-spacing:-.03em}
.est-note{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--gray-light);letter-spacing:.06em;margin-left:1rem;margin-bottom:.5rem}
footer{padding:3rem 0 0;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:2rem}
.footer-site{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);letter-spacing:.08em}
.footer-site span{color:var(--red)}
.footer-contact{text-align:right;font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);line-height:2;letter-spacing:.04em}
.footer-contact strong{color:var(--white);font-weight:500}
.accent-bar{height:4px;background:var(--red);width:100%;margin-top:3rem}
@media(max-width:620px){.id-grid{grid-template-columns:1fr}.hero-title{font-size:3rem}.row-item{grid-template-columns:1fr;gap:.25rem}footer{flex-direction:column}.footer-contact{text-align:left}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">
  <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
  Salvar PDF
</button>
<div class="page">
  <header>
    <svg class="logo-lg" viewBox="315 320 450 437" xmlns="http://www.w3.org/2000/svg">
      <polygon fill="#f5f5f0" points="363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03"/>
      <path fill="#f5f5f0" d="M480.75,330.63c-6.71-6.9-17.33-10.34-31.88-10.34s-25.09,3.44-31.6,10.34c-6.51,6.89-9.76,18-9.76,33.31v351.54c0,15.32,3.35,26.53,10.05,33.61,6.7,7.09,17.32,10.62,31.88,10.62s25.08-3.63,31.59-10.91c6.51-7.27,9.77-18.38,9.77-33.32v-351.54c0-15.31-3.36-26.42-10.05-33.31ZM458.06,728.12h-17.81v-376.24h17.81v376.24Z"/>
      <path fill="#f5f5f0" d="M597.06,528.23v-164.29c0-15.31-3.35-26.42-10.05-33.31-6.7-6.9-17.33-10.34-31.88-10.34s-25.08,3.44-31.59,10.34c-6.52,6.89-9.77,18-9.77,33.31v345.8c0,17.62,3.25,30.35,9.77,38.2,6.51,7.85,17.23,11.77,32.17,11.77s25.07-3.92,31.59-11.77c6.51-7.85,9.76-20.58,9.76-38.2v-111.44h-32.74v129.82h-17.8v-376.24h17.8v176.35h32.74Z"/>
      <path fill="#f5f5f0" d="M652.78,377.75v-57.46h-32.74v436.55h32.74v-346.87h17.81v346.87h32.74v-379.13l-50.55.04Z"/>
      <path fill="#f5f5f0" d="M732.04,377.73v379.11h32.75v-379.11h-32.75Z"/>
      <path fill="red" d="M668.26,320.29v42.5h96.53v-42.5h-96.53Z"/>
    </svg>
    <div class="doc-meta">BRIEFING DE PROJETO &nbsp;·&nbsp; <span>${propId}</span><br>DATA <span>${today}</span><br>tochi.com.br</div>
  </header>

  <div class="hero">
    <div class="label">Briefing recebido</div>
    <h1 class="hero-title">${clientDisplay.split(' ')[0]}<br><em>${clientDisplay.split(' ').slice(1).join(' ') || '&nbsp;'}</em></h1>
    <div class="client-tag">Cliente &nbsp;<strong>${clientDisplay}${clientDisplay !== nome ? ' · ' + nome : ''}</strong></div>
    <div class="id-grid">
      <div class="id-cell"><div class="id-label">WhatsApp</div><div class="id-value">${wa}</div></div>
      <div class="id-cell"><div class="id-label">E-mail</div><div class="id-value">${email}</div></div>
      <div class="id-cell"><div class="id-label">Serviços solicitados</div><div class="id-value">${servicos.join(' · ') || '—'}</div></div>
      <div class="id-cell"><div class="id-label">Prazo</div><div class="id-value">${prazo}</div></div>
    </div>
  </div>

  ${desc ? `
  <div class="section">
    <div class="section-header"><span class="section-title">Descrição do projeto</span></div>
    <p class="section-desc">${desc}</p>
    ${briefLink ? `<p style="margin-top:1.25rem;font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.06em"><a href="${briefLink}" style="color:var(--red);text-decoration:none" target="_blank">Ver briefing completo →</a></p>` : ''}
  </div>` : ''}

  ${blockHTML}

  ${refs ? `
  <div class="section">
    <div class="section-header"><span class="section-title">Referências</span></div>
    <div class="rows-list">
      ${refs.split('\n').filter(Boolean).map((r,i) => `
        <div class="row-item">
          <div class="row-key">Link ${i+1}</div>
          <div class="row-val low"><a href="${r}" style="color:var(--red);text-decoration:none" target="_blank">${r}</a></div>
        </div>`).join('')}
    </div>
  </div>` : ''}

  ${obs ? `
  <div class="section">
    <div class="section-header"><span class="section-title">Observações gerais</span></div>
    <p class="section-desc">${obs}</p>
  </div>` : ''}

  ${estimativa != null ? `
  <div class="est-block">
    <div class="est-currency">R$</div>
    <div class="est-value">${String(estimativa).replace(/(\d)(?=(\d{3})+$)/g,'$1.')}</div>
    <div class="est-note">Estimativa automática<br>sujeita a revisão</div>
  </div>` : ''}

  <footer>
    <div><div class="footer-site"><span>tochi</span>.com.br</div></div>
    <div class="footer-contact"><strong>Eduardo Bertochi</strong><br>eduardo@tochi.com.br</div>
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
