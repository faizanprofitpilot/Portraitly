'use client'

export default function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Simple subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
    </div>
  )
}
