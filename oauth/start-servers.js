#!/usr/bin/env node

const { spawn } = require('child_process')
const { colorLog, BRIGHT_YELLOW, BRIGHT_GREEN, BRIGHT_MAGENTA, BRIGHT_CYAN, BRIGHT_BLUE } = require('./colors')

console.log('🚀 Starting OAuth Application and Resource Servers...\n')

spawnNode = (scriptPath, appName, color) => {
    const app = spawn('node', [scriptPath], {
        cwd: __dirname,
        stdio: 'pipe',
    })
    app.stdout.on('data', (data) => {
        colorLog(`[${appName}] ${data.toString().trim()}`, color)
    })
    app.stderr.on('data', (data) => {
        console.error(`[${appName} Error] ${data.toString().trim()}`)
    })
    return app
}

const favoritesApp = spawnNode('favorites-app/application.js', 'Favorites App', BRIGHT_YELLOW)
const colorsServer = spawnNode(
    'colors-resource/resources-server.js',
    'Colors Server',
    BRIGHT_GREEN,
)
const languagesServer = spawnNode(
    'languages-resource/resources-server.js',
    'Languages Server',
    BRIGHT_MAGENTA,
)
const librariesServer = spawnNode(
    'libraries-resource/resources-server.js',
    'Libraries Server',
    BRIGHT_CYAN,
)
const personalitiesServer = spawnNode(
    'personalities-resource/resources-server.js',
    'Personalities Server',
    BRIGHT_BLUE,
)

favoritesApp.on('close', (code) => {
    colorLog(`\n❌ Favorites App exited with code ${code}`, BRIGHT_YELLOW)
    process.exit(code)
})

colorsServer.on('close', (code) => {
    colorLog(`\n❌ Colors Server exited with code ${code}`, BRIGHT_GREEN)
    process.exit(code)
})

languagesServer.on('close', (code) => {
    colorLog(`\n❌ Languages Server exited with code ${code}`, BRIGHT_MAGENTA)
    process.exit(code)
})

librariesServer.on('close', (code) => {
    colorLog(`\n❌ Libraries Server exited with code ${code}`, BRIGHT_CYAN)
    process.exit(code)
})

personalitiesServer.on('close', (code) => {
    colorLog(`\n❌ Personalities Server exited with code ${code}`, BRIGHT_BLUE)
    process.exit(code)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...')
    favoritesApp.kill('SIGINT')
    colorsServer.kill('SIGINT')
    languagesServer.kill('SIGINT')
    librariesServer.kill('SIGINT')
    personalitiesServer.kill('SIGINT')
    setTimeout(() => {
        process.exit(0)
    }, 1000)
})

console.log('📝 All servers are starting up...')
console.log('🌐 OAuth Application: http://localhost:3000')
console.log('🔒 Colors Resource Server: http://localhost:3001')
console.log('🔒 Languages Resource Server: http://localhost:3002')
console.log('🔒 Libraries Resource Server: http://localhost:3003')
console.log('🔒 Personalities Resource Server: http://localhost:3004')
console.log('📊 Dashboard: http://localhost:3000/dashboard')
console.log('\n💡 To test the integration:')
console.log('   1. Visit http://localhost:3000/login_duo to authenticate')
console.log("   2. After login, you'll be redirected to the dashboard")
console.log('   3. The dashboard will display favorite colors from the Resources Server')
console.log('\n⏹️  Press Ctrl+C to stop both servers')
