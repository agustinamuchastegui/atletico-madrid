'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Athlete, CheckIn } from '@/types'
import { Slider } from '@/components/ui/Slider'
import { CheckCircle, AlertCircle, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

export default function AthleteCheckinPage() {
  const params = useParams()
  const code = params.code as string
  
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [energy, setEnergy] = useState(7)
  const [mood, setMood] = useState(7)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState<CheckIn[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchAthleteData()
  }, [code])

  const fetchAthleteData = async () => {
    try {
      // Obtener atleta por código
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('*')
        .eq('code', code)
        .single()

      if (!athleteData) {
        setLoading(false)
        return
      }

      setAthlete(athleteData)

      // Verificar si ya hizo check-in hoy
      const today = new Date().toISOString().split('T')[0]
      const { data: todayCheckin } = await supabase
        .from('checkins')
        .select('*')
        .eq('athlete_id', athleteData.id)
        .eq('date', today)
        .single()

      setHasCheckedInToday(!!todayCheckin)

      // Obtener últimos 30 check-ins para el gráfico
      const { data: recentData } = await supabase
        .from('checkins')
        .select('*')
        .eq('athlete_id', athleteData.id)
        .order('date', { ascending: false })
        .limit(30)

      setRecentCheckins(recentData || [])
    } catch (error) {
      console.error('Error fetching athlete data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!athlete) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('checkins')
        .insert({
          athlete_id: athlete.id,
          energy,
          mood,
          date: new Date().toISOString().split('T')[0]
        })

      if (error) throw error

      setHasCheckedInToday(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      // Actualizar datos recientes
      fetchAthleteData()
    } catch (error) {
      console.error('Error submitting checkin:', error)
      alert('Error al guardar el check-in. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil de atleta...</p>
        </div>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Atleta no encontrado</h1>
          <p className="text-gray-600 mb-4">El código proporcionado no corresponde a ningún atleta registrado.</p>
        </div>
      </div>
    )
  }

  // Preparar datos para el gráfico
  const chartData = recentCheckins.map(checkin => ({
    x: checkin.mood,
    y: checkin.energy,
    date: new Date(checkin.date).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }))

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
              {athlete.name}
            </h1>
            <p className="text-lg text-gray-600">{athlete.position} - Atlético de Madrid</p>
          </div>
        </div>

        {/* Alert de éxito */}
        {showSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            ¡Check-in registrado exitosamente! Datos sincronizados con el sistema.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Check-in */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-800">Check-in Diario</h2>
              </div>
              <p className="text-gray-600">
                Registro neurofisiológico - {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {hasCheckedInToday ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Check-in Completado</h3>
                <p className="text-gray-600">Ya has registrado tu estado para hoy.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <Slider
                  value={energy}
                  onChange={setEnergy}
                  label="Nivel de Energía Física"
                  color="red"
                />
                
                <Slider
                  value={mood}
                  onChange={setMood}
                  label="Estado de Ánimo"
                  color="blue"
                />

                {/* Preview del punto actual */}
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-2">Tu estado actual:</p>
                  <div className="flex justify-between">
                    <span className="text-red-600 font-semibold">Energía: {energy}</span>
                    <span className="text-blue-600 font-semibold">Ánimo: {mood}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-red-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Confirmar Check-in'}
                </button>
              </div>
            )}
          </div>

          {/* Panel de Historial */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Mapa Emocional</h2>
              </div>
              <p className="text-gray-600">Evolución de tu estado psicofisiológico</p>
            </div>

            {recentCheckins.length > 0 || !hasCheckedInToday ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                    
                    {/* Eje X - Ánimo */}
                    <XAxis 
                      type="number"
                      domain={[0, 10]}
                      ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      tick={{ fontSize: 11 }}
                      stroke="#666"
                      label={{ 
                        value: 'ÁNIMO (Displacer ← → Placer)', 
                        position: 'insideBottom', 
                        offset: -50,
                        style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                      }}
                    />
                    
                    {/* Eje Y - Energía */}
                    <YAxis 
                      type="number"
                      domain={[0, 10]}
                      ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      tick={{ fontSize: 11 }}
                      stroke="#666"
                      label={{ 
                        value: 'ENERGÍA (Baja ← → Alta)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                      }}
                    />
                    
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                              <p className="font-semibold">{data.date}</p>
                              <p className="text-red-600">Energía: {data.y}</p>
                              <p className="text-blue-600">Ánimo: {data.x}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Puntos históricos */}
                    {chartData.length > 0 && (
                      <Scatter 
                        dataKey="y"
                        data={chartData}
                        fill="#8884d8"
                        shape={(props: any) => {
                          const { cx, cy } = props;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={6} 
                              fill="url(#gradient)" 
                              stroke="#fff" 
                              strokeWidth={2}
                              style={{
                                filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.3))'
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    
                    {/* Punto preview en tiempo real (solo si no ha hecho check-in hoy) */}
                    {!hasCheckedInToday && (
                      <ReferenceDot 
                        x={mood} 
                        y={energy} 
                        r={10}
                        fill="url(#previewGradient)"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        style={{
                          filter: 'drop-shadow(2px 2px 6px rgba(251,191,36,0.5))',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    )}
                    
                    {/* Gradientes */}
                    <defs>
                      <radialGradient id="gradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </radialGradient>
                      <radialGradient id="previewGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </radialGradient>
                    </defs>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos suficientes</h3>
                <p className="text-gray-500">Realiza más check-ins para ver tu evolución.</p>
              </div>
            )}

            {/* Leyenda del punto preview */}
            {!hasCheckedInToday && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                  Punto dorado = Tu estado actual (mueve los sliders para ver el cambio)
                </p>
              </div>
            )}

            {/* Estadísticas rápidas */}
            {recentCheckins.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Energía Promedio</p>
                  <p className="text-2xl font-bold text-red-700">
                    {(recentCheckins.reduce((sum, c) => sum + c.energy, 0) / recentCheckins.length).toFixed(1)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Ánimo Promedio</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {(recentCheckins.reduce((sum, c) => sum + c.mood, 0) / recentCheckins.length).toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
