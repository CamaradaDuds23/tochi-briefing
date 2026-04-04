export default function handler(req, res) {
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0d0d0d"/>
  <rect width="1200" height="5" y="0" fill="#e01010"/>
  
  <!-- Grid lines decorativas -->
  <line x1="0" y1="625" x2="1200" y2="625" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="80" y1="0" x2="80" y2="630" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="1120" y1="0" x2="1120" y2="630" stroke="#1a1a1a" stroke-width="1"/>

  <!-- Logo Tochi (texto) -->
  <text x="80" y="120" font-family="'Arial Black', sans-serif" font-size="52" font-weight="900" fill="#f5f5f0" letter-spacing="-2">TOCHI</text>
  <rect x="80" y="130" width="60" height="4" fill="#e01010"/>

  <!-- Título principal -->
  <text x="80" y="280" font-family="'Arial Black', sans-serif" font-size="96" font-weight="900" fill="#f5f5f0" letter-spacing="-4">BRIEFING</text>
  <text x="80" y="390" font-family="'Arial Black', sans-serif" font-size="96" font-weight="900" fill="#e01010" letter-spacing="-4">DE PROJETO</text>

  <!-- Subtítulo -->
  <text x="80" y="460" font-family="'Courier New', monospace" font-size="20" fill="#888" letter-spacing="4">PÓS-PRODUÇÃO · EDIÇÃO · MOTION · IA</text>

  <!-- URL -->
  <text x="80" y="560" font-family="'Courier New', monospace" font-size="22" fill="#555" letter-spacing="2">tochi-briefing.vercel.app</text>
  
  <!-- Marca d'água decorativa -->
  <text x="900" y="580" font-family="'Arial Black', sans-serif" font-size="280" font-weight="900" fill="#111" letter-spacing="-10">T</text>

  <!-- Badge -->
  <rect x="80" y="500" width="220" height="40" fill="#e01010"/>
  <text x="90" y="527" font-family="'Courier New', monospace" font-size="16" font-weight="700" fill="#fff" letter-spacing="3">PREENCHA AGORA</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(svg);
}
