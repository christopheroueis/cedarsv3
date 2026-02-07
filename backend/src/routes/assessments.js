import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { demoData, isDemoMode } from '../config/database.js'
import climateService from '../services/climateService.js'
import { analyzeLoanApplication } from '../services/aiService.js'

const router = express.Router()

// In-memory storage for demo assessments
let assessmentCounter = 1000

// POST /api/assess-loan - Main loan assessment endpoint
router.post('/assess-loan', authenticateToken, async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            locationName,
            loanAmount,
            loanPurpose,
            cropType,
            clientAge,
            existingLoans,
            repaymentHistory
        } = req.body

        // Validate required fields
        if (!latitude || !longitude || !loanAmount || !loanPurpose) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide latitude, longitude, loanAmount, and loanPurpose'
            })
        }

        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)
        const amount = parseFloat(loanAmount)

        // Get climate data for location
        const climateData = await climateService.getClimateData(lat, lng)

        // Calculate climate risk score
        const climateRisk = climateService.calculateClimateRiskScore(
            climateData,
            loanPurpose,
            cropType
        )

        // Calculate default probabilities
        const defaultProb = climateService.calculateDefaultProbability(
            climateRisk.score,
            {
                age: parseInt(clientAge) || 35,
                existingLoans: parseInt(existingLoans) || 0,
                repaymentHistory: parseFloat(repaymentHistory) || 95
            }
        )

        // Generate recommendations
        const { recommendation, products } = climateService.generateRecommendations(
            climateRisk,
            loanPurpose,
            cropType
        )

        // Create assessment record
        const assessment = {
            id: `assess_${assessmentCounter++}`,
            mfiId: req.user.mfiSlug,
            mfiName: req.user.mfiName,
            loanOfficerId: req.user.userId,
            loanOfficerName: req.user.name,
            location: {
                latitude: lat,
                longitude: lng,
                name: locationName || climateData.location?.region || 'Unknown',
                country: climateData.location?.country
            },
            loanDetails: {
                amount,
                purpose: loanPurpose,
                cropType: cropType || null
            },
            clientInfo: {
                age: parseInt(clientAge) || null,
                existingLoans: parseInt(existingLoans) || 0,
                repaymentHistory: parseFloat(repaymentHistory) || null
            },
            climateData: {
                source: climateData.source,
                risks: climateData.risks,
                weather: climateData.weather
            },
            results: {
                climateRiskScore: climateRisk.score,
                riskFactors: climateRisk.factors,
                seasonalMultiplier: climateRisk.seasonalMultiplier,
                defaultProbability: {
                    baseline: defaultProb.baseline,
                    unadjusted: defaultProb.unadjusted,
                    adjusted: defaultProb.adjusted,
                    reduction: defaultProb.reduction
                }
            },
            recommendation,
            products,
            status: 'pending',
            createdAt: new Date().toISOString()
        }

        // Store in demo data
        demoData.assessments.push(assessment)

        res.json({
            success: true,
            assessment
        })

    } catch (error) {
        console.error('Assessment error:', error)
        res.status(500).json({
            error: 'Assessment failed',
            message: 'An error occurred during loan assessment'
        })
    }
})

// GET /api/assessments/:mfiId - Get all assessments for an MFI
router.get('/mfi/:mfiId', authenticateToken, (req, res) => {
    const { mfiId } = req.params
    const { page = 1, limit = 20, status, minRisk, maxRisk } = req.query

    let assessments = demoData.assessments.filter(a => a.mfiId === mfiId)

    // Apply filters
    if (status) {
        assessments = assessments.filter(a => a.recommendation?.type === status)
    }
    if (minRisk) {
        assessments = assessments.filter(a => a.results?.climateRiskScore >= parseInt(minRisk))
    }
    if (maxRisk) {
        assessments = assessments.filter(a => a.results?.climateRiskScore <= parseInt(maxRisk))
    }

    // Sort by date (newest first)
    assessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Paginate
    const startIndex = (page - 1) * limit
    const paginatedAssessments = assessments.slice(startIndex, startIndex + parseInt(limit))

    res.json({
        total: assessments.length,
        page: parseInt(page),
        limit: parseInt(limit),
        assessments: paginatedAssessments
    })
})

// GET /api/assessments/:id - Get single assessment
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params
    const assessment = demoData.assessments.find(a => a.id === id)

    if (!assessment) {
        return res.status(404).json({
            error: 'Not found',
            message: 'Assessment not found'
        })
    }

    // Check access (same MFI)
    if (assessment.mfiId !== req.user.mfiSlug) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have access to this assessment'
        })
    }

    res.json(assessment)
})

// PATCH /api/assessments/:id/decision - Record loan officer decision
router.patch('/:id/decision', authenticateToken, (req, res) => {
    const { id } = req.params
    const { decision, notes } = req.body

    const assessmentIndex = demoData.assessments.findIndex(a => a.id === id)

    if (assessmentIndex === -1) {
        return res.status(404).json({ error: 'Assessment not found' })
    }

    const assessment = demoData.assessments[assessmentIndex]

    if (assessment.mfiId !== req.user.mfiSlug) {
        return res.status(403).json({ error: 'Access denied' })
    }

    // Update assessment
    assessment.status = decision // 'approved', 'rejected', 'deferred'
    assessment.decision = {
        action: decision,
        notes: notes || '',
        decidedBy: req.user.name,
        decidedAt: new Date().toISOString()
    }

    demoData.assessments[assessmentIndex] = assessment

    res.json({ success: true, assessment })
})

// POST /api/assessments/:id/analyze - Get AI analysis for an assessment
router.post('/:id/analyze', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        
        // Find the assessment
        const assessment = demoData.assessments.find(a => a.id === id)

        if (!assessment) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Assessment not found'
            })
        }

        // Check access (same MFI)
        if (assessment.mfiId !== req.user.mfiSlug) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to this assessment'
            })
        }

        // Prepare data for AI analysis
        const applicationData = {
            formData: {
                data: {
                    clientName: req.body.clientName || 'Borrower',
                    clientAge: assessment.clientInfo.age,
                    projectType: assessment.loanDetails.purpose,
                    cropType: assessment.loanDetails.cropType,
                    loanAmount: assessment.loanDetails.amount,
                    loanPurpose: assessment.loanDetails.purpose,
                    loanTerm: req.body.loanTerm || null,
                    loanType: req.body.loanType || null,
                    existingLoans: assessment.clientInfo.existingLoans,
                    repaymentHistory: assessment.clientInfo.repaymentHistory,
                    monthlyIncome: req.body.monthlyIncome || null,
                    collateralType: req.body.collateralType || null,
                    businessExperience: req.body.businessExperience || null,
                    landOwnership: req.body.landOwnership || null,
                    irrigationAccess: req.body.irrigationAccess || null,
                    insuranceStatus: req.body.insuranceStatus || null
                },
                confidence: {
                    clientName: 'high',
                    clientAge: assessment.clientInfo.age ? 'high' : 'low',
                    projectType: 'high',
                    cropType: assessment.loanDetails.cropType ? 'high' : 'low',
                    loanAmount: 'high',
                    loanPurpose: 'high',
                    loanTerm: req.body.loanTerm ? 'high' : 'low',
                    loanType: req.body.loanType ? 'medium' : 'low',
                    existingLoans: assessment.clientInfo.existingLoans !== null ? 'high' : 'low',
                    repaymentHistory: assessment.clientInfo.repaymentHistory !== null ? 'high' : 'low',
                    monthlyIncome: req.body.monthlyIncome ? 'high' : 'low',
                    collateralType: req.body.collateralType ? 'high' : 'low',
                    businessExperience: req.body.businessExperience ? 'medium' : 'low',
                    landOwnership: req.body.landOwnership ? 'medium' : 'low',
                    irrigationAccess: req.body.irrigationAccess ? 'medium' : 'low',
                    insuranceStatus: req.body.insuranceStatus ? 'high' : 'low'
                }
            },
            mlPrediction: {
                climate_risk_score: assessment.results.climateRiskScore,
                default_probability: assessment.results.defaultProbability,
                risk_factors: assessment.results.riskFactors
                    ? Object.keys(assessment.results.riskFactors).map(type => ({
                        label: type.charAt(0).toUpperCase() + type.slice(1),
                        type,
                        value: assessment.results.riskFactors[type].value,
                        weight: assessment.results.riskFactors[type].weight
                      }))
                    : [],
                recommendation: assessment.recommendation.type
            },
            riskScores: {
                climate: assessment.results.climateRiskScore,
                climateDetails: {
                    threats: assessment.climateData.risks 
                        ? Object.keys(assessment.climateData.risks).map(type => ({
                            type,
                            value: assessment.climateData.risks[type]
                          }))
                        : [],
                    recentEvents: 'Climate risk assessment completed',
                    seasonalFactors: assessment.results.seasonalMultiplier > 1 
                        ? 'Currently in high-risk season' 
                        : 'Standard seasonal conditions'
                },
                conflict: req.body.conflictScore || 0,
                conflictDetails: {
                    stabilityLevel: req.body.conflictLevel || 'Not assessed',
                    recentIncidents: req.body.conflictIncidents || 'No data available',
                    trend: req.body.conflictTrend || 'Stable'
                },
                economic: req.body.economicScore || 0,
                economicDetails: {
                    povertyRate: req.body.povertyRate || 'N/A',
                    gdpPerCapita: req.body.gdpPerCapita || 'N/A',
                    outlook: req.body.economicOutlook || 'Not assessed'
                },
                composite: Math.round(
                    (assessment.results.climateRiskScore + 
                     (req.body.conflictScore || 0) + 
                     (req.body.economicScore || 0)) / 3
                )
            },
            location: {
                region: assessment.location.name,
                country: assessment.location.country,
                latitude: assessment.location.latitude,
                longitude: assessment.location.longitude
            }
        } 

        // Call AI analysis service
        const analysisResult = await analyzeLoanApplication(applicationData)
        console.log("AI analysis result:\n", analysisResult)

        if (!analysisResult.success) {
            return res.status(500).json({
                error: 'Analysis failed',
                message: analysisResult.error
            })
        }

        // Store analysis in assessment
        const assessmentIndex = demoData.assessments.findIndex(a => a.id === id)
        demoData.assessments[assessmentIndex].aiAnalysis = {
            recommendation: analysisResult.analysis,
            provider: analysisResult.provider,
            generatedAt: analysisResult.timestamp,
            generatedBy: req.user.name
        }

        res.json({
            success: true,
            analysis: analysisResult.analysis,
            provider: analysisResult.provider,
            timestamp: analysisResult.timestamp
        })

    } catch (error) {
        console.error('AI analysis error:', error)
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message || 'An error occurred during AI analysis'
        })
    }
})


export default router
