"use client";
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, Bar, BarChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { clsx } from 'clsx'

type Student = {
  student_id: number
  name: string
  class: string
  comprehension: number
  attention: number
  focus: number
  retention: number
  assessment_score: number
  engagement_time: number
  persona?: string
}

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<keyof Student>('assessment_score')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/students.json')
      .then(r => r.json())
      .then((d: Student[]) => setStudents(d))
      .catch(() => setStudents([]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return students
      .filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q))
      .sort((a,b) => {
        const av = a[sortKey] as unknown as number | string
        const bv = b[sortKey] as unknown as number | string
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
  }, [students, query, sortKey, sortDir])

  const averages = useMemo(() => {
    if (students.length === 0) return null
    const sum = (k: keyof Student) => students.reduce((acc, s) => acc + (s[k] as unknown as number || 0), 0)
    const n = students.length
    return {
      assessment: (sum('assessment_score')/n).toFixed(1),
      attention: (sum('attention')/n).toFixed(1),
      focus: (sum('focus')/n).toFixed(1),
      retention: (sum('retention')/n).toFixed(1),
      comprehension: (sum('comprehension')/n).toFixed(1),
      engagement: (sum('engagement_time')/n).toFixed(1),
    }
  }, [students])

  const barData = useMemo(() => {
    if (students.length === 0) return []
    return [
      { skill: 'Attention', average: avg(students, 'attention'), score: avg(students, 'assessment_score') },
      { skill: 'Focus', average: avg(students, 'focus'), score: avg(students, 'assessment_score') },
      { skill: 'Retention', average: avg(students, 'retention'), score: avg(students, 'assessment_score') },
      { skill: 'Comprehension', average: avg(students, 'comprehension'), score: avg(students, 'assessment_score') }
    ]
  }, [students])

  const scatterData = useMemo(() => students.map(s => ({ x: s.attention, y: s.assessment_score })), [students])
  const regression = useMemo(() => linearRegression(scatterData), [scatterData])

  const selected = useMemo(() => students.find(s => s.student_id === selectedId) || students[0], [students, selectedId])

  const insights = useMemo(() => generateInsights(students), [students])

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard title="Avg Score" value={averages?.assessment ?? '—'} suffix="/100" />
        <MetricCard title="Avg Attention" value={averages?.attention ?? '—'} suffix="/100" />
        <MetricCard title="Avg Focus" value={averages?.focus ?? '—'} suffix="/100" />
        <MetricCard title="Avg Retention" value={averages?.retention ?? '—'} suffix="/100" />
        <MetricCard title="Avg Comprehension" value={averages?.comprehension ?? '—'} suffix="/100" />
        <MetricCard title="Avg Engagement" value={averages?.engagement ?? '—'} suffix="m" />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Average Skill vs Assessment</h3></div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" name="Avg Skill" fill="#5b6cff" radius={[6,6,0,0]} />
                <Bar dataKey="score" name="Avg Score" fill="#22c55e" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Attention vs Assessment (with regression)</h3></div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Attention" domain={[0,100]} />
                <YAxis type="number" dataKey="y" name="Score" domain={[0,100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Students" data={scatterData} fill="#1f2937" />
                <Line type="linear" dataKey="y" data={regressionLineData(regression)} dot={false} stroke="#ef4444" strokeWidth={2} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Radar + Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold">Student Profile (Radar)</h3>
            <select className="border rounded-md px-2 py-1" value={selected?.student_id ?? ''} onChange={(e) => setSelectedId(Number(e.target.value))}>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>{s.name} (#{s.student_id})</option>
              ))}
            </select>
          </div>
          <div className="card-body h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={selected ? [
                { subject: 'Attention', A: selected.attention },
                { subject: 'Focus', A: selected.focus },
                { subject: 'Retention', A: selected.retention },
                { subject: 'Comprehension', A: selected.comprehension },
              ] : []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Profile" dataKey="A" stroke="#5b6cff" fill="#5b6cff" fillOpacity={0.4} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Insights</h3></div>
          <div className="card-body space-y-3">
            {insights.map((t, i) => (
              <div key={i} className="rounded-lg border p-3 bg-brand-50 border-brand-100">
                <p className="text-sm"><span className="font-medium">Insight:</span> {t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold">Students</h3>
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name or class..." className="px-3 py-2 border rounded-md w-64" />
            <select className="border rounded-md px-2 py-2" value={String(sortKey)} onChange={(e)=>setSortKey(e.target.value as keyof Student)}>
              <option value="name">Name</option>
              <option value="class">Class</option>
              <option value="assessment_score">Score</option>
            </select>
            <button className="px-3 py-2 border rounded-md" onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')}>{sortDir==='asc'?'Asc':'Desc'}</button>
          </div>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Class</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Attention</th>
                <th className="py-2 pr-4">Focus</th>
                <th className="py-2 pr-4">Retention</th>
                <th className="py-2 pr-4">Comprehension</th>
                <th className="py-2 pr-4">Engagement (m)</th>
                <th className="py-2 pr-4">Persona</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.student_id} className="border-t">
                  <td className="py-2 pr-4">{s.student_id}</td>
                  <td className="py-2 pr-4">{s.name}</td>
                  <td className="py-2 pr-4">{s.class}</td>
                  <td className="py-2 pr-4 font-medium">{s.assessment_score}</td>
                  <td className="py-2 pr-4">{s.attention}</td>
                  <td className="py-2 pr-4">{s.focus}</td>
                  <td className="py-2 pr-4">{s.retention}</td>
                  <td className="py-2 pr-4">{s.comprehension}</td>
                  <td className="py-2 pr-4">{s.engagement_time}</td>
                  <td className="py-2 pr-4"><PersonaTag persona={s.persona} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function avg(arr: Student[], key: keyof Student) {
  if (arr.length === 0) return 0
  return arr.reduce((a, s) => a + (s[key] as unknown as number || 0), 0) / arr.length
}

function linearRegression(data: {x:number,y:number}[]) {
  const n = data.length || 1
  const sumX = data.reduce((a,d)=>a+d.x,0)
  const sumY = data.reduce((a,d)=>a+d.y,0)
  const sumXY = data.reduce((a,d)=>a+d.x*d.y,0)
  const sumX2 = data.reduce((a,d)=>a+d.x*d.x,0)
  const slope = (n*sumXY - sumX*sumY) / Math.max(1e-9, (n*sumX2 - sumX*sumX))
  const intercept = (sumY - slope*sumX) / n
  return { slope, intercept }
}

function regressionLineData(lr: {slope:number,intercept:number}) {
  const points = [] as {x:number,y:number}[]
  for (let x=0; x<=100; x+=5) {
    points.push({ x, y: Math.max(0, Math.min(100, lr.slope*x + lr.intercept)) })
  }
  return points
}

function PersonaTag({ persona }: { persona?: string }) {
  const color = personaColor(persona)
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs border', color)}>{persona ?? '—'}</span>
  )
}

function personaColor(p?: string) {
  switch (p) {
    case 'High Achievers': return 'bg-green-50 text-green-700 border-green-200'
    case 'Consistent Engagers': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'Distracted Learners': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Under-engaged': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function MetricCard({ title, value, suffix }: { title: string; value: string; suffix?: string }) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
      </div>
    </div>
  )
}

function generateInsights(students: Student[]): string[] {
  if (students.length === 0) return [
    'Load data to see insights generated from correlations and distributions.'
  ]
  const corrAF = correlation(students.map(s=>s.attention), students.map(s=>s.assessment_score))
  const corrF = correlation(students.map(s=>s.focus), students.map(s=>s.assessment_score))
  const corrR = correlation(students.map(s=>s.retention), students.map(s=>s.assessment_score))
  const avgEng = avg(students, 'engagement_time')
  const tips = [] as string[]
  tips.push(`Focus shows ${strength(corrF)} correlation with performance (r=${corrF.toFixed(2)}).`)
  tips.push(`Retention shows ${strength(corrR)} correlation with performance (r=${corrR.toFixed(2)}).`)
  tips.push(`Attention has ${strength(corrAF)} correlation with performance (r=${corrAF.toFixed(2)}).`)
  tips.push(`Average engagement time is ${avgEng.toFixed(1)} minutes.`)
  return tips
}

function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const ma = a.reduce((x,y)=>x+y,0)/n
  const mb = b.reduce((x,y)=>x+y,0)/n
  let num = 0, da = 0, db = 0
  for (let i=0;i<n;i++){
    const va = a[i]-ma, vb = b[i]-mb
    num += va*vb
    da += va*va
    db += vb*vb
  }
  return num / Math.max(1e-9, Math.sqrt(da*db))
}

function strength(r: number) {
  const ar = Math.abs(r)
  if (ar > 0.7) return 'a strong'
  if (ar > 0.4) return 'a moderate'
  if (ar > 0.2) return 'a weak'
  return 'little to no'
}


