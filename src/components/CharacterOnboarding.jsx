import { markCharacterIntroSeen } from './characterIntroState'
import catWelcome from '../assets/cat-welcome.mp4'

export function CharacterOnboarding({ onComplete }) {
  function finish() {
    markCharacterIntroSeen()
    onComplete?.()
  }

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Welcome">
      <div style={card}>
        <video
          src={catWelcome}
          autoPlay
          loop
          muted
          playsInline
          aria-label="Cat walking animation"
          style={videoStyle}
        />
        <h2 style={{ margin: '12px 0 6px', textAlign: 'center' }}>Welcome to NekoNest</h2>
        <p style={{ margin: '0 0 14px', color: '#6b5b4d', textAlign: 'center', fontSize: 14 }}>
          Track your spending with your cozy cat companion.
        </p>
        <button
          type="button"
          onClick={finish}
          className="btn-action"
          style={{ width: '100%' }}
        >
          Let&apos;s go!
        </button>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 100,
  padding: 16,
}

const card = {
  width: '100%',
  maxWidth: 360,
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #eadfce',
  padding: 20,
  textAlign: 'center',
}

const videoStyle = {
  width: '100%',
  maxWidth: 220,
  borderRadius: 14,
  objectFit: 'cover',
  display: 'block',
  margin: '0 auto',
}
