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
    if (!r.ok || !data.results?.length) return res.status(404).send('<h1>Proposta não encontrada</h1>');

    const p    = data.results[0].properties;
    const txt  = k => p[k]?.rich_text?.[0]?.text?.content || '';
    const sel  = k => p[k]?.select?.name || '';
    const ms   = k => (p[k]?.multi_select || []).map(o => o.name);
    const num2 = k => p[k]?.number ?? null;
    const uid  = p['N. Proposta']?.unique_id;
    const propId   = uid?.number ? `PROP-${String(uid.number).padStart(3,'0')}` : '—';
    const nome     = p['Nome']?.title?.[0]?.text?.content || '—';
    const empresa  = txt('Empresa');
    const clientDisplay = empresa || nome;
    const servicos = ms('Serviços');
    const prazo    = sel('Prazo') || '—';
    const estimativa = num2('Estimativa') || 0;
    const antecipado = Math.round(estimativa * 0.90 / 50) * 50;
    const fmt = n => n.toLocaleString('pt-BR');
    const today = new Date().toLocaleDateString('pt-BR');
    const validDate = new Date(Date.now()+30*24*60*60*1000).toLocaleDateString('pt-BR');

    // Title from brand/company
    const heroWords = clientDisplay.trim().split(' ');
    const heroA = heroWords.slice(0, -1).join(' ') || heroWords[0];
    const heroB = heroWords.length > 1 ? heroWords[heroWords.length-1] : '';

    const briefingUrl = `https://tochi-briefing.vercel.app/api/briefing?id=${propId}`;
    const wa = (msg) => `https://wa.me/5511966488535?text=${encodeURIComponent(msg)}`;
    const waSVG = `<svg style="width:15px;height:15px;fill:currentColor;flex-shrink:0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
    const logoSVG = `<svg viewBox="315 320 450 437" xmlns="http://www.w3.org/2000/svg"><polygon fill="#f5f5f0" points="363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03"/><path fill="#f5f5f0" d="M480.75,330.63c-6.71-6.9-17.33-10.34-31.88-10.34s-25.09,3.44-31.6,10.34c-6.51,6.89-9.76,18-9.76,33.31v351.54c0,15.32,3.35,26.53,10.05,33.61,6.7,7.09,17.32,10.62,31.88,10.62s25.08-3.63,31.59-10.91c6.51-7.27,9.77-18.38,9.77-33.32v-351.54c0-15.31-3.36-26.42-10.05-33.31ZM458.06,728.12h-17.81v-376.24h17.81v376.24Z"/><path fill="#f5f5f0" d="M597.06,528.23v-164.29c0-15.31-3.35-26.42-10.05-33.31-6.7-6.9-17.33-10.34-31.88-10.34s-25.08,3.44-31.59,10.34c-6.52,6.89-9.77,18-9.77,33.31v345.8c0,17.62,3.25,30.35,9.77,38.2,6.51,7.85,17.23,11.77,32.17,11.77s25.07-3.92,31.59-11.77c6.51-7.85,9.76-20.58,9.76-38.2v-111.44h-32.74v129.82h-17.8v-376.24h17.8v176.35h32.74Z"/><path fill="#f5f5f0" d="M652.78,377.75v-57.46h-32.74v436.55h32.74v-346.87h17.81v346.87h32.74v-379.13l-50.55.04Z"/><path fill="#f5f5f0" d="M732.04,377.73v379.11h32.75v-379.11h-32.75Z"/><path fill="red" d="M668.26,320.29v42.5h96.53v-42.5h-96.53Z"/></svg>`;

    // Build deliverables
    const formato  = sel('Formato');
    const qtyH = num2('Qty H') || 0, qtyV = num2('Qty V') || 0;
    const durH = sel('Duração H'), durV = sel('Duração V');
    const tiposMotion = ms('Tipos Motion');
    const qtyMo = num2('Qty Motion') || 1;
    const servicosIA = ms('Serviços IA');

    let deliverables = '';
    if (servicos.includes('Edição de Vídeo')) {
      const qty = formato === 'Ambos' ? `${qtyH}H + ${qtyV}V` : `${qtyH || qtyV || 1}`;
      const dur = [durH, durV].filter(Boolean).join(' · ');
      deliverables += `<div class="d-item"><div class="d-label">Vídeos</div><div class="d-val">${qty}</div><div class="d-sub">${formato||''}${dur?' · '+dur:''}</div></div>`;
    }
    if (servicos.includes('Motion Design')) {
      deliverables += `<div class="d-item"><div class="d-label">Motion</div><div class="d-val">${qtyMo}</div><div class="d-sub">${tiposMotion.slice(0,2).join(', ')}</div></div>`;
    }
    if (servicos.includes('Produção com IA') && servicosIA.length) {
      deliverables += `<div class="d-item"><div class="d-label">IA</div><div class="d-val red">${servicosIA.length}</div><div class="d-sub">${servicosIA.slice(0,2).join(', ')}</div></div>`;
    }
    const prazoRows = {'Urgente até 2 dias':'2 dias úteis','Padrão 10+ dias':'10–15 dias úteis','Sem urgência':'A combinar'};
    deliverables += `<div class="d-item"><div class="d-label">Prazo</div><div class="d-val">${prazoRows[prazo]||prazo}</div><div class="d-sub">A partir do kick-off</div></div>`;

    // Services list
    const svcEdMap = {Corte:'Corte',Color_Grade:'Color Grade',SFX:'SFX','Motion/Tipografia':'Motion / Tipografia',Legendas:'Legendas','Multi Câmera':'Multi Câmera'};
    const servicosEd = ms('Serviços Ed');
    let svcRows = '';
    if (servicos.includes('Edição de Vídeo')) {
      svcRows += `<div class="svc-row"><div><div class="svc-name">Edição de Vídeo</div><div class="svc-desc">${servicosEd.join(', ') || 'Montagem criativa do material bruto'}</div></div><div class="svc-dot"></div></div>`;
    }
    if (servicos.includes('Motion Design')) {
      const cx = ms('Complexidade Mo');
      svcRows += `<div class="svc-row"><div><div class="svc-name">Motion Design</div><div class="svc-desc">${tiposMotion.join(', ')}${cx.length?' · '+cx.join(', '):''}</div></div><div class="svc-dot"></div></div>`;
    }
    if (servicos.includes('Produção com IA') && servicosIA.length) {
      svcRows += `<div class="svc-row"><div><div class="svc-name">Produção com IA</div><div class="svc-desc">${servicosIA.join(', ')}</div></div><div class="svc-dot"></div></div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tochi — Proposta ${propId} · ${clientDisplay}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
:root{--black:#0d0d0d;--white:#f5f5f0;--red:#e01010;--gray:#2a2a2a;--gray-mid:#444;--gray-light:#888;--green:#1a7a3c}
body{background:var(--black);color:var(--white);font-family:'Barlow Condensed',sans-serif;min-height:100vh;overflow-x:hidden}
.page{max-width:900px;margin:0 auto;padding:0 2rem 6rem}
.print-btn{position:fixed;bottom:2rem;right:2rem;z-index:100;display:flex;align-items:center;gap:.5rem;background:var(--gray);border:1px solid #444;color:var(--gray-light);font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:.6rem 1rem;cursor:pointer;transition:border-color .15s,color .15s}
.print-btn:hover{border-color:var(--white);color:var(--white)}
.print-btn svg{width:13px;height:13px;fill:currentColor}
.brief-btn{position:fixed;bottom:2rem;left:2rem;z-index:100;display:flex;align-items:center;gap:.5rem;background:none;border:1px solid var(--gray);color:var(--gray-light);font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:.6rem 1rem;cursor:pointer;text-decoration:none;transition:border-color .15s,color .15s}
.brief-btn:hover{border-color:var(--white);color:var(--white)}
@media print{.print-btn,.brief-btn{display:none!important}body{background:var(--black)!important}.page{padding:0 1.5rem 2rem;max-width:100%}.section,.price-block,.pix-block,.termos{page-break-inside:avoid}}
header{display:flex;justify-content:space-between;align-items:center;padding:2rem 0;border-bottom:1px solid var(--gray)}
.logo-lg{display:block;width:52px}
.doc-meta{text-align:right;font-family:'DM Mono',monospace;font-size:.72rem;color:var(--gray-light);line-height:1.8;letter-spacing:.04em}
.doc-meta span{color:var(--white)}
.hero{padding:5rem 0 4rem;border-bottom:1px solid var(--gray)}
.label{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--red);margin-bottom:1rem;display:flex;align-items:center;gap:.6rem}
.label::before{content:'';display:inline-block;width:18px;height:2px;background:var(--red);flex-shrink:0}
.hero-title{font-size:clamp(3rem,8vw,6rem);font-weight:900;line-height:.92;letter-spacing:-.01em;text-transform:uppercase;margin-bottom:2rem}
.hero-title em{font-style:normal;color:var(--red)}
.client-tag{display:inline-flex;align-items:center;gap:.75rem;background:var(--gray);border:1px solid #333;padding:.5rem 1rem;font-size:.9rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-light)}
.client-tag strong{color:var(--white)}
.section{padding:4rem 0;border-bottom:1px solid var(--gray)}
.sec-hdr{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:2.5rem}
.sec-title{font-size:.72rem;font-family:'DM Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gray-light)}
.sec-num{font-size:.68rem;font-family:'DM Mono',monospace;color:#333;letter-spacing:.1em}
.deliverables{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--gray);border:1px solid var(--gray)}
.d-item{background:var(--black);padding:1.75rem 2rem;display:flex;flex-direction:column;gap:.4rem}
.d-label{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-light)}
.d-val{font-size:1.6rem;font-weight:700;letter-spacing:-.01em;text-transform:uppercase}
.d-val.red{color:var(--red)}
.d-sub{font-size:.8rem;font-weight:400;color:var(--gray-light);text-transform:none}
.svc-list{display:flex;flex-direction:column}
.svc-row{display:flex;align-items:center;justify-content:space-between;padding:1.4rem 0;border-bottom:1px solid #1c1c1c;gap:1rem}
.svc-row:last-child{border-bottom:none}
.svc-name{font-size:1.4rem;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
.svc-desc{font-size:.8rem;color:var(--gray-light);margin-top:.15rem;font-family:'DM Mono',monospace;letter-spacing:.03em}
.svc-dot{width:10px;height:10px;background:var(--red);flex-shrink:0}
.price-block{padding:4rem 0;border-bottom:1px solid var(--gray)}
.price-main{display:flex;align-items:flex-end;gap:1rem;margin:2rem 0}
.price-cur{font-size:2rem;font-weight:300;color:var(--gray-light);line-height:1;margin-bottom:.6rem}
.price-val{font-size:clamp(5rem,12vw,8rem);font-weight:900;line-height:.9;letter-spacing:-.03em}
.price-cts{font-size:2.5rem;font-weight:700;color:var(--gray-mid);line-height:1;margin-bottom:.5rem}
.price-meta{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);letter-spacing:.06em;margin-bottom:2rem}
.price-meta strong{color:var(--white)}
.payment-opts{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--gray);border:1px solid var(--gray)}
.p-opt{background:var(--black);padding:1.5rem 2rem;display:flex;flex-direction:column}
.p-opt.feat{background:var(--red)}
.p-opt.feat .p-lbl,.p-opt.feat .p-desc{color:rgba(255,255,255,.7)}
.p-lbl{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gray-light);margin-bottom:.5rem}
.p-ttl{font-size:1.3rem;font-weight:800;text-transform:uppercase;letter-spacing:.02em;margin-bottom:.35rem}
.p-desc{font-size:.78rem;color:var(--gray-light);font-family:'DM Mono',monospace;line-height:1.5}
.badge{display:inline-block;font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.1em;padding:.2rem .5rem;margin-top:.6rem;margin-bottom:1.25rem}
.bd-dark{background:var(--gray);color:var(--gray-light)}
.bd-light{background:rgba(255,255,255,.15);color:#fff}
.wa-btn{display:flex;align-items:center;justify-content:center;gap:.5rem;margin-top:auto;padding:.75rem 1rem;font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,.2);color:var(--white);background:transparent;transition:background .15s}
.wa-btn:hover{background:rgba(255,255,255,.1)}
.pix-block{padding:4rem 0;border-bottom:1px solid var(--gray)}
.pix-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--gray);border:1px solid var(--gray)}
.pix-item{background:var(--black);padding:1.5rem 2rem;display:flex;flex-direction:column;gap:.35rem}
.pix-item.full{grid-column:1/-1}
.pix-sub{font-family:'DM Mono',monospace;font-size:.65rem;color:var(--gray-light);letter-spacing:.1em;text-transform:uppercase}
.pix-key{font-size:1.5rem;font-weight:800;color:var(--red)}
.pix-val{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--white);letter-spacing:.04em}
.termos{padding:4rem 0;border-bottom:1px solid var(--gray)}
.termos-list{display:flex;flex-direction:column}
.t-item{display:flex;gap:2rem;padding:1.5rem 0;border-bottom:1px solid #1a1a1a}
.t-item:last-child{border-bottom:none}
.t-num{font-family:'DM Mono',monospace;font-size:.65rem;color:var(--red);letter-spacing:.1em;min-width:2rem;padding-top:.1rem;flex-shrink:0}
.t-txt{font-size:.88rem;color:var(--gray-light);line-height:1.65;font-family:'DM Mono',monospace;letter-spacing:.01em}
.t-txt strong{color:var(--white);font-weight:500}
.cta{padding:4rem 0;border-bottom:1px solid var(--gray);text-align:center}
.cta-valid{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-light);margin-bottom:1.5rem}
.cta-valid span{color:var(--red)}
.cta-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:1rem 2.5rem;font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;background:var(--red);color:var(--white);border:none;cursor:pointer;transition:opacity .15s}
.cta-btn:hover{opacity:.88}
footer{padding:4rem 0 0;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:2rem}
.f-site{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);letter-spacing:.08em}
.f-site span{color:var(--red)}
.f-contact{text-align:right;font-family:'DM Mono',monospace;font-size:.7rem;color:var(--gray-light);line-height:2;letter-spacing:.04em}
.f-contact strong{color:var(--white);font-weight:500}
.accent-bar{height:4px;background:var(--red);width:100%;margin-top:3rem}
@media(max-width:620px){.deliverables,.payment-opts,.pix-grid{grid-template-columns:1fr}.hero-title{font-size:3rem}footer{flex-direction:column}.f-contact{text-align:left}}
</style>
</head>
<body>
<a class="brief-btn" href="${briefingUrl}" target="_blank">← Ver briefing original</a>
<button class="print-btn" onclick="window.print()">
  <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
  Salvar PDF
</button>
<div class="page">
  <header>
    <svg class="logo-lg" viewBox="315 320 450 437" xmlns="http://www.w3.org/2000/svg">${logoSVG.replace(/<svg[^>]*>/,'').replace('</svg>','')}</svg>
    <div class="doc-meta">PROPOSTA COMERCIAL &nbsp;·&nbsp; <span>N.º ${propId}</span><br>DATA <span>${today}</span><br>VÁLIDA ATÉ <span>${validDate}</span></div>
  </header>
  <div class="hero">
    <div class="label">Proposta para</div>
    <h1 class="hero-title">${heroA}${heroB?`<br><em>${heroB}</em>`:''}</h1>
    <div class="client-tag">Cliente &nbsp;<strong>${clientDisplay}${nome !== clientDisplay ? ' · '+nome : ''}</strong></div>
  </div>
  <div class="section">
    <div class="sec-hdr"><span class="sec-title">Escopo do projeto</span><span class="sec-num">01</span></div>
    <div class="deliverables">${deliverables}</div>
  </div>
  <div class="section">
    <div class="sec-hdr"><span class="sec-title">O que está incluso</span><span class="sec-num">02</span></div>
    <div class="svc-list">${svcRows}</div>
  </div>
  <div class="price-block">
    <div class="sec-hdr"><span class="sec-title">Investimento</span><span class="sec-num">03</span></div>
    <div class="price-main">
      <div class="price-cur">R$</div>
      <div class="price-val">${fmt(estimativa).replace(/,\d+$/,'')}</div>
      <div class="price-cts">,00</div>
    </div>
    <div class="price-meta">Prazo: <strong>${prazoRows[prazo]||prazo}</strong></div>
    <div class="payment-opts">
      <div class="p-opt">
        <div class="p-lbl">Padrão</div><div class="p-ttl">50% + 50%</div>
        <div class="p-desc">R$${fmt(Math.round(estimativa/2))} na aprovação<br>R$${fmt(Math.round(estimativa/2))} na entrega</div>
        <div class="badge bd-dark">SEM DESCONTO</div>
        <a class="wa-btn" href="${wa(`Olá, quero aprovar a proposta ${propId} na opção 50%+50% (R$${fmt(estimativa)}).`)}" target="_blank">${waSVG} Aceitar esta opção</a>
      </div>
      <div class="p-opt feat">
        <div class="p-lbl">Melhor opção</div><div class="p-ttl">100% Antecipado</div>
        <div class="p-desc">R$${fmt(antecipado)} antes do início<br>10% de desconto aplicado</div>
        <div class="badge bd-light">— 10% · ECONOMIA R$${fmt(estimativa-antecipado)}</div>
        <a class="wa-btn" href="${wa(`Olá, quero aprovar a proposta ${propId} na opção 100% antecipado (R$${fmt(antecipado)}).`)}" target="_blank">${waSVG} Aceitar esta opção</a>
      </div>
    </div>
  </div>
  <div class="pix-block">
    <div class="sec-hdr"><span class="sec-title">Dados para pagamento</span><span class="sec-num">04</span></div>
    <div class="pix-grid">
      <div class="pix-item full"><div class="pix-sub">Chave Pix</div><div class="pix-key">eduardo@tochi.com.br</div></div>
      <div class="pix-item"><div class="pix-sub">Banco</div><div class="pix-val">Inter · 077</div></div>
      <div class="pix-item"><div class="pix-sub">Favorecido</div><div class="pix-val">Eduardo Bertochi</div></div>
      <div class="pix-item"><div class="pix-sub">Agência / Conta</div><div class="pix-val">0001 · 465832938</div></div>
      <div class="pix-item"><div class="pix-sub">CNPJ</div><div class="pix-val">42.219.966/0001-64</div></div>
    </div>
  </div>
  <div class="termos">
    <div class="sec-hdr"><span class="sec-title">Condições gerais</span><span class="sec-num">05</span></div>
    <div class="termos-list">
      <div class="t-item"><div class="t-num">01</div><div class="t-txt">O prazo começa a contar a partir do <strong>recebimento integral do material bruto</strong> e da confirmação de pagamento da primeira parcela.</div></div>
      <div class="t-item"><div class="t-num">02</div><div class="t-txt">Estão incluídas <strong>2 rodadas de revisão</strong>. Revisões adicionais ou mudanças de escopo serão cobradas separadamente.</div></div>
      <div class="t-item"><div class="t-num">03</div><div class="t-txt">Em caso de cancelamento após o início, serão cobrados os custos já incorridos, com valor mínimo de <strong>30% do total aprovado</strong>.</div></div>
      <div class="t-item"><div class="t-num">04</div><div class="t-txt">A aprovação formal desta proposta, por e-mail ou mensagem, <strong>caracteriza aceite integral</strong> das condições aqui descritas.</div></div>
    </div>
  </div>
  <div class="cta">
    <div class="cta-valid">Válida até <span>${validDate}</span></div>
    <a class="cta-btn" href="${wa(`Olá, quero fechar a proposta ${propId}.`)}" target="_blank">${waSVG} Fechar proposta via WhatsApp</a>
  </div>
  <footer>
    <div><div class="f-site"><a href="https://tochi.com.br" target="_blank" style="color:inherit;text-decoration:none"><span>tochi</span>.com.br</a></div></div>
    <div class="f-contact"><strong>Eduardo Bertochi</strong><br>eduardo@tochi.com.br</div>
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
