export function FatigueBadge({ usageCount, isFatigued }: { usageCount: number; isFatigued: boolean }) {
  if (isFatigued) {
    return (
      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
        已疲劳
      </span>
    )
  }
  if (usageCount >= 3) {
    return (
      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
        即将疲劳 ({usageCount})
      </span>
    )
  }
  return (
    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
      可用 ({usageCount})
    </span>
  )
}