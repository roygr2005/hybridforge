import clsx from 'clsx'

interface Props {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'green' | 'blue' | 'purple' | 'orange'
  sub?: string
}

const colorMap = {
  green:  'bg-green-900/40 border-green-700/50 text-green-400',
  blue:   'bg-blue-900/40 border-blue-700/50 text-blue-400',
  purple: 'bg-purple-900/40 border-purple-700/50 text-purple-400',
  orange: 'bg-orange-900/40 border-orange-700/50 text-orange-400',
}

export default function StatCard({ label, value, icon, color = 'green', sub }: Props) {
  return (
    <div className={clsx('rounded-xl border p-4 flex flex-col gap-1', colorMap[color])}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
