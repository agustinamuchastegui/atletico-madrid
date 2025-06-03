'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Athlete, CheckIn, AthleteStats } from '@/types'
import { Users, TrendingUp, Calendar, Activity, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AdminPanel() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [todayCheckins, setTodayCheckins] = useState<CheckIn[]>([])
  const [stats, setStats] = useState<Record<string, AthleteStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Obtener atletas
      const { data: athletesData } = await supabase
        .from('athletes')
        .select('*')
        .eq('active', true)
        .order('name')

      // Obtener check-ins de hoy
      const today = new Date().toISOString().split('T')[0]
      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('*, athlete:athletes(*)')
        .eq('date', today)

      // Obtener estadísticas para cada atleta
      const statsData: Record<string, AthleteStats> = {}
      if (athletesData) {
        for (const athlete of athletesData) {
          const { data } = await supabase
            .rpc('get_athlete_stats', { athlete_uuid: athlete.id })
          if (data && data[0]) {
            statsData[athlete.id] = data[0]
          }
        }
      }

      setAthletes(athletesData || [])
      setTodayCheckins(checkinsData || [])
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionRate = () => {
    return athletes.length > 0 ? (todayCheckins.length / athletes.length) * 100 : 0
  }

  const getAverageEnergy = () => {
    if (todayCheckins.length === 0) return 0
    return todayCheckins.reduce((sum, checkin) => sum + checkin.energy, 0) / todayCheckins.length
  }

  const getAverageMood = () => {
    if (todayCheckins.length === 0) return 0
    return todayCheckins.reduce((sum, checkin) => sum + checkin.mood, 0) / todayCheckins.length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos neurofisiológicos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ATLÉTICO DE MADRID
          </h1>
          <p className="text-xl text-gray-600">Sistema de Monitoreo Neuroconductual</p>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Completado</p>
                <p className="text-3xl font-bold text-red-600">{getCompletionRate().toFixed(0)}%</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atletas Activos</p>
                <p className="text-3xl font-bold text-blue-600">{athletes.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energía Promedio</p>
                <p className="text-3xl font-bold text-green-600">{getAverageEnergy().toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ánimo Promedio</p>
                <p className="text-3xl font-bold text-purple-600">{getAverageMood().toFixed(1)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Lista de Atletas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Estado de Atletas</h2>
            <p className="text-gray-600">Monitoreo psicofisiológico en tiempo real</p>
          </div>
          
          <div className="p-6">
            <div className="grid gap-4">
              {athletes.map((athlete) => {
                const todayCheckin = todayCheckins.find(c => c.athlete_id === athlete.id)
                const athleteStats = stats[athlete.id]
                
                return (
                  <div key={athlete.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${todayCheckin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h3 className="font-semibold text-lg">{athlete.name}</h3>
                          <p className="text-gray-600">{athlete.position}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {todayCheckin ? (
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Energía</p>
                              <p className="text-xl font-bold text-red-600">{todayCheckin.energy}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Ánimo</p>
                              <p className="text-xl font-bold text-blue-600">{todayCheckin.mood}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Sin check-in hoy</p>
                        )}
                        
                        {athleteStats && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Registros</p>
                            <p className="text-lg font-semibold">{athleteStats.total_checkins}</p>
                          </div>
                        )}
                        
                        <Link
                          href={`/${athlete.code}`}
                          className="bg-gradient-to-r from-red-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>Check-in</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}