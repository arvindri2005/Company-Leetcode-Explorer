import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Image metadata
export const alt = 'Byte to Offer - AI-Powered Interview Prep'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  // Font loading
  const fontData = await fetch(
    new URL('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff')
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #1a1a1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter',
        }}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
             {/* Logo Icon */}
             <div style={{
               width: 80,
               height: 80,
               background: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
               borderRadius: '20px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: 48,
               fontWeight: 700,
               color: 'white',
               marginRight: 24,
               boxShadow: '0 0 40px rgba(45, 212, 191, 0.4)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
             }}>
               B
             </div>
             
             <div style={{
               fontSize: 72,
               fontWeight: 700,
               color: '#f3f4f6',
               letterSpacing: '-0.02em',
             }}>
               Byte to Offer
             </div>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 32,
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
            marginBottom: 48,
          }}>
            Master coding interviews with AI-driven tools
          </div>
          
          {/* Company Pills */}
          <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
          }}>
              {['Google', 'Amazon', 'Meta', 'Microsoft'].map((company, i) => (
                  <div key={company} style={{
                      padding: '10px 28px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: 999,
                      color: '#d1d5db',
                      fontSize: 20,
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}>
                      {company}
                  </div>
              ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
