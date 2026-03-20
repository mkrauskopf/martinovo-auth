require('dotenv').config({ path: __dirname + '/.env' })
require('../init')

const express = require('express')
const session = require('express-session')
const crypto = require('crypto')
const { constructAuthorizeURL } = require('../lib/authorize')
const { generatePKCE } = require('../pkce')
const { dashboardTemplate } = require('./dashboard-template')
const { loadFavoriteColorsHtml } = require('./colors-fetcher')
const { loadFavoriteLanguagesHtml } = require('./languages-fetcher')
const { loadLibrariesHtml } = require('./libraries-fetcher')
const { loadPersonalitiesHtml } = require('./personalities-fetcher')
const { requireAccessToken, GrantType } = require('../lib/access-token')

const app = express()
const port = 3000

const { parseJwt } = require('../lib/jwt')

// Session Middleware used to store the 'state' parameter and user tokens
app.use(
    session({
        secret: crypto.randomBytes(32).toString('hex'), // Use a strong, unique secret
        resave: false,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' }, // Use secure cookies in production
    }),
)

// --- Routes ---

// Initiate OAuth flow (e.g., when a user clicks "Login")
app.get('/login', (req, res) => {
    // Generate a random 'state' parameter to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex')
    req.session.oauthState = state // Store it in the session for verification later

    const { codeVerifier, codeChallenge } = generatePKCE()
    req.session.codeVerifier = codeVerifier

    const authorizeURL = constructAuthorizeURL({
        authorizationEndpoint: process.env.OAUTH2_AUTHORIZE_URL,
        clientId: process.env.OAUTH2_CLIENT_ID,
        redirectURI: process.env.OAUTH2_REDIRECT_URI,
        resource: process.env.OAUTH2_RESOURCE?.split(','),
        scope: process.env.OAUTH2_SCOPE,
        withPKCE: true,
        codeChallenge,
        state,
    })

    res.redirect(authorizeURL)
})

// Callback Endpoint (redirect_uri) - Handles the redirect from the Authorization Server
app.get('/oauth2/callback', async (req, res) => {
    console.debug('%cMK: GET /oauth2/callback', 'font-weight: bold')
    const { code, state, error, error_description } = req.query

    // Handle Errors from Authorization Server
    if (error) {
        console.error('OAuth Error:', error, error_description)
        return res.status(400).send(`OAuth Error: ${error_description || error}`)
    }

    // Verify 'state' parameter for CSRF protection
    if (!state || state !== req.session.oauthState) {
        console.error('Invalid state parameter. Possible CSRF attack.')
        delete req.session.oauthState
        return res.status(403).send('Invalid state parameter.')
    }

    // Clear the state from session after successful verification
    delete req.session.oauthState

    // Exchange Authorization Code for Access Token
    if (!code) {
        return res.status(400).send('Authorization code not received.')
    }

    const codeVerifier = req.session.codeVerifier
    delete req.session.codeVerifier

    try {
        const {
            access_token: encodedAccessToken,
            refresh_token: refreshToken,
            id_token: idToken,
            expires_in: expiresIn,
            scope,
        } = await requireAccessToken({
            tokenEndpoint: process.env.OAUTH2_TOKEN_URL,
            grantType: GrantType.AUTHORIZATION_CODE,
            authorizationCode: code,
            clientId: process.env.OAUTH2_CLIENT_ID,
            clientSecret: process.env.OAUTH2_CLIENT_SECRET,
            scope: process.env.OAUTH2_SCOPE,
            redirectURI: process.env.OAUTH2_REDIRECT_URI,
            withPKCE: true,
            codeVerifier,
            resource: process.env.OAUTH2_RESOURCE?.split(','),
        })

        console.debug('Successfully exchanged code for tokens!')
        console.debug('Encoded Access Token:', encodedAccessToken)

        const accessToken = parseJwt(encodedAccessToken)
        console.info('Parsed Access Token:')
        console.info('- Header:\n', accessToken.header)
        console.info('- Payload:\n', accessToken.payload)

        // Store Tokens in session. For a real application, consider more robust token storage.
        req.session.accessToken = accessToken
        req.session.encodedAccessToken = encodedAccessToken
        req.session.refreshToken = refreshToken
        req.session.idToken = idToken
        req.session.tokenExpiresAt = Date.now() + expiresIn * 1000 // Store expiry time
        req.session.scope = scope

        // Redirect user to a protected area or display success
        res.redirect('/dashboard')
    } catch (error) {
        console.error(
            'Error exchanging authorization code for tokens:',
            error.response ? error.response.data : error.message,
        )
        res.status(500).send('Error during token exchange.')
    }
})

// A protected route example
app.get('/dashboard', async (req, res) => {
    console.debug('GET /dashboard')
    if (!req.session.encodedAccessToken) {
        console.debug('NOT having access token.')
        res.redirect('/')
        return
    }

    console.debug('Having access token.')
    const scope = req.session.scope || ''

    const [colorsHtml, languagesHtml] = await Promise.all([
        scope.includes('read:colors')
            ? loadFavoriteColorsHtml(req.session.encodedAccessToken)
            : Promise.resolve(''),
        scope.includes('read:languages')
            ? loadFavoriteLanguagesHtml(req.session.encodedAccessToken)
            : Promise.resolve(''),
    ])

    const dashboardHtml = dashboardTemplate(colorsHtml + languagesHtml, req.session.accessToken)
    res.send(dashboardHtml)
})

app.get('/libraries/:languageName', async (req, res) => {
    if (!req.session.encodedAccessToken) {
        return res.status(401).send('Not authenticated')
    }

    const languageName = req.params.languageName
    const html = await loadLibrariesHtml(req.session.encodedAccessToken, languageName)
    res.send(html)
})

app.get('/personalities/:languageName', async (req, res) => {
    if (!req.session.encodedAccessToken) {
        return res.status(401).send('Not authenticated')
    }

    const languageName = req.params.languageName
    const html = await loadPersonalitiesHtml(req.session.encodedAccessToken, languageName)
    res.send(html)
})

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err)
            return res.status(500).send('Error logging out.')
        }
        res.send('<h1>Logged Out</h1><p><a href="/">Home</a></p>')
    })
})

app.get('/', (req, res) => {
    res.send(`<h1>Home Page</h1>
              <p><a href="/login">Login</a></p>`)
})

// Start the server
app.listen(port, () => {
    console.info(`Server running at http://localhost:${port}`)
    console.info(`Initiate OAuth flow by visiting http://localhost:${port}/login`)
})
