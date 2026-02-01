const COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#2b6cb0',
  '#c05621', '#2f855a', '#6b46c1', '#b83280', '#c53030',
]

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length] ?? '#e53e3e'
}

type GridCell = {
  participantId: string
  name: string
  imageUrl: string | null
} | null

interface GridProps {
  grid: GridCell[][]
  rowDigits: number[]
  colDigits: number[]
  team1Name?: string
  team2Name?: string
  winningCell?: { row: number; col: number } | null
}

export function Grid({ grid, rowDigits, colDigits, team1Name, team2Name, winningCell }: GridProps) {
  return (
    <div className="overflow-hidden">
      <table className="border-collapse border-spacing-0">
        {/* Team 2 (Home/cols) label row */}
        <thead>
          <tr>
            <th className="border border-white/10" />
            <th className="border border-white/10" />
            <th
              colSpan={10}
              className="py-2 text-xs sm:text-sm font-bold text-center border border-white/10 bg-blue-600/30 text-blue-300 uppercase tracking-widest"
            >
              {team2Name ?? 'Home'}
            </th>
          </tr>
          <tr>
            <th className="border border-white/10" />
            <th className="border border-white/10" />
            {colDigits.map((digit, i) => (
              <th
                key={i}
                className="w-9 h-9 sm:w-12 sm:h-10 text-xs sm:text-sm font-mono font-bold text-center border border-white/10 bg-blue-600/20 text-blue-300"
              >
                {digit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {/* Team 1 (Away/rows) vertical label — only on first row */}
              {rowIdx === 0 && (
                <th
                  rowSpan={10}
                  className="border border-white/10 bg-red-600/30 text-red-300 w-7 text-xs sm:text-sm font-bold uppercase tracking-widest"
                >
                  <div className="transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    {team1Name ?? 'Away'}
                  </div>
                </th>
              )}
              {/* Row digit */}
              <td className="w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm font-mono font-bold text-center border border-white/10 bg-red-600/20 text-red-300">
                {rowDigits[rowIdx]}
              </td>
              {/* Grid cells */}
              {row.map((cell, colIdx) => {
                const isWinning = winningCell?.row === rowIdx && winningCell?.col === colIdx
                return (
                  <td
                    key={colIdx}
                    className={`w-9 h-9 sm:w-12 sm:h-12 border border-white/10 text-center p-0 relative transition-all duration-300 ${
                      isWinning
                        ? 'ring-2 ring-yellow-400 bg-yellow-400/20 scale-105 z-10 shadow-lg shadow-yellow-400/30'
                        : cell
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-white/[0.02]'
                    }`}
                    title={cell?.name ?? 'Empty'}
                  >
                    {cell ? (
                      cell.imageUrl ? (
                        <img
                          src={cell.imageUrl}
                          alt={cell.name}
                          className={`w-full h-full object-cover rounded-sm transition-all duration-300 ${
                            winningCell && !isWinning ? 'saturate-[0.3] opacity-60' : ''
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-[10px] sm:text-sm font-bold text-white rounded-sm transition-all duration-300 ${
                            winningCell && !isWinning ? 'saturate-[0.3] opacity-60' : ''
                          }`}
                          style={{ backgroundColor: stringToColor(cell.name) }}
                        >
                          {cell.name.split(' ').map(w => w[0]).join('')}
                        </div>
                      )
                    ) : null}
                    {isWinning && (
                      <div className="absolute inset-0 rounded-sm animate-pulse ring-1 ring-yellow-400/50" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
