import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useSensorData } from './hooks/useSensorData'

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:      '#050c1a',
  card:    '#0b1225',
  border:  '#1a2540',
  blue:    '#3b82f6',
  amber:   '#f59e0b',
  green:   '#10b981',
  red:     '#ef4444',
  purple:  '#a855f7',
  muted:   '#4b5675',
  sub:     '#94a3b8',
  text:    '#e2e8f0',
}

const STATUS_COLOR = { ok: C.green, warning: C.amber, critical: C.red }
const STATUS_LABEL = { ok: 'OPERATIVA',  warning: 'ADVERTENCIA', critical: 'CRÍTICO' }
const STATUS_BG    = { ok: '#041a0e',    warning: '#1a1200',     critical: '#1a0505' }

const pad2 = n => String(n).padStart(2, '0')
function fmtUptime(s) {
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, icon }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${color}35`,
      borderRadius: 12, padding: '16px 18px',
    }}>
      <div style={{ color: C.sub, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>{label}
      </div>
      <div style={{ color, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 13, fontWeight: 400, color: C.sub, marginLeft: 5 }}>{unit}</span>
      </div>
    </div>
  )
}

// ─── PumpStatus ──────────────────────────────────────────────────────────────
function PumpStatus({ status, stateLabel, uptime }) {
  const color = STATUS_COLOR[status]
  const anim  = status === 'critical' ? 'pulse-red 1s infinite' : status === 'warning' ? 'pulse-amber 2s infinite' : 'none'
  return (
    <div style={{
      background: STATUS_BG[status], border: `2px solid ${color}50`,
      borderRadius: 12, padding: '20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, textAlign: 'center',
    }}>
      <div style={{
        width: 66, height: 66, borderRadius: '50%',
        border: `3px solid ${color}`,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: anim,
        fontSize: 30,
      }}>
        {status === 'critical' ? '⚠️' : status === 'warning' ? '⚡' : '✅'}
      </div>
      <div style={{ color, fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>
        {STATUS_LABEL[status]}
      </div>
      <div style={{ color: C.sub, fontSize: 10, letterSpacing: 1 }}>BOMBA · MARCOS PAZ</div>
      <div style={{ color: C.muted, fontSize: 11 }}>⏱ {fmtUptime(uptime)}</div>
    </div>
  )
}

// ─── LiveChart ───────────────────────────────────────────────────────────────
function LiveChart({ data, dataKey, color, label, unit, domain, refs = [] }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
        <span style={{ color: C.sub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</span>
        <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 10 }}>últimos {data.length}s</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
          <YAxis
            domain={domain} width={44}
            tick={{ fill: C.muted, fontSize: 9 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}${unit}`}
          />
          {refs.map(rf => (
            <ReferenceLine key={rf.v} y={rf.v} stroke={rf.c} strokeDasharray="4 4" strokeWidth={1} />
          ))}
          <Tooltip
            contentStyle={{ background: '#0b1225', border: `1px solid ${color}50`, borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: C.sub }}
            itemStyle={{ color }}
            formatter={v => [`${v} ${unit}`, label]}
            isAnimationActive={false}
          />
          <Area
            type="monotone" dataKey={dataKey}
            stroke={color} strokeWidth={2}
            fill={`url(#g-${dataKey})`}
            dot={false} isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── AIPrediction ────────────────────────────────────────────────────────────
function AIPrediction({ prediction, status }) {
  const color  = STATUS_COLOR[status]
  const health = status === 'critical' ? 8 : status === 'warning' ? 42 : 86

  return (
    <div style={{
      background: C.card, border: `1px solid ${color}40`,
      borderRadius: 12, padding: '18px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>Predicción IA</span>
        <span style={{
          marginLeft: 'auto', fontSize: 9, padding: '2px 8px', borderRadius: 50,
          background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}50`,
          letterSpacing: 1,
        }}>ML · ACTIVO</span>
      </div>

      {/* Health bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: C.sub, fontSize: 10, letterSpacing: 1 }}>SALUD DEL SISTEMA</span>
          <span style={{ color, fontSize: 11, fontWeight: 700 }}>{health}%</span>
        </div>
        <div style={{ background: '#0d1e30', borderRadius: 50, height: 7, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 50,
            width: `${health}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            transition: 'width 1.2s ease, background 1s ease',
          }} />
        </div>
      </div>

      {/* Days */}
      <div style={{
        textAlign: 'center', padding: '12px 10px',
        background: `${color}12`, borderRadius: 10, border: `1px solid ${color}30`,
      }}>
        <div style={{ color, fontSize: 42, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {prediction.dias === 0 ? '⚠️' : prediction.dias}
        </div>
        <div style={{ color: C.sub, fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
          {prediction.dias === 0 ? 'ACCIÓN INMEDIATA' : 'DÍAS HASTA MANTENIMIENTO'}
        </div>
      </div>

      {/* Confidence */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0d1e30', borderRadius: 8 }}>
        <span style={{ color: C.sub, fontSize: 10, letterSpacing: 1 }}>CONFIANZA DEL MODELO</span>
        <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{prediction.confianza}%</span>
      </div>

      {/* Sensors used */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: 'MPU6050', color: C.blue  },
          { label: 'DS18B20', color: C.amber },
          { label: 'ACS712',  color: C.green },
        ].map(s => (
          <span key={s.label} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 50,
            background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}40`,
            letterSpacing: 0.5,
          }}>{s.label}</span>
        ))}
      </div>

      {/* Action */}
      <div style={{
        background: `${color}10`, border: `1px solid ${color}35`,
        borderRadius: 8, padding: '10px 12px',
        fontSize: 11, color: C.text, lineHeight: 1.6,
      }}>
        {prediction.accion}
      </div>
    </div>
  )
}

// ─── AlertLog ────────────────────────────────────────────────────────────────
function AlertLog({ alerts }) {
  const LC = { ok: C.green, warning: C.amber, critical: C.red }
  const LI = { ok: '🟢', warning: '🟡', critical: '🔴' }
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px' }}>
      <div style={{ color: C.sub, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
        📋 Log de alertas
      </div>
      <div style={{ maxHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {alerts.length === 0 && (
          <div style={{ color: C.muted, fontSize: 12, padding: '8px 0' }}>Sin alertas registradas aún.</div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            padding: '7px 10px', borderRadius: 8, fontSize: 11,
            background: `${LC[a.level]}0d`, border: `1px solid ${LC[a.level]}25`,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 12, marginTop: 1 }}>{LI[a.level]}</span>
            <span style={{ color: C.muted, fontSize: 10, minWidth: 60, marginTop: 1, flexShrink: 0 }}>{a.time}</span>
            <span style={{ color: C.text, lineHeight: 1.5 }}>{a.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DemoControls ─────────────────────────────────────────────────────────────
function DemoControls({ currentState, setManualState, resumeAuto, manualMode }) {
  const btns = [
    { state: 'normal',       label: '✅ Normal',         color: C.green  },
    { state: 'vib_warning',  label: '⚡ Vib. Leve',     color: C.amber  },
    { state: 'vib_critical', label: '🔴 Falla de Eje',  color: C.red    },
    { state: 'temp_warning', label: '🌡 Temp. Alta',    color: C.amber  },
    { state: 'recovery',     label: '🔄 Recuperación',  color: C.purple },
  ]
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px' }}>
      <div style={{ color: C.sub, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
        🎮 Controles de demo
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
        {btns.map(b => {
          const active = currentState === b.state
          return (
            <button
              key={b.state}
              onClick={() => setManualState(b.state)}
              style={{
                padding: '7px 13px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: active ? `${b.color}20` : 'transparent',
                color:      active ? b.color : C.muted,
                border:     `1px solid ${active ? b.color : C.border}`,
              }}
            >
              {b.label}
            </button>
          )
        })}
      </div>
      <button
        onClick={resumeAuto}
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 10, cursor: 'pointer',
          background: !manualMode ? `${C.blue}18` : 'transparent',
          color:      !manualMode ? C.blue : C.muted,
          border:     `1px solid ${!manualMode ? C.blue : C.border}`,
          letterSpacing: 1,
        }}
      >
        {manualMode ? '▶ REANUDAR MODO AUTOMÁTICO' : '✓ MODO AUTOMÁTICO ACTIVO'}
      </button>
      <div style={{ marginTop: 12, padding: '10px', background: '#0a1628', borderRadius: 8, fontSize: 10, color: C.muted, lineHeight: 1.7 }}>
        <strong style={{ color: C.sub }}>Sensores simulados:</strong><br />
        MPU6050 → vibración (g) &nbsp;·&nbsp; DS18B20 → temperatura (°C) &nbsp;·&nbsp; ACS712 → corriente (A)
      </div>
    </div>
  )
}

// ─── Dashboard (main) ────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    history, latest, status, stateLabel, currentState,
    prediction, alerts, uptime,
    setManualState, resumeAuto, manualMode,
  } = useSensorData()

  const sc = STATUS_COLOR[status]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-logo" style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.blue}30, ${C.blue}10)`,
            border: `1px solid ${C.blue}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>💧</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bomba Predictiva · Marcos Paz</div>
            <div className="dash-header-subtitle">SISTEMA DE MONITOREO CON INTELIGENCIA ARTIFICIAL</div>
          </div>
        </div>

        <div className="dash-header-right">
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sub, fontSize: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'blink 1.5s infinite' }} />
            EN VIVO
          </div>
          {/* Status badge */}
          <div style={{
            padding: '5px 14px', borderRadius: 50, fontSize: 11, fontWeight: 700,
            background: `${sc}18`, color: sc, border: `1px solid ${sc}50`,
            letterSpacing: 1,
          }}>
            {STATUS_LABEL[status]}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="dash-body">

        {/* Row 1: stat cards + pump status */}
        <div className="dash-row1">
          <StatCard label="Vibración"   value={latest.vib?.toFixed(2) ?? '—'} unit="g"  color={C.blue}   icon="📳" />
          <StatCard label="Temperatura" value={latest.temp?.toFixed(1) ?? '—'} unit="°C" color={C.amber}  icon="🌡️" />
          <StatCard label="Corriente"   value={latest.curr?.toFixed(1) ?? '—'} unit="A"  color={C.green}  icon="⚡" />
          <StatCard label="Frecuencia"  value="50.0"                            unit="Hz" color={C.purple} icon="〰️" />
          <PumpStatus status={status} stateLabel={stateLabel} uptime={uptime} />
        </div>

        {/* Row 2: charts (left) + AI panel (right) */}
        <div className="dash-row2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LiveChart
              data={history} dataKey="vib" color={C.blue}
              label="Vibración del eje" unit="g" domain={[0, 2.6]}
              refs={[{ v: 0.35, c: C.amber }, { v: 0.95, c: C.red }]}
            />
            <LiveChart
              data={history} dataKey="temp" color={C.amber}
              label="Temperatura del rodamiento" unit="°C" domain={[30, 90]}
              refs={[{ v: 60, c: C.amber }, { v: 75, c: C.red }]}
            />
            <LiveChart
              data={history} dataKey="curr" color={C.green}
              label="Corriente del motor" unit="A" domain={[6, 22]}
              refs={[{ v: 13, c: C.amber }, { v: 17, c: C.red }]}
            />
          </div>
          <AIPrediction prediction={prediction} status={status} />
        </div>

        {/* Row 3: alert log + demo controls */}
        <div className="dash-row3">
          <AlertLog alerts={alerts} />
          <DemoControls
            currentState={currentState}
            setManualState={setManualState}
            resumeAuto={resumeAuto}
            manualMode={manualMode}
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, color: C.muted, fontSize: 10, letterSpacing: 1 }}>
          Proyecto UiiA 2026 · Escuela Secundaria · Marcos Paz, Buenos Aires · Argentina
        </div>
      </div>
    </div>
  )
}
