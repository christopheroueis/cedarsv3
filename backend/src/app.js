import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.js'
import assessmentRoutes from './routes/assessments.js'
import climateRoutes from './routes/climate.js'
import dashboardRoutes from './routes/dashboard.js'
import riskAssessmentRoutes from './routes/riskAssessment.js'

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
    origin: '*',  // Allow all origins in development
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    preflightContinue: false
}))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.get('origin') || 'none'}`)
    next()
})

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ClimateCredit API',
        version: '2.0.0',
        features: ['7-dimension risk scoring', 'AI conversation extraction', 'Global location support'],
        timestamp: new Date().toISOString(),
        cors: 'enabled'
    })
})

// API Info
app.get('/api', (req, res) => {
    res.json({
        name: 'ClimateCredit API',
        version: '2.0.0',
        description: 'Climate-informed microfinance lending platform with 7-dimension risk scoring',
        v2Endpoints: {
            'POST /api/v2/assess': 'Full 7-dimension risk assessment',
            'POST /api/v2/geocode': 'Geocode address or coordinates',
            'POST /api/v2/ai/extract': 'Extract form data from conversation',
            'GET /api/v2/dimensions': 'Get risk dimension info',
            'GET /api/v2/project-types': 'Get project/loan types'
        },
        v1Endpoints: {
            auth: {
                'POST /api/auth/login': 'Authenticate loan officer',
                'POST /api/auth/verify': 'Verify JWT token',
                'GET /api/auth/mfis': 'List available MFIs'
            },
            assessments: {
                'POST /api/assessments/assess-loan': 'Create new loan assessment',
                'GET /api/assessments/mfi/:mfiId': 'Get assessments for MFI',
                'GET /api/assessments/:id': 'Get single assessment'
            }
        }
    })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/climate-data', climateRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/v2', riskAssessmentRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    })
})

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🌿 ClimateCredit API Server                               ║
║                                                              ║
║   Status:  Running                                           ║
║   Port:    ${PORT}                                             ║
║   Mode:    ${process.env.DEMO_MODE === 'true' ? 'Demo (Mock Data)' : 'Production'}                               ║
║                                                              ║
║   Endpoints:                                                 ║
║   - Health: http://localhost:${PORT}/health                    ║
║   - API:    http://localhost:${PORT}/api                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `)
})

export default app
