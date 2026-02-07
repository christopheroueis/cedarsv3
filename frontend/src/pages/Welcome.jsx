import React from 'react'
import { useNavigate } from 'react-router-dom'
import VideoBackground from '../components/VideoBackground'
import LogoAnimation from '../components/LogoAnimation'
import { ArrowRight, Info } from 'lucide-react'

export default function Welcome() {
    const navigate = useNavigate()

    const handleGetStarted = () => {
        navigate('/login')
    }

    return (
        <VideoBackground>
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                {/* Logo */}
                <div className="mb-8">
                    <LogoAnimation size="large" animation="fadeIn" />
                </div>

                {/* Hero Text */}
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fadeInUp">
                        ClimateCredit
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 font-light animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        Climate-Smart Lending Platform
                    </p>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        Empowering microfinance institutions with AI-driven climate risk assessment
                        to make informed lending decisions in climate-vulnerable regions.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                    <button
                        onClick={handleGetStarted}
                        className="px-8 py-4 bg-forest hover:bg-forest/90 text-white font-semibold rounded-lg 
                                 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl
                                 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: '#2D5F3F' }}
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            // Scroll to features section or navigate to info page
                            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold 
                                 rounded-lg transition-all duration-300 flex items-center gap-2 hover:bg-white/20
                                 hover:scale-105 active:scale-95"
                    >
                        Learn More
                        <Info className="w-5 h-5" />
                    </button>
                </div>

                {/* Optional: Features Section */}
                <div id="features" className="mt-32 w-full max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 px-4">
                        <FeatureCard
                            icon="🌍"
                            title="Climate Intelligence"
                            description="Real-time climate data and risk scoring based on GPS location"
                        />
                        <FeatureCard
                            icon="🤖"
                            title="AI-Powered"
                            description="Automated data extraction from conversations and ML-driven predictions"
                        />
                        <FeatureCard
                            icon="📊"
                            title="Smart Analytics"
                            description="Comprehensive risk assessment combining climate, economic, and social factors"
                        />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 1s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </VideoBackground>
    )
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-white/70 leading-relaxed">{description}</p>
        </div>
    )
}
