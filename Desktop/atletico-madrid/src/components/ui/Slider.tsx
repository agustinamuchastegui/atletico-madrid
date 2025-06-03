'use client'
import React from 'react'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  color: 'red' | 'blue'
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  color
}) => {
  const colorClasses = {
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-lg font-semibold text-gray-800">{label}</label>
        <span className={`px-4 py-2 rounded-full text-white font-bold text-lg ${colorClasses[color]}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${colorClasses[color]}`}
        style={{
          background: `linear-gradient(to right, ${color === 'red' ? '#ef4444' : '#3b82f6'} 0%, ${color === 'red' ? '#dc2626' : '#2563eb'} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>Muy Bajo ({min})</span>
        <span>Excelente ({max})</span>
      </div>
    </div>
  )
}