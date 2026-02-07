import React from 'react'
import { useNavigate } from 'react-router-dom'
import VideoBackground from '../components/VideoBackground'
import LogoAnimation from '../components/LogoAnimation'
import { Loader2 } from 'lucide-react'

export default function ResultsLoading({ onComplete }) {
    const navigate = useNavigate()
    const [progress, setProgress] = React.useState(0)
    const [currentStep, setCurrentStep] = React.useState(0)

    const steps = [
        { text: 'Climate data analyzed', duration: 1500 },
        { text: 'ML model predictions complete', duration: 1500 },
        { text: 'Conflict risk assessed', duration: 1000 },
        { text: 'Generating recommendations', duration: 1000 }
    ]

    React.useEffect(() => {
        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    return 100
                }
                return prev + 2
            })
        }, 100)

        // Step updates
        let stepIndex = 0
        const stepTimeout = setTimeout(function updateStep() {
            if (stepIndex < steps.length) {
                setCurrentStep(stepIndex)
                stepIndex++
                setTimeout(updateStep, steps[stepIndex - 1]?.duration || 1000)
            } else {
                // All steps complete
                setTimeout(() => {
                    onComplete?.()
                }, 500)
            }
        }, 500)

        return () => {
            clearInterval(progressInterval)
            clearTimeout(stepTimeout)
        }
    }, [onComplete])

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: '#F5F3ED' }}>
            <div className="w-full max-w-2xl text-center">
                {/* Logo Animation */}
                <div className="mb-8 flex justify-center">
                    <LogoAnimation size="large" animation="pulse" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
                    Calculating Risk Assessment
                </h2>
                <p className="text-lg mb-8" style={{ color: '#666666' }}>
                    Please wait while we analyze the data
                </p>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-300 ease-out"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: '#2D5F3F'
                            }}
                        />
                    </div>
                    <p className="text-sm mt-2" style={{ color: '#999999' }}>
                        {Math.round(progress)}% Complete
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-center gap-3 transition-all duration-500 ${index <= currentStep ? 'opacity-100' : 'opacity-30'
                                }`}
                        >
                            {index < currentStep ? (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#4CAF50' }}>
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : index === currentStep ? (
                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#2D5F3F' }} />
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: '#E5E5E5' }} />
                            )}
                            <span
                                className="text-lg font-medium"
                                style={{ color: index <= currentStep ? '#2C2C2C' : '#CCCCCC' }}
                            >
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
