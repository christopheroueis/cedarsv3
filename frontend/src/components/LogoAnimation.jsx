import React from 'react'

export default function LogoAnimation({
    size = 'large',  // 'small' | 'medium' | 'large'
    animation = 'float',  // 'float' | 'pulse' | 'fadeIn' | 'grow'
    className = ''
}) {
    const sizeClasses = {
        small: 'w-16 h-16',
        medium: 'w-32 h-32',
        large: 'w-48 h-48'
    }

    const animationClasses = {
        float: 'animate-float',
        pulse: 'animate-pulse-slow',
        fadeIn: 'animate-fadeIn',
        grow: 'animate-grow'
    }

    return (
        <>
            <div className={`${sizeClasses[size]} ${animationClasses[animation]} ${className}`}>
                <img
                    src="/cedarlogo.png"
                    alt="Cedar Logo"
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.95;
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes grow {
                    from {
                        transform: scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }

                .animate-fadeIn {
                    animation: fadeIn 1.5s ease-out forwards;
                }

                .animate-grow {
                    animation: grow 1s ease-out forwards;
                }
            `}</style>
        </>
    )
}
