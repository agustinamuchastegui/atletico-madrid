'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Athlete, CheckIn } from '@/types'
import { Slider } from '@/components/ui/Slider'
import { CheckCircle, AlertCircle, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

      // Obtener últimos 7 check-ins para el gráfico
      const { data: recentData } = await supabase
        .from('checkins')
        .select('*')
        .eq('athlete_id', athleteData.id)
        .order('date', { ascending: false })
        .limit(7)

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

  const chartData = recentCheckins
    .slice()
    .reverse()
    .map(checkin => ({
      date: new Date(checkin.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      energy: checkin.energy,
      mood: checkin.mood
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
                <h2 className="text-2xl font-bold text-gray-800">Tendencia Semanal</h2>
              </div>
              <p className="text-gray-600">Evolución de tus métricas psicofisiológicas</p>
            </div>

            {recentCheckins.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />
                    <YAxis 
                      domain={[1, 10]} 
                      ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      tick={{ fontSize: 12 }}
                      stroke="#666"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#dc2626" 
                      strokeWidth={4}
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#dc2626' }}
                      name="Energía"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#2563eb" 
                      strokeWidth={4}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#2563eb' }}
                      name="Ánimo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos suficientes</h3>
                <p className="text-gray-500">Realiza más check-ins para ver tu progreso.</p>
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
