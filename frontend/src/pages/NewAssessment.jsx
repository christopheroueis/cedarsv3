import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assessmentsAPI, aiAPI } from '../services/api'
import {
    MapPin, DollarSign, Wheat, User, FileCheck,
    ChevronDown, Navigation, Loader2, AlertCircle, Mic, MicOff, Square,
    Sparkles, PenLine, Check, Edit2, ChevronLeft
} from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import LocationDetection from '../components/LocationDetection'
import LoadingAnimation from '../components/LoadingAnimation'
import { formatLocationForBackend } from '../services/locationService'

export default function NewAssessment() {
    const { user, mfi, logout } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [gpsLoading, setGpsLoading] = useState(false)

    // Multi-step flow state
    const [step, setStep] = useState('mode-select') // 'mode-select' | 'location-detect' | 'loading' | 'manual-form' | 'recording' | 'review'
    const [entryMode, setEntryMode] = useState(null) // 'manual' | 'ai'

    // Location state
    const [location, setLocation] = useState(null)

    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const recognitionRef = useRef(null)

    // AI extraction state
    const [extracting, setExtracting] = useState(false)
    const [extractedData, setExtractedData] = useState(null)
    const [confidence, setConfidence] = useState({})
    const [extractionError, setExtractionError] = useState('')

    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        locationName: '',
        loanAmount: '',
        loanPurpose: '',
        cropType: '',
        clientAge: '',
        clientName: '',
        existingLoans: '0',
        repaymentHistory: '95',
        monthlyIncome: ''
    })

    const loanPurposes = [
        { id: 'agriculture', name: 'Agriculture', icon: '🌾' },
        { id: 'livestock', name: 'Livestock', icon: '🐄' },
        { id: 'small_business', name: 'Small Business', icon: '🏪' },
        { id: 'housing', name: 'Housing', icon: '🏠' }
    ]

    const cropTypes = [
        { id: 'rice', name: 'Rice' },
        { id: 'wheat', name: 'Wheat' },
        { id: 'maize', name: 'Maize/Corn' },
        { id: 'coffee', name: 'Coffee' },
        { id: 'tea', name: 'Tea' },
        { id: 'sugarcane', name: 'Sugarcane' },
        { id: 'vegetables', name: 'Mixed Vegetables' },
        { id: 'fruits', name: 'Fruits' },
        { id: 'cotton', name: 'Cotton' },
        { id: 'other', name: 'Other' }
    ]

    const demoLocations = {
        'bangladesh-mfi': { lat: 24.8949, lng: 91.8687, name: 'Sylhet, Bangladesh' },
        'kenya-mfi': { lat: -0.4167, lng: 36.9500, name: 'Nyeri, Kenya' },
        'peru-mfi': { lat: -13.5319, lng: -71.9675, name: 'Cusco, Peru' }
    }

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event) => {
                let interim = ''
                let final = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        final += result[0].transcript + ' '
                    } else {
                        interim += result[0].transcript
                    }
                }
                if (final) {
                    setTranscript(prev => prev + final)
                }
                setInterimTranscript(interim)
            }

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'not-allowed') {
                    setExtractionError('Microphone access denied. Please allow microphone access.')
                }
            }

            recognitionRef.current.onend = () => {
                if (isRecording) {
                    recognitionRef.current.start()
                }
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [isRecording])

    const startRecording = () => {
        setTranscript('')
        setInterimTranscript('')
        setExtractionError('')
        setIsRecording(true)
        recognitionRef.current?.start()
    }

    const stopRecording = async () => {
        setIsRecording(false)
        recognitionRef.current?.stop()

        // Extract data from transcript
        if (transcript.trim().length > 5) {
            await extractDataFromTranscript()
        } else {
            setExtractionError('No speech detected. Please speak clearly and try again.')
        }
    }

    const extractDataFromTranscript = async () => {
        setExtracting(true)
        setExtractionError('')

        try {
            const result = await aiAPI.extractFromTranscript(transcript)

            if (result.success) {
                setExtractedData(result.extracted)
                setConfidence(result.confidence || {})

                // Merge extracted data into form
                setFormData(prev => ({
                    ...prev,
                    clientName: result.extracted.clientName || prev.clientName,
                    clientAge: result.extracted.clientAge?.toString() || prev.clientAge,
                    loanAmount: result.extracted.loanAmount?.toString() || prev.loanAmount,
                    loanPurpose: mapProjectType(result.extracted.projectType) || prev.loanPurpose,
                    cropType: result.extracted.cropType || prev.cropType,
                    existingLoans: result.extracted.existingLoans?.toString() || prev.existingLoans,
                    repaymentHistory: result.extracted.repaymentHistory?.toString() || prev.repaymentHistory,
                    monthlyIncome: result.extracted.monthlyIncome?.toString() || prev.monthlyIncome
                }))

                setStep('review')
            } else {
                setExtractionError(result.error || 'Failed to extract data. Please try again.')
            }
        } catch (error) {
            console.error('Extraction error:', error)
            setExtractionError('Failed to connect to AI service. Please try again.')
        } finally {
            setExtracting(false)
        }
    }

    const mapProjectType = (type) => {
        const mapping = {
            'agriculture': 'agriculture',
            'livestock': 'livestock',
            'retail': 'small_business',
            'manufacturing': 'small_business',
            'services': 'small_business',
            'housing': 'housing',
            'fishing': 'agriculture',
            'transport': 'small_business'
        }
        return mapping[type] || null
    }

    const getConfidenceColor = (field) => {
        const level = confidence[field]
        if (level === 'high') return 'text-emerald-400 bg-emerald-500/20'
        if (level === 'medium') return 'text-amber-400 bg-amber-500/20'
        return 'text-rose-400 bg-rose-500/20'
    }

    const detectLocation = async () => {
        setGpsLoading(true)

        if (!navigator.geolocation) {
            const demoLoc = demoLocations[mfi?.id] || demoLocations['bangladesh-mfi']
            setFormData(prev => ({
                ...prev,
                latitude: demoLoc.lat.toString(),
                longitude: demoLoc.lng.toString(),
                locationName: demoLoc.name + ' (Demo)'
            }))
            setGpsLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                    locationName: 'GPS Location Detected'
                }))
                setGpsLoading(false)
            },
            () => {
                const demoLoc = demoLocations[mfi?.id] || demoLocations['bangladesh-mfi']
                setFormData(prev => ({
                    ...prev,
                    latitude: demoLoc.lat.toString(),
                    longitude: demoLoc.lng.toString(),
                    locationName: demoLoc.name + ' (Demo)'
                }))
                setGpsLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await assessmentsAPI.createAssessment({
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                locationName: formData.locationName,
                loanAmount: parseFloat(formData.loanAmount),
                loanPurpose: formData.loanPurpose,
                cropType: formData.cropType || null,
                clientAge: parseInt(formData.clientAge),
                existingLoans: parseInt(formData.existingLoans),
                repaymentHistory: parseFloat(formData.repaymentHistory)
            })

            if (result.success && result.assessment) {
                sessionStorage.setItem(`assessment_${result.assessment.id}`, JSON.stringify(result.assessment))
                setLoading(false)
                navigate(`/app/results/${result.assessment.id}`)
                return
            }
        } catch (error) {
            console.warn('API call failed, using demo mode:', error.message)
        }

        // Fallback to demo mode
        const assessmentId = `assess_${Date.now()}`
        sessionStorage.setItem(`assessment_${assessmentId}`, JSON.stringify({
            ...formData,
            mfiId: mfi?.slug || mfi?.id,
            loanOfficerId: user?.id,
            loanOfficerName: user?.name,
            timestamp: new Date().toISOString()
        }))
        setLoading(false)
        navigate(`/app/results/${assessmentId}`)
    }

    const handleModeSelect = (mode) => {
        setEntryMode(mode)
        setStep('location-detect')
    }

    const handleLocationConfirmed = (detectedLocation) => {
        setLocation(detectedLocation)
        // Update form data with location
        setFormData(prev => ({
            ...prev,
            latitude: detectedLocation.lat.toString(),
            longitude: detectedLocation.lng.toString(),
            locationName: detectedLocation.formatted
        }))
        setStep('loading')
    }

    const handleLoadingComplete = () => {
        if (entryMode === 'manual') {
            setStep('manual-form')
        } else {
            setStep('recording')
        }
    }

    const handleBack = () => {
        if (step === 'manual-form' || step === 'recording') {
            setStep('mode-select')
            setEntryMode(null)
        } else if (step === 'review') {
            setStep('recording')
        }
    }

    // ============ RENDER SECTIONS ============

    const stepLabel = step === 'manual-form' ? 'Manual Entry' : step === 'recording' ? 'AI Assistant' : step === 'review' ? 'Review Data' : null
    const renderInFlowBar = () => step !== 'mode-select' && stepLabel && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
            <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:text-white"
                aria-label="Back"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-slate-300">{stepLabel}</span>
        </div>
    )

    const renderModeSelection = () => (
        <div className="px-4 py-8 max-w-lg mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">How would you like to enter data?</h2>
                <p className="text-slate-400">Choose your preferred method for this assessment</p>
            </div>

            {/* AI Assistant Option */}
            <button
                onClick={() => handleModeSelect('ai')}
                className="w-full p-6 rounded-2xl bg-[#0A4D3C]/15 border-2 border-[#14B8A6]/40 hover:border-[#14B8A6]/60 
                         transition-all duration-200 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0A4D3C] to-[#14B8A6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0A4D3C]/30">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            AI Assistant
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#14B8A6]/20 text-[#14B8A6]">Recommended</span>
                        </h3>
                        <p className="text-sm text-slate-400 mb-3">
                            Record your conversation with the client. AI will transcribe and extract data automatically.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Voice recording
                            </span>
                            <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Auto-extract
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            {/* Manual Entry Option */}
            <button
                onClick={() => handleModeSelect('manual')}
                className="w-full p-6 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-white/20 
                         transition-all duration-200 text-left"
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-700/80 flex items-center justify-center flex-shrink-0">
                        <PenLine className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Manual Entry</h3>
                        <p className="text-sm text-slate-400 mb-3">
                            Fill out the form manually with client information.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Type Data
                            </span>
                            <span className="flex items-center gap-1">
                                <FileCheck className="w-3 h-3" /> Full Control
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )

    const renderRecording = () => (
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
            {/* Recording Controls */}
            <div className="card-cedar text-center py-8">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-200
                    ${isRecording
                        ? 'bg-red-500/90 animate-pulse shadow-lg shadow-red-500/30'
                        : 'bg-gradient-to-br from-[#0A4D3C] to-[#14B8A6] shadow-lg shadow-[#0A4D3C]/30'}`}
                >
                    {isRecording ? (
                        <Mic className="w-16 h-16 text-white" />
                    ) : (
                        <MicOff className="w-16 h-16 text-white/80" />
                    )}
                </div>

                {!isRecording && !extracting && (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="btn-primary"
                    >
                        Start recording
                    </button>
                )}

                {isRecording && (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="px-8 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold flex items-center gap-2 mx-auto transition-colors"
                    >
                        <Square className="w-5 h-5" />
                        Stop & extract
                    </button>
                )}

                {extracting && (
                    <div className="flex items-center justify-center gap-3 text-[#14B8A6]">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-medium">Extracting data...</span>
                    </div>
                )}

                {isRecording && (
                    <p className="text-sm text-slate-400 mt-4">
                        Recording... Speak naturally with your client
                    </p>
                )}
            </div>

            {/* Transcript Area - Editable */}
            <div className="card-cedar">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#14B8A6] tracking-wide">
                        Transcript
                    </h3>
                    <span className="text-xs text-slate-500">
                        {transcript.length > 0 ? `${transcript.split(' ').length} words` : 'Type or speak'}
                    </span>
                </div>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Speech will appear here, or type/paste your conversation"
                    className="input-cedar min-h-[180px] p-4 resize-none"
                />
                {interimTranscript && (
                    <p className="text-sm text-slate-500 mt-2 italic">{interimTranscript}</p>
                )}
            </div>

            {/* Manual Extract Button */}
            {!isRecording && !extracting && transcript.trim().length > 0 && (
                <button
                    type="button"
                    onClick={extractDataFromTranscript}
                    className="btn-primary w-full py-4 text-lg"
                >
                    <Sparkles className="w-6 h-6" />
                    Extract data with AI
                </button>
            )}

            {extractionError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{extractionError}</p>
                </div>
            )}

            {/* Speech Recognition Notice */}
            {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <p className="text-sm text-amber-300">
                        ⚠️ Speech recognition not available. You can type or paste your conversation above.
                    </p>
                </div>
            )}

            {/* Tip */}
            <div className="text-center text-sm text-slate-500">
                <p>💡 Tip: You can type or paste the conversation directly if voice isn't working</p>
            </div>
        </div>
    )

    const renderReview = () => (
        <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="mb-6 p-4 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/30">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#14B8A6]" />
                    <span className="font-semibold text-[#14B8A6]">AI extracted data</span>
                </div>
                <p className="text-sm text-slate-400">
                    Review and edit the extracted information before proceeding
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location - Always required */}
                <section className="card-cedar space-y-4">
                    <h3 className="text-sm font-semibold text-[#14B8A6] tracking-wide flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Client location
                    </h3>

                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] font-medium hover:bg-[#0EA5E9]/30 transition-colors"
                    >
                        {gpsLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Detecting Location...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-5 h-5" />
                                Auto-Detect GPS Location
                            </>
                        )}
                    </button>

                    {formData.locationName && (
                        <div className="p-3 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30">
                            <p className="text-sm text-[#14B8A6] font-medium">{formData.locationName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {formData.latitude}, {formData.longitude}
                            </p>
                        </div>
                    )}
                </section>

                {/* Extracted Fields with Confidence */}
                <section className="card-cedar space-y-4">
                    <h3 className="text-sm font-semibold text-[#14B8A6] tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Extracted information
                    </h3>

                    {/* Client Name */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Client Name</label>
                            {confidence.clientName && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('clientName')}`}>
                                    {confidence.clientName}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="Enter client name"
                        />
                    </div>

                    {/* Client Age */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Client Age</label>
                            {confidence.clientAge && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('clientAge')}`}>
                                    {confidence.clientAge}
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            name="clientAge"
                            value={formData.clientAge}
                            onChange={handleChange}
                            placeholder="Age"
                            min="18"
                            max="100"
                            required
                        />
                    </div>

                    {/* Loan Amount */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Loan Amount (USD)</label>
                            {confidence.loanAmount && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('loanAmount')}`}>
                                    {confidence.loanAmount}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                            <input
                                type="number"
                                name="loanAmount"
                                value={formData.loanAmount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                min="50"
                                max="50000"
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Loan Purpose */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Loan Purpose</label>
                            {confidence.projectType && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('projectType')}`}>
                                    {confidence.projectType}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {loanPurposes.map(purpose => (
                                <button
                                    key={purpose.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, loanPurpose: purpose.id }))}
                                    className={`p-3 rounded-xl border-2 text-left transition-colors ${formData.loanPurpose === purpose.id
                                        ? 'border-[#14B8A6] bg-[#14B8A6]/15'
                                        : 'border-white/10 bg-white/5 hover:border-white/15'
                                        }`}
                                >
                                    <span className="text-xl">{purpose.icon}</span>
                                    <p className="text-sm font-medium text-slate-200 mt-1">{purpose.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Existing Loans */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-300">Existing Loans</label>
                            </div>
                            <input
                                type="number"
                                name="existingLoans"
                                value={formData.existingLoans}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-300">Monthly Income</label>
                            </div>
                            <input
                                type="number"
                                name="monthlyIncome"
                                value={formData.monthlyIncome}
                                onChange={handleChange}
                                placeholder="USD"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Repayment History */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Repayment History
                            <span className="ml-2 text-teal-400 font-semibold">{formData.repaymentHistory}%</span>
                        </label>
                        <input
                            type="range"
                            name="repaymentHistory"
                            value={formData.repaymentHistory}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#14B8A6]"
                        />
                    </div>
                </section>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.latitude || !formData.loanPurpose}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Analyzing climate risk...
                        </>
                    ) : (
                        <>
                            <Check className="w-6 h-6" />
                            Confirm & assess risk
                        </>
                    )}
                </button>
            </form>
        </div>
    )

    const renderManualForm = () => (
        <main className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                {/* Location Section */}
                <section className="card-cedar space-y-4">
                    <h3 className="text-sm font-semibold text-[#14B8A6] tracking-wide flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Client location
                    </h3>

                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] font-medium hover:bg-[#0EA5E9]/30 transition-colors"
                    >
                        {gpsLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Detecting Location...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-5 h-5" />
                                Auto-Detect GPS Location
                            </>
                        )}
                    </button>

                    {formData.locationName && (
                        <div className="p-3 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 animate-fade-in-up">
                            <p className="text-sm text-[#14B8A6] font-medium">{formData.locationName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {formData.latitude}, {formData.longitude}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
                            <input
                                type="number"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                step="any"
                                placeholder="-90 to 90"
                                required
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
                            <input
                                type="number"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                step="any"
                                placeholder="-180 to 180"
                                required
                                className="text-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* Loan Details Section */}
                <section className="card-cedar space-y-4">
                    <h3 className="text-sm font-semibold text-[#F59E0B] tracking-wide flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Loan details
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Loan Amount (USD)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                            <input
                                type="number"
                                name="loanAmount"
                                value={formData.loanAmount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                min="50"
                                max="50000"
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Loan Purpose</label>
                        <div className="grid grid-cols-2 gap-2">
                            {loanPurposes.map(purpose => (
                                <button
                                    key={purpose.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, loanPurpose: purpose.id }))}
                                    className={`p-3 rounded-xl border-2 text-left transition-colors ${formData.loanPurpose === purpose.id
                                        ? 'border-[#14B8A6] bg-[#14B8A6]/15'
                                        : 'border-white/10 bg-white/5 hover:border-white/15'
                                        }`}
                                >
                                    <span className="text-xl">{purpose.icon}</span>
                                    <p className="text-sm font-medium text-slate-200 mt-1">{purpose.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.loanPurpose === 'agriculture' && (
                        <div className="animate-fade-in-up">
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <Wheat className="w-4 h-4 text-[#F59E0B]" />
                                Crop Type
                            </label>
                            <div className="relative">
                                <select
                                    name="cropType"
                                    value={formData.cropType}
                                    onChange={handleChange}
                                    required
                                    className="appearance-none"
                                >
                                    <option value="">Select crop type...</option>
                                    {cropTypes.map(crop => (
                                        <option key={crop.id} value={crop.id}>{crop.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}
                </section>

                {/* Client Info Section */}
                <section className="card-cedar space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 tracking-wide flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Client information
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Client Age</label>
                            <input
                                type="number"
                                name="clientAge"
                                value={formData.clientAge}
                                onChange={handleChange}
                                placeholder="Age"
                                min="18"
                                max="100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Existing Loans</label>
                            <input
                                type="number"
                                name="existingLoans"
                                value={formData.existingLoans}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Repayment History
                            <span className="ml-2 text-teal-400 font-semibold">{formData.repaymentHistory}%</span>
                        </label>
                        <input
                            type="range"
                            name="repaymentHistory"
                            value={formData.repaymentHistory}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#14B8A6]"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Poor</span>
                            <span>Excellent</span>
                        </div>
                    </div>
                </section>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.latitude || !formData.loanPurpose}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Analyzing climate risk...
                        </>
                    ) : (
                        <>
                            <FileCheck className="w-6 h-6" />
                            Assess risk
                        </>
                    )}
                </button>
            </form>
        </main>
    )

    return (
        <div className="min-h-screen pb-24">
            {/* Progress Bar - shown for all steps except mode-select */}
            {step !== 'mode-select' && (
                <ProgressBar
                    currentStep={
                        step === 'location-detect' ? 'location' :
                            step === 'loading' ? 'data-entry' :
                                (step === 'manual-form' || step === 'recording' || step === 'review') ? 'data-entry' :
                                    'assessment'
                    }
                />
            )}

            {/* Regular header for mode-select and data entry steps */}
            {renderInFlowBar()}

            {step === 'mode-select' && renderModeSelection()}
            {step === 'location-detect' && <LocationDetection onLocationConfirmed={handleLocationConfirmed} />}
            {step === 'loading' && <LoadingAnimation onComplete={handleLoadingComplete} minimumDuration={6000} />}
            {step === 'manual-form' && renderManualForm()}
            {step === 'recording' && renderRecording()}
            {step === 'review' && renderReview()}

            <div className="h-8"></div>
        </div>
    )
}
