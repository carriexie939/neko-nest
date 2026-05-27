const INTRO_KEY = 'pocket-cookie-seen-character-intro'

export function hasSeenCharacterIntro() {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export function markCharacterIntroSeen() {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Ignore write errors.
  }
}
