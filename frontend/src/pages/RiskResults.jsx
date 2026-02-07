import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assessmentsAPI } from '../services/api'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Umbrella,
  Thermometer,
  Droplets,
  TrendingDown,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader
} from 'lucide-react'

function RiskGauge({ score }) {
  const rotation = (score / 100) * 180 - 90
  const getColor = () => {
    if (score <= 35) return { color: '#10B981', label: 'Low' }
    if (score <= 65) return { color: '#F59E0B', label: 'Moderate' }
    return { color: '#DC2626', label: 'High' }
  }
  const { color, label } = getColor()

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20">
        <svg className="w-40 h-20" viewBox="0 0 200 100">
          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 267} 267`}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
        </svg>
        <div
          className="absolute bottom-0 left-1/2 w-0.5 h-14 origin-bottom transition-transform duration-500"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            background: 'linear-gradient(to top, white, rgba(255,255,255,0.6))',
            borderRadius: 2
          }}
        />
        <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 -translate-x-1/2 translate-y-1/2 bg-white rounded-full shadow-md" />
      </div>
      <div className="mt-3 text-center">
        <span className="text-3xl font-bold text-white font-mono-nums">{score}</span>
        <span className="text-slate-400 text-lg font-mono-nums">/100</span>
      </div>
      <span
        className="text-xs font-semibold mt-1 px-2.5 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label} risk
      </span>
    </div>
  )
}

function DefaultProbabilityBar({ baseline, adjusted }) {
  const baselinePct = (baseline * 100).toFixed(0)
  const adjustedPct = (adjusted * 100).toFixed(0)
  const reduction = baseline > 0 ? ((baseline - adjusted) / baseline * 100).toFixed(0) : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Without climate data</span>
        <span className="font-mono-nums text-red-400 font-medium">{baselinePct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-red-500/50 rounded-full" style={{ width: `${baselinePct}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">With climate data</span>
        <span className="font-mono-nums text-[#14B8A6] font-medium">{adjustedPct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: `${adjustedPct}%` }} />
      </div>
      {reduction > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{reduction}% reduction with recommended modifications</span>
        </div>
      )}
    </div>
  )
}

const recConfig = {
  approve: {
    icon: CheckCircle,
    label: 'Approve',
    sublabel: 'with climate-adaptive terms',
    heroClass: 'recommendation-approve',
    iconColor: 'text-[#10B981]'
  },
  caution: {
    icon: AlertTriangle,
    label: 'Caution',
    sublabel: 'approve with enhanced monitoring',
    heroClass: 'recommendation-caution',
    iconColor: 'text-[#F59E0B]'
  },
  defer: {
    icon: XCircle,
    label: 'Defer',
    sublabel: 'high climate risk — review required',
    heroClass: 'recommendation-defer',
    iconColor: 'text-[#DC2626]'
  }
}

const recDetails = {
  approve: [
    'Bundle flood insurance ($25)',
    'Defer 1st payment to Nov',
    'Extend term to 15 months'
  ],
  caution: [
    'Mandatory crop insurance',
    'Quarterly review during peak season',
    'Consider 70% of requested amount'
  ],
  defer: [
    'Request senior officer review',
    'Explore alternative loan structure',
    'Recommend client adaptation plan'
  ]
}

function ClimateFactors({ factors }) {
  const factorIcons = {
    flood: { icon: Droplets, color: 'text-[#0EA5E9]' },
    drought: { icon: Thermometer, color: 'text-orange-400' },
    heatwave: { icon: Thermometer, color: 'text-red-400' },
    insurance: { icon: Shield, color: 'text-[#14B8A6]' }
  }
  return (
    <div className="space-y-2">
      {factors.map((factor, i) => {
        const config = factorIcons[factor.type] || factorIcons.flood
        const Icon = config.icon
        return (
          <div key={i} className="flex items-center gap-3">
            <Icon className={`w-4 h-4 ${config.color}`} />
            <div className="flex-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#DC2626]"
                  style={{ width: `${factor.value * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono-nums text-slate-400 w-8 text-right">{(factor.value * 100).toFixed(0)}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RiskResults() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const { mfi } = useAuth()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandAnalysis, setExpandAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    const data = sessionStorage.getItem(`assessment_${assessmentId}`)
    if (data) {
      const parsedData = JSON.parse(data)
      if (parsedData.results && parsedData.recommendation) {
        setAssessment({
          locationName: parsedData.location?.name || 'Unknown',
          loanAmount: parsedData.loanDetails?.amount,
          loanPurpose: parsedData.loanDetails?.purpose,
          cropType: parsedData.loanDetails?.cropType,
          climateRiskScore: parsedData.results.climateRiskScore,
          defaultProbabilityBaseline: parsedData.results.defaultProbability?.unadjusted || 0.2,
          defaultProbabilityAdjusted: parsedData.results.defaultProbability?.adjusted || 0.15,
          recommendationType: parsedData.recommendation.type,
          climateFactors: [
            { type: 'flood', label: 'Flood Risk', value: parsedData.results.riskFactors?.flood?.value || 0.3 },
            { type: 'drought', label: 'Drought Risk', value: parsedData.results.riskFactors?.drought?.value || 0.2 },
            { type: 'heatwave', label: 'Heat Stress', value: parsedData.results.riskFactors?.heatwave?.value || 0.25 }
          ],
          products: parsedData.products || [
            { name: 'Weather-Indexed Insurance', description: 'Automatic payout on adverse weather events' },
            { name: 'Flexible Repayment', description: 'Grace period during high-risk seasons' }
          ],
          recommendation: parsedData.recommendation
        })
      } else {
        const lat = parseFloat(parsedData.latitude || 24)
        let baseClimateRisk = 45
        if (lat > 20 && lat < 30) baseClimateRisk = 62
        if (lat < 0 && lat > -5) baseClimateRisk = 48
        if (lat < -10 && lat > -20) baseClimateRisk = 55
        if (parsedData.cropType === 'rice') baseClimateRisk += 10
        if (parsedData.cropType === 'coffee') baseClimateRisk += 5
        const climateRisk = Math.min(95, Math.max(15, baseClimateRisk + Math.random() * 15 - 7))
        const baselineDefault = 0.15 + (climateRisk / 100) * 0.2
        const adjustedDefault = baselineDefault * 0.65
        let recommendationType = 'approve'
        if (climateRisk > 70) recommendationType = 'defer'
        else if (climateRisk > 50) recommendationType = 'caution'
        setAssessment({
          ...parsedData,
          climateRiskScore: Math.round(climateRisk),
          defaultProbabilityBaseline: baselineDefault,
          defaultProbabilityAdjusted: adjustedDefault,
          recommendationType,
          climateFactors: [
            { type: 'flood', label: 'Flood Risk (Monsoon)', value: 0.3 + Math.random() * 0.4 },
            { type: 'drought', label: 'Drought Risk', value: 0.1 + Math.random() * 0.3 },
            { type: 'heatwave', label: 'Heat Stress', value: 0.2 + Math.random() * 0.3 }
          ],
          products: [
            { name: 'Weather-Indexed Insurance', description: 'Automatic payout on adverse weather' },
            { name: 'Flexible Repayment Schedule', description: 'Grace period during monsoon' },
            { name: 'Climate Resilience Training', description: 'Agricultural best practices' }
          ]
        })
      }
    }
    setLoading(false)
  }, [assessmentId])

  const generateAiAnalysis = async () => {
    try {
      setAiLoading(true)
      setAiError(null)
      const result = await assessmentsAPI.analyzeAssessment(assessmentId, {
        clientName: assessment.clientName || 'Borrower',
        loanTerm: assessment.loanTerm || null,
        loanType: assessment.loanType || null,
        monthlyIncome: assessment.monthlyIncome || null,
        collateralType: assessment.collateralType || null,
        businessExperience: assessment.businessExperience || null,
        landOwnership: assessment.landOwnership || null,
        irrigationAccess: assessment.irrigationAccess || null,
        insuranceStatus: assessment.insuranceStatus || null,
        conflictScore: assessment.conflictScore || 0,
        conflictLevel: assessment.conflictLevel || 'Not assessed',
        conflictIncidents: assessment.conflictIncidents || 'No data available',
        conflictTrend: assessment.conflictTrend || 'Stable',
        economicScore: assessment.economicScore || 0,
        povertyRate: assessment.povertyRate || 'N/A',
        gdpPerCapita: assessment.gdpPerCapita || 'N/A',
        economicOutlook: assessment.economicOutlook || 'Not assessed'
      })
      setAiAnalysis(result.analysis)
    } catch (err) {
      console.error('Failed to generate AI analysis:', err)
      setAiError(err.response?.data?.message || 'Failed to generate analysis. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="skeleton-cedar w-12 h-12 rounded-full" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <XCircle className="w-14 h-14 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Assessment not found</h2>
        <p className="text-slate-400 text-sm mb-6">This assessment may have expired.</p>
        <Link to="/app" className="btn-primary">
          Start new assessment
        </Link>
      </div>
    )
  }

  const config = recConfig[assessment.recommendationType]
  const Icon = config.icon
  const actions = recDetails[assessment.recommendationType]

  return (
    <div className="min-h-screen pb-28">
      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Hero recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`card-cedar ${config.heroClass} py-6`}
        >
          <div className="flex items-start gap-3">
            <Icon className={`w-8 h-8 ${config.iconColor} shrink-0`} />
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Recommendation</p>
              <h2 className="text-2xl font-semibold text-white mt-0.5">
                {config.label}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{config.sublabel}</p>
            </div>
          </div>
        </motion.div>

        {/* Key metrics — side by side */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="card-cedar flex flex-col items-center justify-center py-5">
            <p className="text-xs text-slate-400 mb-2">Climate risk</p>
            <RiskGauge score={assessment.climateRiskScore} />
          </div>
          <div className="card-cedar py-5 px-4">
            <p className="text-xs text-slate-400 mb-3">Default probability</p>
            <DefaultProbabilityBar
              baseline={assessment.defaultProbabilityBaseline}
              adjusted={assessment.defaultProbabilityAdjusted}
            />
          </div>
        </motion.div>

        {/* Context line */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{assessment.locationName || 'Location'}</span>
          <span className="mx-1">·</span>
          <DollarSign className="w-4 h-4" />
          <span>${parseFloat(assessment.loanAmount || 0).toLocaleString()}</span>
        </div>

        {/* Actions required */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card-cedar"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Actions required</h3>
          <ul className="space-y-2">
            {actions.map((action, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-slate-500 text-xs">□</span>
                {action}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Expandable: Climate breakdown + products */}
        <div className="card-cedar">
          <button
            type="button"
            onClick={() => setExpandAnalysis(!expandAnalysis)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-slate-300">
              {expandAnalysis ? 'Hide' : 'View'} full analysis
            </span>
            {expandAnalysis ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 space-y-4"
            >
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Climate risk breakdown</h4>
                <ClimateFactors factors={assessment.climateFactors} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Umbrella className="w-3.5 h-3.5" />
                  Recommended products
                </h4>
                <ul className="space-y-2">
                  {assessment.products?.map((product, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span className="font-medium text-white">{product.name}</span>
                      <span className="text-slate-400"> — {product.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    AI Loan Officer Analysis
                  </h4>
                  {!aiAnalysis && !aiError && (
                    <button
                      onClick={generateAiAnalysis}
                      disabled={aiLoading}
                      className="text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 text-slate-300 transition-colors flex items-center gap-1"
                    >
                      {aiLoading ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  )}
                </div>
                {aiLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-400 ml-2">Analyzing loan application...</span>
                  </div>
                )}
                {aiError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <p className="text-sm text-red-400">{aiError}</p>
                  </div>
                )}
                {aiAnalysis && (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded p-3 text-sm text-slate-300 space-y-3 whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f172a]/98 backdrop-blur-sm border-t border-white/5 safe-area-pb">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigate('/app/history')}
            className="btn-secondary flex-1"
          >
            Override
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/history')}
            className="btn-primary flex-[2]"
          >
            Accept recommendation
          </button>
        </div>
      </div>
    </div>
  )
}
