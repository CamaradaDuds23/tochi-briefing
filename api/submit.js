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
      body: JSON.stringify(req.body)
    });

    const notionData = await notionRes.json();
    if (!notionRes.ok) {
      console.error('Notion error:', notionData);
      return res.status(notionRes.status).json({ error: notionData.message || 'Notion error' });
    }

    // Extrair número da proposta
    const uid     = notionData.properties?.['N. Proposta']?.unique_id;
    const propNum = uid?.number ?? null;
    const propId  = propNum ? `PROP-${String(propNum).padStart(3, '0')}` : null;
    const pageUrl = notionData.url || null;

    // ── 2. Enviar e-mail via Resend ───────────────────────────────────────
    if (RESEND_KEY) {
      const p = req.body.properties || {};
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
  </div>
  <div style="padding:24px 28px">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888;width:140px">WhatsApp</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${wa}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">E-mail</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${email}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Serviços</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${servicos}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Prazo</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${prazo}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#888">Estimativa</td><td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#e01010;font-weight:700">R$ ${typeof estimativa === 'number' ? estimativa.toLocaleString('pt-BR') : estimativa}</td></tr>
      <tr><td style="padding:12px 0 4px;color:#888;vertical-align:top">Descrição</td><td style="padding:12px 0 4px;color:#aaa;font-style:italic">${descricao}</td></tr>
    </table>
    ${briefLink ? `<p style="margin-top:16px"><a href="${briefLink}" style="color:#e01010">Ver briefing completo →</a></p>` : ''}
    ${pageUrl ? `<p style="margin-top:8px"><a href="${pageUrl}" style="color:#888;font-size:12px">Abrir no Notion →</a></p>` : ''}
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
          from:    'Tochi Briefing <onboarding@resend.dev>',
          to:      ['eduardo@tochi.com.br'],
          subject: `🎬 Novo briefing — ${nome}${empresa ? ' · '+empresa : ''} ${propId ? '('+propId+')' : ''}`,
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
