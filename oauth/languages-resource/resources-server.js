require('dotenv').config({ path: __dirname + '/.env' })
require('../init')

const express = require('express')
const { createRemoteJWKSet, jwtVerify, errors: joseErrors } = require('jose')
const { discover } = require('../lib/discovery')
const { requireAccessToken, GrantType } = require('../lib/access-token')
const favoriteLanguages = require('./languages.json')
const userLanguages = require('./user-languages.json')

const app = express()
const port = 3002

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

let librariesAccessToken = null
let librariesTokenExpiresAt = 0

async function getLibrariesAccessToken() {
    if (librariesAccessToken && Date.now() < librariesTokenExpiresAt) {
        return librariesAccessToken
    }

    const discoveryURL = process.env.OAUTH2_DISCOVERY_URL
    const metadata = await discover(discoveryURL)

    const tokenResponse = await requireAccessToken({
        tokenEndpoint: metadata.token_endpoint,
        grantType: GrantType.CLIENT_CREDENTIALS,
        clientId: process.env.OAUTH2_LIBRARIES_CLIENT_ID,
        clientSecret: process.env.OAUTH2_LIBRARIES_CLIENT_SECRET,
        scope: process.env.OAUTH2_LIBRARIES_SCOPE,
        resource: process.env.OAUTH2_LIBRARIES_SERVER_URL,
    })

    librariesAccessToken = tokenResponse.access_token
    librariesTokenExpiresAt = Date.now() + (tokenResponse.expires_in - 60) * 1000
    console.info('Obtained client credentials token for libraries-resource server')
    return librariesAccessToken
}

async function getPersonalitiesAccessToken(subjectToken) {
    const discoveryURL = process.env.OAUTH2_DISCOVERY_URL
    const metadata = await discover(discoveryURL)

    const tokenResponse = await requireAccessToken({
        tokenEndpoint: metadata.token_endpoint,
        grantType: GrantType.TOKEN_EXCHANGE,
        clientId: process.env.OAUTH2_PERSONALITIES_CLIENT_ID,
        clientSecret: process.env.OAUTH2_PERSONALITIES_CLIENT_SECRET,
        subjectToken,
        subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
        audience: process.env.OAUTH2_PERSONALITIES_SERVER_URL,
        scope: process.env.OAUTH2_PERSONALITIES_SCOPE,
    })

    console.info('Obtained token-exchange token for personalities-resource server')
    return tokenResponse.access_token
}

// Protected endpoint: /favorite-languages
app.get('/favorite-languages', validateAccessToken, (req, res) => {
    const sub = req.tokenInfo.sub
    console.log(`GET /favorite-languages - Protected endpoint accessed by sub=${sub}`)

    const allowedIds = userLanguages[sub]
    if (!allowedIds) {
        return res.status(403).json({
            error: 'forbidden',
            error_description: `No language mapping found for user ${sub}`,
        })
    }

    const filtered = favoriteLanguages.filter((lang) => allowedIds.includes(lang.id))

    res.json({
        message: 'Successfully retrieved favorite languages',
        data: filtered,
        timestamp: new Date().toISOString(),
        requestedBy: sub,
    })
})

// Protected endpoint: /favorite-languages/:name/libraries (proxy to libraries-resource)
app.get('/favorite-languages/:name/libraries', validateAccessToken, async (req, res) => {
    const languageName = req.params.name
    const sub = req.tokenInfo.sub
    console.log(`GET /favorite-languages/${languageName}/libraries - Proxying to libraries-resource for sub=${sub}`)

    const allowedIds = userLanguages[sub]
    if (!allowedIds) {
        return res.status(403).json({
            error: 'forbidden',
            error_description: `No language mapping found for user ${sub}`,
        })
    }

    const requestedLang = favoriteLanguages.find((lang) => lang.name.toLowerCase() === languageName.toLowerCase())
    if (!requestedLang || !allowedIds.includes(requestedLang.id)) {
        return res.status(403).json({
            error: 'forbidden',
            error_description: `User ${sub} does not have access to language "${languageName}"`,
        })
    }

    try {
        const token = await getLibrariesAccessToken()
        const librariesServerUrl = process.env.OAUTH2_LIBRARIES_SERVER_URL || 'http://localhost:3003'
        const response = await fetch(`${librariesServerUrl}/libraries/${encodeURIComponent(languageName)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()
        res.status(response.status).json(data)
    } catch (error) {
        console.error(`Error proxying libraries request for ${languageName}:`, error)
        res.status(502).json({
            error: 'bad_gateway',
            error_description: 'Failed to fetch libraries from libraries-resource server',
        })
    }
})

// Protected endpoint: /favorite-languages/:name/personalities (proxy to personalities-resource via Token Exchange)
app.get('/favorite-languages/:name/personalities', validateAccessToken, async (req, res) => {
    const languageName = req.params.name
    const sub = req.tokenInfo.sub
    console.log(
        `GET /favorite-languages/${languageName}/personalities - Proxying to personalities-resource for sub=${sub}`,
    )

    const allowedIds = userLanguages[sub]
    if (!allowedIds) {
        return res.status(403).json({
            error: 'forbidden',
            error_description: `No language mapping found for user ${sub}`,
        })
    }

    const requestedLang = favoriteLanguages.find((lang) => lang.name.toLowerCase() === languageName.toLowerCase())
    if (!requestedLang || !allowedIds.includes(requestedLang.id)) {
        return res.status(403).json({
            error: 'forbidden',
            error_description: `User ${sub} does not have access to language "${languageName}"`,
        })
    }

    try {
        const token = await getPersonalitiesAccessToken(req.accessToken)
        const personalitiesServerUrl = process.env.OAUTH2_PERSONALITIES_SERVER_URL || 'http://localhost:3004'
        const response = await fetch(
            `${personalitiesServerUrl}/personalities/${encodeURIComponent(languageName)}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        )

        const data = await response.json()
        res.status(response.status).json(data)
    } catch (error) {
        console.error(`Error proxying personalities request for ${languageName}:`, error)
        res.status(502).json({
            error: 'bad_gateway',
            error_description: 'Failed to fetch personalities from personalities-resource server',
        })
    }
})

// Health check endpoint (unprotected)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Languages Resource Server',
        timestamp: new Date().toISOString(),
    })
})

// Root endpoint with API information
app.get('/', (req, res) => {
    res.json({
        service: 'Languages Resource Server',
        version: '1.0.0',
        endpoints: {
            '/health': 'Health check (public)',
            '/favorite-languages': 'Get favorite languages (protected - requires Bearer token)',
        },
        documentation: 'Use Bearer token in Authorization header to access protected endpoints',
    })
})

// Error handling middleware
app.use((err, req, res, _next) => {
    console.error('Languages Resource Server Error:', err)
    res.status(500).json({
        error: 'internal_server_error',
        error_description: 'An internal server error occurred',
    })
})

initializeJwks()
    .then(() => {
        app.listen(port, () => {
            console.info(`Languages Resource Server running at http://localhost:${port}`)
            console.info(`Protected endpoint: http://localhost:${port}/favorite-languages`)
            console.info(`Health check: http://localhost:${port}/health`)
        })
    })
    .catch((err) => {
        console.error('FATAL: Could not initialize JWKS. Languages Resource Server will not start.')
        console.error(err)
        process.exit(1)
    })

module.exports = app
