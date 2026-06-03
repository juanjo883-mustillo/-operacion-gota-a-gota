import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_POINTS = 50

const r = (min, max) => +(min + Math.random() * (max - min)).toFixed(2)

export const STATES = {
  normal:       { vib: [0.05, 0.22], temp: [37, 44],  curr: [8.2,  9.5],  label: 'Normal',            status: 'ok'       },
  vib_warning:  { vib: [0.40, 0.80], temp: [46, 58],  curr: [10.5, 13.0], label: 'Vibración anómala', status: 'warning'  },
  vib_critical: { vib: [1.00, 2.20], temp: [62, 75],  curr: [14.0, 19.0], label: 'FALLA INMINENTE',   status: 'critical' },
  temp_warning: { vib: [0.15, 0.30], temp: [68, 80],  curr: [11.0, 13.5], label: 'Temperatura alta',  status: 'warning'  },
  recovery:     { vib: [0.20, 0.45], temp: [44, 54],  curr: [9.0,  11.5], label: 'Recuperando',       status: 'warning'  },
}

const CYCLE = [
  { state: 'normal',       duration: 22 },
  { state: 'vib_warning',  duration: 14 },
  { state: 'vib_critical', duration: 10 },
  { state: 'recovery',     duration: 12 },
  { state: 'normal',       duration: 18 },
  { state: 'temp_warning', duration: 13 },
  { state: 'recovery',     duration: 9  },
]

const PREDICTIONS = {
  normal:       { dias: 18, confianza: 94, accion: 'Sin anomalías detectadas. Próximo mantenimiento programado en 18 días.' },
  vib_warning:  { dias: 6,  confianza: 87, accion: 'Vibración anómala en eje de rotación. Revisar rodamiento delantero y estado de balanceo.' },
  vib_critical: { dias: 0,  confianza: 98, accion: 'DETENER BOMBA. Rodamiento en punto de falla inminente. Lubricar de inmediato.' },
  temp_warning: { dias: 3,  confianza: 91, accion: 'Temperatura fuera de rango nominal. Lubricar rodamiento trasero antes de 72 hs.' },
  recovery:     { dias: 5,  confianza: 83, accion: 'Anomalía en descenso. Programar inspección preventiva en los próximos 5 días.' },
}

export function useSensorData() {
  const [history, setHistory]           = useState([])
  const [currentState, setCurrentState] = useState('normal')
  const [alerts, setAlerts]             = useState([])
  const [uptime, setUptime]             = useState(0)
  const [manualMode, setManualMode]     = useState(false)

  const stateRef   = useRef('normal')
  const manualRef  = useRef(false)
  const cycleRef   = useRef({ idx: 0, elapsed: 0 })
  const prevStatus = useRef('ok')

  const setManualState = useCallback((state) => {
    manualRef.current = true
    stateRef.current  = state
    setManualMode(true)
    setCurrentState(state)
  }, [])

  const resumeAuto = useCallback(() => {
    manualRef.current = false
    setManualMode(false)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(u => u + 1)

      if (!manualRef.current) {
        const c = cycleRef.current
        c.elapsed++
        if (c.elapsed >= CYCLE[c.idx].duration) {
          c.elapsed = 0
          c.idx = (c.idx + 1) % CYCLE.length
          stateRef.current = CYCLE[c.idx].state
          setCurrentState(CYCLE[c.idx].state)
        }
      }

      const st  = stateRef.current
      const cfg = STATES[st]
      const ts  = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      const point = {
        time: ts,
        vib:  r(...cfg.vib),
        temp: r(...cfg.temp),
        curr: r(...cfg.curr),
      }

      setHistory(h => [...h, point].slice(-MAX_POINTS))

      if (cfg.status !== prevStatus.current) {
        const lvl = cfg.status
        const msg =
          lvl === 'critical' ? `CRÍTICO: ${cfg.label} — Falla inminente detectada por IA`
          : lvl === 'warning' ? `ADVERTENCIA: ${cfg.label}`
          : 'Sistema normalizado. Parámetros dentro de rango operativo.'
        setAlerts(a => [{ id: Date.now(), time: ts, msg, level: lvl }, ...a].slice(0, 15))
        prevStatus.current = cfg.status
      }
    }, 1000)

    return () => clearInterval(id)
  }, [])

  const latest = history.at(-1) ?? { vib: 0, temp: 0, curr: 0 }
  const cfg    = STATES[currentState]

  return {
    history,
    latest,
    status:      cfg.status,
    stateLabel:  cfg.label,
    currentState,
    prediction:  PREDICTIONS[currentState],
    alerts,
    uptime,
    setManualState,
    resumeAuto,
    manualMode,
  }
}
