require('dotenv').config({ path: __dirname + '/.env' })
require('../init')

const express = require('express')
const { createRemoteJWKSet, jwtVerify, errors: joseErrors } = require('jose')
const { discover } = require('../lib/discovery')
const favoriteColors = require('./colors.json')

const app = express()
const port = 3001

app.use(express.json())

let jwks = null
let expectedIssuer = null

async function initializeJwks() {
    const discoveryURL = process.env.OAUTH2_DISCOVERY_URL
    if (!discoveryURL) {
        throw new Error('OAUTH2_DISCOVERY_URL environment variable is not set')
    }
    if (!process.env.OAUTH2_AUDIENCE) {
        throw new Error('OAUTH2_AUDIENCE environment variable is not set')
    }
    console.info(`Resource Server: discovering OAuth metadata from ${discoveryURL}`)
    const metadata = await discover(discoveryURL)
    expectedIssuer = metadata.issuer
    jwks = createRemoteJWKSet(new URL(metadata.jwks_uri))
    console.info(`Resource Server: JWKS initialized`)
    console.info(`  issuer:   ${expectedIssuer}`)
    console.info(`  audience: ${process.env.OAUTH2_AUDIENCE}`)
    console.info(`  jwks_uri: ${metadata.jwks_uri}`)
}

const validateAccessToken = async (req, res, next) => {
    if (!jwks || !expectedIssuer) {
        return res.status(503).json({
            error: 'service_unavailable',
            error_description: 'Token validation not yet initialized',
        })
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
        })
    }

    const token = authHeader.substring(7)
    if (!token) {
        return res.status(401).json({
            error: 'unauthorized',
            error_description: 'Access token is required',
        })
    }

    try {
        const verifyOptions = { issuer: expectedIssuer, audience: process.env.OAUTH2_AUDIENCE, algorithms: ['RS256'] }

        const { payload } = await jwtVerify(token, jwks, verifyOptions)

        req.accessToken = token
        req.tokenInfo = {
            active: true,
            sub: payload.sub,
            iss: payload.iss,
            aud: payload.aud,
            scope: payload.scope || '',
            client_id: payload.client_id || payload.aud,
            exp: payload.exp,
            iat: payload.iat,
        }
        console.log(`Token validated: ${token.substring(0, 10)}... sub=${payload.sub}`)
        next()
    } catch (err) {
        if (err instanceof joseErrors.JOSEError) {
            console.warn(`Token validation failed [${err.code}]: ${err.message}`)
            return res.status(401).json({
                error: 'invalid_token',
                error_description: err.message,
            })
        }
        next(err) // unexpected error → Express error handler
    }
}

// Protected endpoint: /favorite-colors
app.get('/favorite-colors', validateAccessToken, (req, res) => {
    console.log('GET /favorite-colors - Protected endpoint accessed')

    res.json({
        message: 'Successfully retrieved favorite colors',
        data: favoriteColors,
        timestamp: new Date().toISOString(),
        requestedBy: req.tokenInfo.client_id,
    })
})

// Health check endpoint (unprotected)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Resources Server',
        timestamp: new Date().toISOString(),
    })
})

// Root endpoint with API information
app.get('/', (req, res) => {
    res.json({
        service: 'Resources Server',
        version: '1.0.0',
        endpoints: {
            '/health': 'Health check (public)',
            '/favorite-colors': 'Get favorite colors (protected - requires Bearer token)',
        },
        documentation: 'Use Bearer token in Authorization header to access protected endpoints',
    })
})

// Error handling middleware
app.use((err, req, res, _next) => {
    console.error('Resources Server Error:', err)
    res.status(500).json({
        error: 'internal_server_error',
        error_description: 'An internal server error occurred',
    })
})

initializeJwks()
    .then(() => {
        app.listen(port, () => {
            console.info(`Resources Server running at http://localhost:${port}`)
            console.info(`Protected endpoint: http://localhost:${port}/favorite-colors`)
            console.info(`Health check: http://localhost:${port}/health`)
        })
    })
    .catch((err) => {
        console.error('FATAL: Could not initialize JWKS. Resource Server will not start.')
        console.error(err)
        process.exit(1)
    })

module.exports = app
