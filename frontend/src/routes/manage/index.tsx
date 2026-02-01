import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/PageLoader'
import { Grid } from '@/components/Grid'

export const Route = createFileRoute('/manage/')({
  beforeLoad: async () => {
    try {
      const res = await fetch('/api/auth/get-session')
      if (!res.ok) throw redirect({ to: '/login' })
      const text = await res.text()
      if (!text) throw redirect({ to: '/login' })
      const session = JSON.parse(text) as { user?: { email: string } }
      if (!session?.user) throw redirect({ to: '/login' })
    } catch (e) {
      if (e instanceof Response || (e && typeof e === 'object' && 'to' in e)) throw e
      throw redirect({ to: '/login' })
    }
  },
  component: ManagePage,
})

function ManagePage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['manage', 'data'],
    queryFn: async () => {
      const res = await api.api.pages.manage.data.$get()
      return res.json() as any
    },
  })

  const espnGames = useQuery({
    queryKey: ['manage', 'espn-games'],
    queryFn: async () => {
      const res = await (api.api.pages.manage as any)['espn-games'].$get()
      return res.json() as any
    },
  })

  const [name, setName] = useState('')
  const [squareCount, setSquareCount] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSquareCount, setEditSquareCount] = useState(0)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['manage'] })

  const addParticipant = useMutation({
    mutationFn: async () => {
      let imageKey: string | undefined

      if (imageFile) {
        // Get upload URL
        const urlRes = await api.api.pages.manage['upload-url'].$post({
          json: { filename: imageFile.name },
        })
        const urlData = await urlRes.json() as any
        if (urlData.data?.url) {
          // Upload to R2
          await fetch(urlData.data.url, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
          })
          imageKey = urlData.data.key
        }
      }

      const res = await api.api.pages.manage['add-participant'].$post({
        json: { name, squareCount, imageKey },
      })
      return res.json()
    },
    onSuccess: () => {
      setName('')
      setSquareCount(1)
      setImageFile(null)
      invalidate()
    },
  })

  const removeParticipant = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.pages.manage['remove-participant'].$post({
        json: { id },
      })
      return res.json()
    },
    onSuccess: invalidate,
  })

  const updateSquares = useMutation({
    mutationFn: async ({ id, squareCount }: { id: string; squareCount: number }) => {
      const res = await api.api.pages.manage['update-participant-squares'].$post({
        json: { id, squareCount },
      })
      return res.json()
    },
    onSuccess: () => {
      setEditingId(null)
      invalidate()
    },
  })

  const generateSquares = useMutation({
    mutationFn: async () => {
      const res = await api.api.pages.manage['generate-squares'].$post()
      return res.json()
    },
    onSuccess: invalidate,
  })

  const setGame = useMutation({
    mutationFn: async (game: { id: string; team1: string; team2: string }) => {
      const res = await api.api.pages.manage['set-game'].$post({
        json: { espnGameId: game.id, team1Name: game.team1, team2Name: game.team2 },
      })
      return res.json()
    },
    onSuccess: invalidate,
  })

  const recordHalftime = useMutation({
    mutationFn: async () => {
      const res = await api.api.pages.manage['record-halftime-winner'].$post()
      return res.json()
    },
    onSuccess: invalidate,
  })

  if (isLoading) return <PageLoader />

  if (!data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400">{data?.error?.message ?? 'You do not have access to this page.'}</p>
        </div>
      </div>
    )
  }

  const d = data.data
  const participantsList = d.participants ?? []
  const squaresList = d.squares ?? []
  const config = d.config
  const totalSquares = participantsList.reduce((sum: number, p: any) => sum + p.squareCount, 0)

  // Build grid from squares data
  type GridCell = { participantId: string; name: string; imageUrl: string | null } | null
  const grid: GridCell[][] = Array.from({ length: 10 }, () => Array(10).fill(null))
  const pMap = new Map(participantsList.map((p: any) => [p.id, p]))
  for (const sq of squaresList) {
    if (sq.participantId) {
      const p = pMap.get(sq.participantId) as any
      if (p) {
        grid[sq.row]![sq.col] = { participantId: p.id, name: p.name, imageUrl: null }
      }
    }
  }
  const rowDigits = config?.rowDigits ? JSON.parse(config.rowDigits) : [0,1,2,3,4,5,6,7,8,9]
  const colDigits = config?.colDigits ? JSON.parse(config.colDigits) : [0,1,2,3,4,5,6,7,8,9]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-100">Manage Squares</h1>
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">View Grid</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Game Selection */}
        <section className="bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Game Selection</h2>
          {config?.espnGameId && (
            <p className="text-sm text-gray-400 mb-2">Current: {config.team1Name} vs {config.team2Name} (ID: {config.espnGameId})</p>
          )}
          {espnGames.data?.data?.games?.length > 0 ? (
            <div className="space-y-2">
              {espnGames.data.data.games.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-2 border border-gray-600 rounded">
                  <div>
                    <div className="font-medium text-sm">{g.shortName}</div>
                    <div className="text-xs text-gray-400">{new Date(g.date).toLocaleString()} - {g.status}</div>
                  </div>
                  <button
                    onClick={() => setGame.mutate({ id: g.id, team1: g.team1, team2: g.team2 })}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No games available from ESPN.</p>
          )}
        </section>

        {/* Participants */}
        <section className="bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">
            Participants ({totalSquares}/100 squares)
          </h2>

          {/* Add form */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded text-sm flex-1 min-w-[120px] placeholder-gray-400"
            />
            <input
              type="text"
              inputMode="numeric"
              value={squareCount}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setSquareCount(isNaN(val) ? 0 : val)
              }}
              className="px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded text-sm w-20"
              placeholder="Squares"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-300"
            />
            <button
              onClick={() => addParticipant.mutate()}
              disabled={!name || addParticipant.isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* List */}
          <div className="space-y-1">
            {participantsList.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <div className="flex items-center gap-2 text-sm">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium">{p.name}</span>
                  {editingId === p.id ? (
                    <span className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editSquareCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setEditSquareCount(isNaN(val) ? 0 : val)
                        }}
                        className="w-14 px-1 py-0.5 border border-gray-500 bg-gray-600 text-gray-100 rounded text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateSquares.mutate({ id: p.id, squareCount: editSquareCount })
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button
                        onClick={() => updateSquares.mutate({ id: p.id, squareCount: editSquareCount })}
                        className="text-xs text-green-400 hover:text-green-300"
                      >Save</button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >Cancel</button>
                    </span>
                  ) : (
                    <span className="text-gray-400">({p.squareCount} squares)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId !== p.id && (
                    <button
                      onClick={() => { setEditingId(p.id); setEditSquareCount(p.squareCount) }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                <button
                  onClick={() => removeParticipant.mutate(p.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Generate */}
        <section className="bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Generate Grid</h2>
          <p className="text-sm text-gray-400 mb-3">
            Randomly assign participants to the grid. Requires exactly 100 total squares.
          </p>
          <button
            onClick={() => {
              if (confirm('This will clear all current assignments. Continue?')) {
                generateSquares.mutate()
              }
            }}
            disabled={totalSquares !== 100 || generateSquares.isPending}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Generate Squares
          </button>
          {generateSquares.isError && (
            <p className="text-sm text-red-400 mt-2">Failed to generate. Ensure total is exactly 100.</p>
          )}
        </section>

        {/* Record halftime */}
        <section className="bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Record Winners</h2>
          <button
            onClick={() => recordHalftime.mutate()}
            disabled={recordHalftime.isPending}
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Record Halftime Winner
          </button>
        </section>

        {/* Grid Preview */}
        {squaresList.length > 0 && (
          <section className="bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Grid Preview</h2>
            <Grid
              grid={grid}
              rowDigits={rowDigits}
              colDigits={colDigits}
              team1Name={config?.team1Name ?? 'Away'}
              team2Name={config?.team2Name ?? 'Home'}
            />
          </section>
        )}
      </main>
    </div>
  )
}
