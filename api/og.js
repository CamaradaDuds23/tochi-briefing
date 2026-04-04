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
        },
        children: [

          // Top: Logo SVG
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center' },
              children: [{
                type: 'svg',
                props: {
                  viewBox: '315 320 450 437',
                  width: '80',
                  height: '78',
                  xmlns: 'http://www.w3.org/2000/svg',
                  children: [
                    {
                      type: 'polygon',
                      props: {
                        fill: '#f5f5f0',
                        points: '363.46 380.03 363.46 723.53 390.46 723.53 390.46 756.84 330.72 756.84 330.72 380.03 315.21 380.03 315.21 348.43 330.72 348.43 330.72 320.29 363.46 320.29 363.46 348.43 390.46 348.43 390.46 380.03 363.46 380.03'
                      }
                    },
                    {
                      type: 'path',
                      props: {
                        fill: '#f5f5f0',
                        d: 'M480.75,330.63c-6.71-6.9-17.33-10.34-31.88-10.34s-25.09,3.44-31.6,10.34c-6.51,6.89-9.76,18-9.76,33.31v351.54c0,15.32,3.35,26.53,10.05,33.61,6.7,7.09,17.32,10.62,31.88,10.62s25.08-3.63,31.59-10.91c6.51-7.27,9.77-18.38,9.77-33.32v-351.54c0-15.31-3.36-26.42-10.05-33.31ZM458.06,728.12h-17.81v-376.24h17.81v376.24Z'
                      }
                    },
                    {
                      type: 'path',
                      props: {
                        fill: '#f5f5f0',
                        d: 'M597.06,528.23v-164.29c0-15.31-3.35-26.42-10.05-33.31-6.7-6.9-17.33-10.34-31.88-10.34s-25.08,3.44-31.59,10.34c-6.52,6.89-9.77,18-9.77,33.31v345.8c0,17.62,3.25,30.35,9.77,38.2,6.51,7.85,17.23,11.77,32.17,11.77s25.07-3.92,31.59-11.77c6.51-7.85,9.76-20.58,9.76-38.2v-111.44h-32.74v129.82h-17.8v-376.24h17.8v176.35h32.74Z'
                      }
                    },
                    {
                      type: 'path',
                      props: {
                        fill: '#f5f5f0',
                        d: 'M652.78,377.75v-57.46h-32.74v436.55h32.74v-346.87h17.81v346.87h32.74v-379.13l-50.55.04Z'
                      }
                    },
                    {
                      type: 'path',
                      props: {
                        fill: '#f5f5f0',
                        d: 'M732.04,377.73v379.11h32.75v-379.11h-32.75Z'
                      }
                    },
                    {
                      type: 'path',
                      props: {
                        fill: '#e01010',
                        d: 'M668.26,320.29v42.5h96.53v-42.5h-96.53Z'
                      }
                    }
                  ]
                }
              }]
            }
          },

          // Center: main title
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '0px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '128px',
                      fontWeight: '900',
                      color: '#f5f5f0',
                      lineHeight: '0.88',
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
                      fontSize: '128px',
                      fontWeight: '900',
                      color: '#e01010',
                      lineHeight: '0.88',
                      letterSpacing: '-4px',
                      textTransform: 'uppercase',
                    },
                    children: 'DE PROJETO'
                  }
                },
              ]
            }
          },

          // Bottom: tagline only
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { width: '32px', height: '3px', background: '#e01010' }
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '22px',
                      color: '#666',
                      letterSpacing: '4px',
                      textTransform: 'uppercase',
                      fontWeight: '400',
                    },
                    children: 'Pós-produção · Edição · Motion · IA'
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
