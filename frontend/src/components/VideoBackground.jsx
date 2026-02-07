import React from 'react'

export default function VideoBackground({ children, videoSrc = '/videos/background.mp4', poster = '/cedarlogo.png' }) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Video Background */}
            <div className="fixed inset-0 z-0">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={poster}
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src={videoSrc} type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                </video>

                {/* Fallback gradient when video is not available */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900"
                    style={{
                        display: 'none',  // Will be shown by CSS if video fails
                        backgroundImage: 'linear-gradient(135deg, #2D5F3F 0%, #3D7150 50%, #2D5F3F 100%)'
                    }}
                />

                {/* Dark overlay for text legibility */}
                <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            <style>{`
                video::cue {
                    display: none;
                }
                
                /* Show gradient fallback if video fails to load */
                video:not([src]) + div {
                    display: block !important;
                }
            `}</style>
        </div>
    )
}
