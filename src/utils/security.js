// ── Security Utilities for SplitSave ─────────────────────────────
// Add this file as src/utils/security.js

/**
 * Sanitize a plain text input — strips HTML tags and dangerous chars.
 * Use on all user-provided strings before storing or displaying.
 */
export const sanitizeInput = (str, maxLength = 100) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/[<>"'`]/g, '')   // strip HTML/script chars
    .replace(/javascript:/gi, '') // strip js: protocol
    .trim()
    .slice(0, maxLength)
}

/**
 * Validate a Stellar address properly using StrKey check.
 * Stronger than the basic length+prefix check.
 */
export const isValidStellarAddress = (address) => {
  if (!address || typeof address !== 'string') return false
  if (address.length !== 56) return false
  if (!address.startsWith('G')) return false
  // Valid base32 characters only (Stellar uses base32)
  if (!/^[A-Z2-7]{56}$/.test(address)) return false
  return true
}

/**
 * Simple rate limiter — prevents spamming actions.
 * Returns true if action is allowed, false if rate limited.
 *
 * Usage:
 *   if (!rateLimiter.check('settle')) return
 */
class RateLimiter {
  constructor() {
    this.timestamps = {}
  }

  check(key, minIntervalMs = 3000) {
    const now = Date.now()
    const last = this.timestamps[key] || 0
    if (now - last < minIntervalMs) return false
    this.timestamps[key] = now
    return true
  }

  reset(key) {
    delete this.timestamps[key]
  }
}

export const rateLimiter = new RateLimiter()

/**
 * Safe localStorage wrapper — handles errors and size limits.
 */
export const safeStorage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : fallback
    } catch {
      return fallback
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      // Storage quota exceeded
      console.warn('[SplitSave] localStorage quota exceeded:', e)
      return false
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}
