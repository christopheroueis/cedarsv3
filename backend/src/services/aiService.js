/**
 * AI Service
 * Handles AI-powered conversation extraction
 * Supports both Claude (Anthropic) and Groq APIs
 */

import axios from 'axios'

// API Configuration - Claude is primary, Groq is fallback
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-3-haiku-20240307' // Fast and cheap

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'  // Updated to supported model



const LOAN_ANALYSIS_SYSTEM_PROMPT = `You are an expert Climate-Smart Credit Analyst for a Microfinance Institution. Your goal is to convert complex climate/conflict data into a clear "Go/No-Go" decision for field officers.

# CORE OBJECTIVE
Analyze the loan application by cross-referencing *Loan Purpose (e.g., Rice)* with *Local Weather Forecasts & Climate Risks (e.g., Monsoons, Flood risk)*.

# INPUT DATA CONTEXT
You will receive:
1. Loan Details (Amount, Crop/Business Type, Repayment History)
2. Hyper-local Climate Data (Precipitation forecast, Heat stress index, Flood probability)
3. Risk Scores (0-100 for Climate, Conflict, Economic)

# ANALYSIS LOGIC: "The Weather-Business Fit"
•⁠  *Crop Sensitivity*: Check if the specific crop (e.g., Maize) is vulnerable to the forecasted weather (e.g., Drought).
•⁠  *Seasonality*: Is the loan term during a high-risk season (e.g., Cyclone season)?
•⁠  *Mitigation*: Can insurance or infrastructure (e.g., raised storage) lower the risk?

# OUTPUT FORMAT (Strictly Concise & Actionable)
Provide the response in the following structured format. Do not use fluff.

---
### 1. DECISION
[One of: *APPROVE, **APPROVE WITH CONDITIONS, **MODIFY, **DEFER*]

### 2. WEATHER & RISK CONTEXT (The "Why")
* Forecast Impact:* [One sentence linking weather to business. Ex: "High flood risk (75%) coincides with the rice harvest season in July."]
* Key Concern:* [Specific risk. Ex: "Crop destruction due to waterlogging."]

### 3. REQUIRED CONDITIONS (Mitigation)
* [Condition 1. Ex: "Mandatory index-based flood insurance."]
* [Condition 2. Ex: "Disburse loan in two tranches (pre-sowing, post-harvest)."]
* [Condition 3. Ex: "Adjust repayment to start after the monsoon."]

### 4. ADJUSTED RISK OUTLOOK
* Baseline Default Prob:* [X]%
* Adjusted Default Prob:* [Y]% (If conditions are met)
---

# TONE & STYLE GUIDELINES
•⁠  *Be Direct*: No "The data suggests..." -> Say "Flood risk is high."
•⁠  *Focus on Causality: Explain *how the weather hurts this specific business.
•⁠  *Empowerment*: If a loan is risky, find a way to make it work (e.g., smaller amount) rather than just rejecting it.
•⁠  *Simple English*: Use terms a rural loan officer understands immediately.
`


const EXTRACTION_PROMPT = `You are an AI assistant extracting loan application data from a conversation between a loan officer and a client. Extract the following fields as JSON.

For each field, indicate your confidence level (high/medium/low):
- high: The information was explicitly stated
- medium: The information was implied or you're reasonably certain
- low: You're guessing or the information wasn't mentioned

Return ONLY valid JSON in this exact format:
{
  "data": {
    "clientName": string | null,
    "clientAge": number | null,
    "projectType": "agriculture" | "livestock" | "retail" | "manufacturing" | "services" | "housing" | "fishing" | "transport" | null,
    "cropType": string | null,
    "loanAmount": number | null,
    "loanPurpose": string | null,
    "loanTerm": number | null,
    "loanType": "working-capital" | "equipment-purchase" | "land-acquisition" | "crop-inputs" | "livestock-purchase" | "construction" | null,
    "existingLoans": number | null,
    "repaymentHistory": number | null,
    "monthlyIncome": number | null,
    "collateralType": "land-title" | "savings-deposit" | "equipment" | "livestock" | "group-guarantee" | "none" | null,
    "businessExperience": number | null,
    "landOwnership": "owned" | "leased-long" | "leased-short" | "sharecropping" | null,
    "irrigationAccess": "full" | "partial" | "rain-fed" | null,
    "insuranceStatus": "crop-and-health" | "crop-only" | "health-only" | "none" | null
  },
  "confidence": {
    "clientName": "high" | "medium" | "low",
    "clientAge": "high" | "medium" | "low",
    "projectType": "high" | "medium" | "low",
    "cropType": "high" | "medium" | "low",
    "loanAmount": "high" | "medium" | "low",
    "loanPurpose": "high" | "medium" | "low",
    "loanTerm": "high" | "medium" | "low",
    "loanType": "high" | "medium" | "low",
    "existingLoans": "high" | "medium" | "low",
    "repaymentHistory": "high" | "medium" | "low",
    "monthlyIncome": "high" | "medium" | "low",
    "collateralType": "high" | "medium" | "low",
    "businessExperience": "high" | "medium" | "low",
    "landOwnership": "high" | "medium" | "low",
    "irrigationAccess": "high" | "medium" | "low",
    "insuranceStatus": "high" | "medium" | "low"
  },
  "summary": "Brief summary of what was discussed"
}

If information is unclear or not mentioned, set the value to null and confidence to "low".
Currency amounts should be converted to numbers (e.g., "5000 dollars" → 5000).
Percentage values for repayment history should be 0-100 (e.g., "always paid on time" → 95).

CONVERSATION TRANSCRIPT:
`

/**
 * Extract using Claude API (Anthropic)
 */
async function extractWithClaude(transcript, apiKey) {
    const response = await axios.post(
        CLAUDE_API_URL,
        {
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: EXTRACTION_PROMPT + transcript
                }
            ]
        },
        {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    )

    const content = response.data?.content?.[0]?.text
    if (!content) throw new Error('No response from Claude')

    // Parse JSON from response (Claude might include explanation text)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        console.error('Claude Response (No JSON):', content)
        throw new Error('No JSON found in response')
    }

    return {
        parsed: JSON.parse(jsonMatch[0]),
        usage: response.data?.usage
    }
}

/**
 * Extract using Groq API
 */
async function extractWithGroq(transcript, apiKey) {
    const response = await axios.post(
        GROQ_API_URL,
        {
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that extracts structured data from conversations. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: EXTRACTION_PROMPT + transcript
                }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (!content) {
        console.error('Groq Response (No Content):', JSON.stringify(response.data, null, 2))
        throw new Error('No response from Groq')
    }

    return {
        parsed: JSON.parse(content),
        usage: response.data?.usage
    }
}

/**
 * Extract structured loan data from conversation transcript
 * Tries Claude first, then Groq as fallback
 */
export async function extractFormData(transcript) {
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    if (!claudeKey && !groqKey) {
        return {
            success: false,
            error: 'AI extraction not configured. Please set CLAUDE_API_KEY or GROQ_API_KEY in .env'
        }
    }

    if (!transcript || transcript.trim().length < 20) {
        return {
            success: false,
            error: 'Transcript too short. Please provide more conversation content.'
        }
    }

    let extracted, provider

    try {
        // Try Claude first if key is available
        if (claudeKey) {
            try {
                const result = await extractWithClaude(transcript, claudeKey)
                extracted = result.parsed
                provider = 'claude'
                console.log('AI extraction via Claude successful')
            } catch (claudeError) {
                console.warn('Claude failed, trying Groq:', claudeError.message)
                if (groqKey) {
                    const result = await extractWithGroq(transcript, groqKey)
                    extracted = result.parsed
                    provider = 'groq'
                } else {
                    throw claudeError
                }
            }
        } else if (groqKey) {
            const result = await extractWithGroq(transcript, groqKey)
            extracted = result.parsed
            provider = 'groq'
        }

        // Calculate quality score
        const confidenceScores = Object.values(extracted.confidence || {})
        const highCount = confidenceScores.filter(c => c === 'high').length
        const mediumCount = confidenceScores.filter(c => c === 'medium').length
        const totalFields = confidenceScores.length || 1
        const qualityScore = ((highCount * 1.0) + (mediumCount * 0.6)) / totalFields

        return {
            success: true,
            provider,
            extracted: extracted.data,
            confidence: extracted.confidence,
            summary: extracted.summary,
            quality: {
                score: parseFloat(qualityScore.toFixed(2)),
                level: qualityScore > 0.7 ? 'high' : qualityScore > 0.4 ? 'medium' : 'low',
                fieldsExtracted: Object.values(extracted.data).filter(v => v !== null).length,
                totalFields
            }
        }

    } catch (error) {
        console.error('AI extraction error:', error.message)
        if (error.response) {
            console.error('API Error Data:', JSON.stringify(error.response.data, null, 2))
        }

        if (error.response?.status === 401) {
            return { success: false, error: 'Invalid API key' }
        }
        if (error.response?.status === 429) {
            return { success: false, error: 'Rate limit exceeded. Please try again.' }
        }

        return {
            success: false,
            error: `Extraction failed: ${error.message}`
        }
    }
}

/**
 * Validate and clean extracted data
 */
export function validateExtractedData(extracted) {
    const validated = { ...extracted }
    const issues = []

    if (validated.clientAge !== null) {
        if (validated.clientAge < 18 || validated.clientAge > 100) {
            issues.push('Age seems invalid')
            validated.clientAge = null
        }
    }

    if (validated.loanAmount !== null) {
        if (validated.loanAmount <= 0 || validated.loanAmount > 10000000) {
            issues.push('Loan amount seems invalid')
        }
    }

    if (validated.repaymentHistory !== null) {
        validated.repaymentHistory = Math.min(100, Math.max(0, validated.repaymentHistory))
    }

    if (validated.loanTerm !== null) {
        if (validated.loanTerm <= 0 || validated.loanTerm > 120) {
            issues.push('Loan term seems invalid')
        }
    }

    return {
        data: validated,
        issues,
        isValid: issues.length === 0
    }
}


/**
 * Generate analysis prompt for loan officer decision support
 */
function generateLoanAnalysisPrompt(applicationData) {
    const { formData, mlPrediction, riskScores, location } = applicationData

    return `# Loan Application Analysis Request

## Applicant Profile
- **Name**: ${formData.data.clientName || 'Not provided'}
- **Age**: ${formData.data.clientAge || 'Not provided'}
- **Monthly Income**: $${formData.data.monthlyIncome || 'Not provided'}
- **Business Experience**: ${formData.data.businessExperience || 'Not provided'} years
- **Location**: ${location.region}, ${location.country}

## Loan Request
- **Amount**: $${formData.data.loanAmount || 'Not specified'}
- **Term**: ${formData.data.loanTerm || 'Not specified'} months
- **Purpose**: ${formData.data.loanPurpose || 'Not specified'}
- **Project Type**: ${formData.data.projectType || 'Not specified'}
- **Crop Type**: ${formData.data.cropType || 'N/A'}

## Borrower History
- **Existing Loans**: ${formData.data.existingLoans || 0}
- **Repayment History**: ${formData.data.repaymentHistory || 'Not provided'}%
- **Collateral Type**: ${formData.data.collateralType || 'None'}
- **Land Ownership**: ${formData.data.landOwnership || 'Not specified'}
- **Irrigation Access**: ${formData.data.irrigationAccess || 'Not specified'}
- **Insurance Status**: ${formData.data.insuranceStatus || 'None'}

## Risk Assessment (0-100 scale)
### Climate Risk: ${riskScores.climate || 0}
${riskScores.climateDetails?.threats?.length > 0 ? `- Threats: ${riskScores.climateDetails.threats.join(', ')}` : ''}
${riskScores.climateDetails?.seasonalFactors ? `- Seasonal Impact: ${riskScores.climateDetails.seasonalFactors}` : ''}

### Conflict/Instability Risk: ${riskScores.conflict || 0}
- Stability: ${riskScores.conflictDetails?.stabilityLevel || 'Not assessed'}
- Recent Incidents: ${riskScores.conflictDetails?.recentIncidents || 'No data'}
- Trend: ${riskScores.conflictDetails?.trend || 'Not assessed'}

### Economic Risk: ${riskScores.economic || 0}
- Poverty Rate: ${riskScores.economicDetails?.povertyRate || 'N/A'}
- Outlook: ${riskScores.economicDetails?.outlook || 'Not assessed'}

### Composite Risk Score: ${riskScores.composite || 0}

## Default Probability Estimates
- **Baseline** (no climate adjustment): ${(mlPrediction.default_probability?.baseline * 100 || 0).toFixed(1)}%
- **Unadjusted** (with full risk): ${(mlPrediction.default_probability?.unadjusted * 100 || 0).toFixed(1)}%
- **Adjusted** (with our recommended modifications): ${(mlPrediction.default_probability?.adjusted * 100 || 0).toFixed(1)}%

## ML Recommendation
- **Suggested Action**: ${mlPrediction.recommendation || 'Review manually'}
- **Risk Factors**: ${mlPrediction.risk_factors?.map(f => f.label).join(', ') || 'None identified'}

---

Please provide a clear recommendation for this loan application, considering all climate and economic factors. Focus on practical modifications that help the borrower succeed while managing our risk. Assume this will be reviewed by a loan officer with 5-10 years of experience.`
}


/**
 * Analyze with Claude API
 */
async function analyzeWithClaude(prompt, apiKey) {
    const response = await axios.post(
        CLAUDE_API_URL,
        {
            model: CLAUDE_MODEL,
            max_tokens: 1500,
            system: LOAN_ANALYSIS_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        },
        {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    )

    const analysis = response.data?.content?.[0]?.text
    if (!analysis) throw new Error('No response from Claude')

    return { analysis }
}

/**
 * Analyze with Groq API
 */
async function analyzeWithGroq(prompt, apiKey) {
    const response = await axios.post(
        GROQ_API_URL,
        {
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: LOAN_ANALYSIS_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1500
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    )

    const analysis = response.data?.choices?.[0]?.message?.content
    if (!analysis) throw new Error('No response from Groq')

    return { analysis }
}

/**
 * Analyze loan application and generate recommendations
 * Tries Claude first, then Groq as fallback
 * 
 * @param {Object} applicationData - Complete application data
 * @param {Object} applicationData.formData - Extracted form data with confidence scores
 * @param {Object} applicationData.mlPrediction - ML model prediction results
 * @param {Object} applicationData.riskScores - Climate/conflict/economic risk scores
 * @param {Object} applicationData.location - Geographic location data
 */
export async function analyzeLoanApplication(applicationData) {
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    if (!claudeKey && !groqKey) {
        return {
            success: false,
            error: 'AI analysis not configured. Please set CLAUDE_API_KEY or GROQ_API_KEY in .env'
        }
    }

    // Validate required data
    if (!applicationData.formData || !applicationData.mlPrediction || !applicationData.riskScores) {
        return {
            success: false,
            error: 'Missing required data for analysis (formData, mlPrediction, or riskScores)'
        }
    }

    try {
        // Generate the analysis prompt
        const analysisPrompt = generateLoanAnalysisPrompt(applicationData)
        
        let analysis, provider 

        // Try Claude first if key is available
        if (claudeKey) {
            try {
                const result = await analyzeWithClaude(analysisPrompt, claudeKey)
                analysis = result.analysis
                provider = 'claude'
                console.log('Loan analysis via Claude successful')
            } catch (claudeError) {
                console.warn('Claude failed, trying Groq:', claudeError.message)
                if (groqKey) {
                    const result = await analyzeWithGroq(analysisPrompt, groqKey)
                    analysis = result.analysis
                    provider = 'groq'
                } else {
                    throw claudeError
                }
            }
        } else if (groqKey) {
            const result = await analyzeWithGroq(analysisPrompt, groqKey)
            analysis = result.analysis
            provider = 'groq'
        }

        return {
            success: true,
            provider,
            analysis,
            timestamp: new Date().toISOString()
        }

    } catch (error) {
        console.error('Loan analysis error:', error.message)
        if (error.response) {
            console.error('API Error Data:', JSON.stringify(error.response.data, null, 2))
        }

        if (error.response?.status === 401) {
            return { success: false, error: 'Invalid API key' }
        }
        if (error.response?.status === 429) {
            return { success: false, error: 'Rate limit exceeded. Please try again.' }
        }

        return {
            success: false,
            error: `Analysis failed: ${error.message}`
        }
    }
}

export default {
    extractFormData,
    validateExtractedData
}
