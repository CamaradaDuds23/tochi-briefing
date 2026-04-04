import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        },
        children: [
          // Top: logo area
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    },
                    children: [
                      // Red bar
                      {
                        type: 'div',
                        props: {
                          style: { width: '48px', height: '6px', background: '#e01010' }
                        }
                      },
                      // TOCHI label
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#888',
                            letterSpacing: '6px',
                            textTransform: 'uppercase',
                          },
                          children: 'TOCHI'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },

          // Center: main title
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '4px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '120px',
                      fontWeight: '900',
                      color: '#f5f5f0',
                      lineHeight: '0.9',
                      letterSpacing: '-4px',
                      textTransform: 'uppercase',
                    },
                    children: 'BRIEFING'
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '120px',
                      fontWeight: '900',
                      color: '#e01010',
                      lineHeight: '0.9',
                      letterSpacing: '-4px',
                      textTransform: 'uppercase',
                    },
                    children: 'DE PROJETO'
                  }
                },
              ]
            }
          },

          // Bottom: description + url
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '8px' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '22px',
                            color: '#888',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontWeight: '400',
                          },
                          children: 'Pós-produção · Edição · Motion · IA'
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '20px',
                            color: '#444',
                            letterSpacing: '1px',
                          },
                          children: 'tochi-briefing.vercel.app'
                        }
                      }
                    ]
                  }
                },
                // Badge
                {
                  type: 'div',
                  props: {
                    style: {
                      background: '#e01010',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: '700',
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      padding: '14px 28px',
                    },
                    children: 'PREENCHA AGORA'
                  }
                }
              ]
            }
          }
        ]
      }
    },
    { width: 1200, height: 630 }
  );
}
