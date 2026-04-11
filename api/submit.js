function buildPageContent(p) {
  const txt = k => p[k]?.rich_text?.[0]?.text?.content || '';
  const sel = k => p[k]?.select?.name || '—';
  const ms  = k => (p[k]?.multi_select || []).map(o => o.name).join(', ') || '—';
  const num = k => p[k]?.number ?? '—';
  const h2  = t => ({ object:'block', type:'heading_2', heading_2:{ rich_text:[{type:'text',text:{content:t}}] }});
  const div = ()=> ({ object:'block', type:'divider', divider:{} });
  const row = (label, value) => ({
    object:'block', type:'paragraph',
    paragraph:{ rich_text:[
      {type:'text', text:{content:label+':  '}, annotations:{bold:true, color:'gray'}},
      {type:'text', text:{content:String(value||'—')}}
    ]}
  });

  const blocks = [
    h2('👤 Identificação'),
    row('WhatsApp',   p['WhatsApp']?.phone_number || '—'),
    row('E-mail',     p['Email']?.email || '—'),
    row('Empresa',    txt('Empresa')),
    div(),
    h2('🎯 Projeto'),
    row('Serviços',   ms('Serviços')),
    row('Prazo',      sel('Prazo')),
    row('Descrição',  txt('Descrição')),
  ];

  if (p['Brief Link']?.url) blocks.push(row('Link Briefing', p['Brief Link'].url));

  if (ms('Serviços Ed') !== '—') {
    blocks.push(div(), h2('✂️ Edição de Vídeo'));
    blocks.push(row('Formato',      sel('Formato')));
    blocks.push(row('Qty H',        num('Qty H')));
    blocks.push(row('Qty V',        num('Qty V')));
    blocks.push(row('Duração H',    sel('Duração H')));
    blocks.push(row('Duração V',    sel('Duração V')));
    blocks.push(row('Serviços',     ms('Serviços Ed')));
    blocks.push(row('Material',     ms('Material Ed')));
    if (txt('Obs Edição')) blocks.push(row('Observações', txt('Obs Edição')));
  }

  if (ms('Tipos Motion') !== '—') {
    blocks.push(div(), h2('🎨 Motion Design'));
    blocks.push(row('Tipos',        ms('Tipos Motion')));
    blocks.push(row('Duração',      sel('Duração Motion')));
    blocks.push(row('Complexidade', ms('Complexidade Mo')));
    blocks.push(row('Quantidade',   num('Qty Motion')));
    blocks.push(row('Assets',       ms('Assets Mo')));
    if (txt('Obs Motion')) blocks.push(row('Observações', txt('Obs Motion')));
  }

  if (ms('Serviços IA') !== '—') {
    blocks.push(div(), h2('🤖 Produção com IA'));
    blocks.push(row('Serviços',     ms('Serviços IA')));
    if (num('Qty Min Vídeo') !== '—') blocks.push(row('Min. Vídeo', num('Qty Min Vídeo') + ' min'));
    if (num('Qty Min Áudio') !== '—') blocks.push(row('Min. Áudio', num('Qty Min Áudio') + ' min'));
    if (txt('Obs IA')) blocks.push(row('Observações', txt('Obs IA')));
  }

  const refs = txt('Referências');
  const obs  = txt('Observações');
  if (refs || obs) {
    blocks.push(div(), h2('📎 Extras'));
    if (refs) blocks.push(row('Referências', refs));
    if (obs)  blocks.push(row('Obs. gerais', obs));
  }

  blocks.push(div(), h2('💰 Estimativa'), row('Valor', 'R$ ' + (p['Estimativa']?.number ?? '—')));

  return blocks;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const RESEND_KEY   = process.env.RESEND_API_KEY; // optional — email skipped if not set

  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN not configured' });

  try {
    // ── 1. Salvar no Notion ───────────────────────────────────────────────
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${NOTION_TOKEN}`,
        'Content-Type':   'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        ...req.body,
        properties: { ...req.body.properties, 'Status': { select: { name: '🆕 Novo' } }, ...(req.body.origem ? { 'Origem': { select: { name: req.body.origem } } } : {}) },
        children: buildPageContent(req.body.properties || {})
      })
    });

    const notionData = await notionRes.json();
    if (!notionRes.ok) {
      console.error('Notion error:', notionData);
      return res.status(notionRes.status).json({ error: notionData.message || 'Notion error' });
    }

    const p = req.body.properties || {};

    // Extrair número da proposta
    const uid     = notionData.properties?.['N. Proposta']?.unique_id;
    const propNum = uid?.number ?? null;
    const propId  = propNum ? `PROP-${String(propNum).padStart(3, '0')}` : null;
    const pageUrl = notionData.url || null;

    // ── Numeração por cliente ──────────────────────────────────────────────
    const clientKey = (p['Empresa']?.rich_text?.[0]?.text?.content || p['Nome']?.title?.[0]?.text?.content || '').trim();
    const clientPrefix = clientKey.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/g, '').toUpperCase().slice(0, 4) || 'CLI';

    let clientSeq = 1;
    try {
      const existingRes = await fetch(`https://api.notion.com/v1/databases/${req.body.parent?.database_id}/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({
          filter: {
            or: [
              { property: 'Empresa', rich_text: { equals: clientKey } },
              ...(!req.body.properties?.['Empresa']?.rich_text?.[0]?.text?.content
                ? [{ property: 'Nome', title: { equals: clientKey } }]
                : [])
            ]
          }
        })
      });
      const existing = await existingRes.json();
      clientSeq = (existing.results?.length || 0); // current entry already counted
      if (clientSeq < 1) clientSeq = 1;
    } catch(e) { console.error('Client seq error:', e); }

    const clientId = `${clientPrefix}-${String(clientSeq).padStart(3, '0')}`;

    // Add links, status and valor final to Notion page via PATCH
    if (propId && notionData.id) {
      const pageId = notionData.id;
      if (pageId) {
        fetch(`https://api.notion.com/v1/pages/${notionData.id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
          body: JSON.stringify({ properties: {
            'Link Proposta':    { url: `https://tochi-briefing.vercel.app/api/proposal?id=${propId}` },
            'Link Briefing':    { url: `https://tochi-briefing.vercel.app/api/briefing?id=${propId}` },
            'Valor Final':      { number: req.body.properties?.['Estimativa']?.number || null },
            'N. Cliente':       { rich_text: [{ text: { content: clientId } }] },
            'Histórico Preço':  { rich_text: [{ text: { content: `${new Date().toLocaleDateString('pt-BR')} — Estimativa automática: R$ ${req.body.properties?.['Estimativa']?.number ?? '—'}` } }] }
          }})
        }).catch(e => console.error('PATCH error:', e));
      }
    }

    // ── 2. Enviar e-mail via Resend ───────────────────────────────────────
    if (RESEND_KEY) {
      const nome      = p['Nome']?.title?.[0]?.text?.content    || '—';
      const empresa   = p['Empresa']?.rich_text?.[0]?.text?.content || '';
      const wa        = p['WhatsApp']?.phone_number               || '—';
      const email     = p['Email']?.email                         || '—';
      const servicos  = (p['Serviços']?.multi_select || []).map(s => s.name).join(', ') || '—';
      const prazo     = p['Prazo']?.select?.name                  || '—';
      const descricao = p['Descrição']?.rich_text?.[0]?.text?.content || '—';
      const estimativa= p['Estimativa']?.number ?? '—';
      const briefLink = p['Brief Link']?.url                      || null;

      const emailHtml = `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#f5f5f0;border-radius:4px;overflow:hidden">
  <div style="background:#e01010;padding:20px 28px">
    <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.7)">Tochi · Novo briefing</p>
    <h1 style="margin:6px 0 0;font-size:26px;font-weight:900;letter-spacing:-0.5px">${propId || 'Sem número'} · ${nome}${empresa ? ' · '+empresa : ''}</h1>
    ${propId ? `<div style="margin-top:16px"><a href="https://tochi-briefing.vercel.app/api/proposal?id=${propId}" style="display:inline-block;background:#fff;color:#e01010;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:10px 20px">▶ GERAR ORÇAMENTO</a></div>` : ''}
  </div>
  <div style="padding:24px 28px">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888;width:140px">N. Cliente</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;font-weight:700">${clientId}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888;width:140px">WhatsApp</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${wa}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">E-mail</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${email}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Serviços</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${servicos}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Prazo</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${prazo}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Estimativa</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#e01010;font-weight:700">R$ ${typeof estimativa === 'number' ? estimativa.toLocaleString('pt-BR') : estimativa}</td></tr>
      <tr><td style="padding:12px 0 4px;color:#888;vertical-align:top">Descrição</td><td style="padding:12px 0 4px;color:#aaa;font-style:italic">${descricao}</td></tr>
    </table>
    ${briefLink ? `<p style="margin-top:16px"><a href="${briefLink}" style="color:#e01010">Ver briefing completo →</a></p>` : ''}
    ${pageUrl ? `<p style="margin-top:8px"><a href="${pageUrl}" style="color:#888;font-size:12px">Abrir no Notion →</a></p>` : ''}
    ${propId ? `<p style="margin-top:6px"><a href="https://tochi-briefing.vercel.app/api/briefing?id=${propId}" style="color:#888;font-size:12px">Ver página do briefing →</a></p><p style="margin-top:4px"><a href="https://tochi-briefing.vercel.app/api/status?id=${propId}" style="color:#888;font-size:12px">Ver status do projeto →</a></p>` : ""}
  </div>
  <div style="padding:16px 28px;border-top:1px solid #2a2a2a;font-size:11px;color:#555;letter-spacing:1px;text-transform:uppercase">
    tochi.com.br · sistema automático de briefings
  </div>
</div>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          from:    'Tochi Briefing <briefing@tochi.com.br>',
          to:      ['eduardo@tochi.com.br'],
          subject: `🎬 Novo briefing — ${nome}${empresa ? ' · '+empresa : ''} ${propId ? '('+propId+')' : ''} [${clientId}]`,
          html:    emailHtml
        })
      }).catch(err => console.error('Email error (non-fatal):', err));
    }

    return res.status(200).json({ success: true, propId, pageUrl });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
