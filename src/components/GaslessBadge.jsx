import { isSponsorshipActive } from '../utils/stellar'

/**
 * GaslessBadge
 * Shows a "Gasless ⚡" pill when fee sponsorship is configured,
 * or a subtle "Network fees apply" note when it isn't.
 *
 * Usage:
 *   <GaslessBadge />                      — inline pill
 *   <GaslessBadge showInactive={false} /> — only renders when active
 */
export default function GaslessBadge({ showInactive = true, style = {} }) {
  const active = isSponsorshipActive()

  if (!active && !showInactive) return null

  return active ? (
    <span className="gasless-badge" style={style} title="Transaction fees are covered by SplitSave — you pay nothing!">
      <span className="gasless-icon">⚡</span>
      Gasless Transaction
    </span>
  ) : (
    <span className="gasless-badge gasless-badge--inactive" style={style} title="Small network fee applies">
      <span className="gasless-icon">◈</span>
      Network fee applies
    </span>
  )
}
