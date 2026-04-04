export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = 'c8e898644f7043e2b440f495b28bac46';

  const raw = req.query.id || '';
  const num = parseInt(raw.replace(/PROP-?/i, ''));
  if (!num) return res.status(400).json({ error: 'ID inválido' });

  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: { property: 'N. Proposta', unique_id: { equals: num } }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message });
    if (!data.results?.length) return res.status(404).json({ error: 'Briefing não encontrado' });

    const p = data.results[0].properties;
    const txt = k => p[k]?.rich_text?.[0]?.text?.content || '';
    const sel = k => p[k]?.select?.name || null;
    const ms  = k => (p[k]?.multi_select || []).map(o => o.name);
    const num2= k => p[k]?.number ?? null;
    const propId = p['N. Proposta']?.unique_id?.number
      ? `PROP-${String(p['N. Proposta'].unique_id.number).padStart(3,'0')}` : null;

    return res.status(200).json({
      propId,
      nome:       p['Nome']?.title?.[0]?.text?.content || '',
      empresa:    txt('Empresa'),
      whatsapp:   p['WhatsApp']?.phone_number || '',
      email:      p['Email']?.email || '',
      descricao:  txt('Descrição'),
      briefLink:  p['Brief Link']?.url || '',
      servicos:   ms('Serviços'),
      prazo:      sel('Prazo'),
      estimativa: num2('Estimativa'),
      formato:    sel('Formato'),
      qtyH:       num2('Qty H'),
      qtyV:       num2('Qty V'),
      duracaoH:   sel('Duração H'),
      duracaoV:   sel('Duração V'),
      servicosEd: ms('Serviços Ed'),
      materialEd: ms('Material Ed'),
      obsEdicao:  txt('Obs Edição'),
      tiposMotion:ms('Tipos Motion'),
      duracaoMo:  sel('Duração Motion'),
      complexMo:  ms('Complexidade Mo'),
      qtyMotion:  num2('Qty Motion'),
      assetsMo:   ms('Assets Mo'),
      obsMotion:  txt('Obs Motion'),
      servicosIA: ms('Serviços IA'),
      qtyMinVideo:num2('Qty Min Vídeo'),
      qtyMinAudio:num2('Qty Min Áudio'),
      obsIA:      txt('Obs IA'),
      obs:        txt('Observações'),
      refs:       txt('Referências'),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
