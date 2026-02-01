import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/PageLoader'
import { Grid } from '@/components/Grid'

export const Route = createFileRoute('/')({
  component: GridPage,
})

function GridPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pages', 'index', 'data'],
    queryFn: async () => {
      const res = await api.api.pages.index.data.$get()
      return res.json() as any
    },
    refetchInterval: 30000,
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <PageLoader />
    </div>
  )

  const d = data?.data ?? {}
  const grid = d.grid ?? Array.from({ length: 10 }, () => Array(10).fill(null))
  const rowDigits = d.rowDigits ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const colDigits = d.colDigits ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const score = d.score
  const winningCell = d.winningCell
  const halftimeWinner = d.halftimeWinner
  const finalWinner = d.finalWinner
  const currentWinner = winningCell ? grid[winningCell.row]?.[winningCell.col] : null

  const isLive = score?.status === 'STATUS_IN_PROGRESS'
  const isFinal = score?.status === 'STATUS_FINAL'

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <div>
        {/* Header */}
        <header className="text-center pt-6 pb-2 px-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            SUPERBOWL SQUARES
          </h1>
          {isLive && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
            </div>
          )}
          {isFinal && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Final</span>
            </div>
          )}
        </header>

        {/* Scoreboard */}
        <div className="max-w-lg mx-auto px-4 py-4">
          {score ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* Team 1 (Away) */}
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm font-semibold text-red-300 uppercase tracking-wide mb-1">{score.team1.abbreviation || score.team1.name}</div>
                  <div className="text-4xl sm:text-6xl font-black tabular-nums text-white">{score.team1.score}</div>
                </div>

                {/* Divider */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                  <span className="text-white/30 font-light text-2xl">:</span>
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>

                {/* Team 2 (Home) */}
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm font-semibold text-blue-300 uppercase tracking-wide mb-1">{score.team2.abbreviation || score.team2.name}</div>
                  <div className="text-4xl sm:text-6xl font-black tabular-nums text-white">{score.team2.score}</div>
                </div>
              </div>
              <div className="mt-3 text-center text-xs sm:text-sm text-white/40 font-medium">{score.detail}</div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">🏈</div>
              <div className="text-white/40 text-sm">
                {d.gameConfigured ? 'Waiting for kickoff...' : 'No game configured yet'}
              </div>
            </div>
          )}
        </div>

        {/* Current Winner Banner */}
        {currentWinner && (
          <div className="max-w-lg mx-auto px-4 mb-4">
            <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/5">
              {currentWinner.imageUrl ? (
                <img src={currentWinner.imageUrl} alt={currentWinner.name} className="w-11 h-11 rounded-full object-cover border-2 border-yellow-400 shadow-md" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-yellow-500/30 border-2 border-yellow-400 flex items-center justify-center text-lg font-bold text-yellow-200">
                  {currentWinner.name[0]}
                </div>
              )}
              <div>
                <div className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">Currently Winning</div>
                <div className="font-bold text-yellow-100 text-lg leading-tight">{currentWinner.name}</div>
              </div>
              <div className="ml-2 text-2xl animate-bounce">🏆</div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-4">
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl">
              <Grid
                grid={grid}
                rowDigits={rowDigits}
                colDigits={colDigits}
                team1Name={score?.team1.abbreviation || score?.team1.name}
                team2Name={score?.team2.abbreviation || score?.team2.name}
                winningCell={winningCell}
              />
            </div>
          </div>
        </div>

        {/* Winners Section */}
        {(halftimeWinner || finalWinner) && (
          <div className="max-w-lg mx-auto px-4 pb-8 space-y-3">
            {halftimeWinner && (
              <WinnerCard label="Halftime Winner" winner={halftimeWinner} icon="⏱️" />
            )}
            {finalWinner && (
              <WinnerCard label="Final Winner" winner={finalWinner} icon="🏆" />
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pb-6 pt-2">
          <div className="text-white/20 text-xs">Auto-refreshes every 30s</div>
        </footer>
      </div>
    </div>
  )
}

function WinnerCard({ label, winner, icon }: { label: string; winner: { name: string; imageUrl: string | null }; icon: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3 shadow-lg">
      {winner.imageUrl ? (
        <img src={winner.imageUrl} alt={winner.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xl font-bold text-white/60">
          {winner.name[0]}
        </div>
      )}
      <div className="flex-1">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{label}</div>
        <div className="font-bold text-white text-lg leading-tight">{winner.name}</div>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  )
}
