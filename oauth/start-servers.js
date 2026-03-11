#!/usr/bin/env node

const { spawn } = require('child_process')
const { colorLog, BRIGHT_BLUE, BRIGHT_GREEN } = require('./colors')

console.log('🚀 Starting OAuth Application and Resources Server...\n')

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

const favoritesApp = spawnNode('favorites-app/application.js', 'Favorites App', BRIGHT_BLUE)
const resourcesServer = spawnNode(
    'colors-resource/resources-server.js',
    'Resources Server',
    BRIGHT_GREEN,
)

favoritesApp.on('close', (code) => {
    colorLog(`\n❌ Favorites App exited with code ${code}`, BRIGHT_BLUE)
    process.exit(code)
})

resourcesServer.on('close', (code) => {
    colorLog(`\n❌ Resources Server exited with code ${code}`, BRIGHT_GREEN)
    process.exit(code)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...')
    favoritesApp.kill('SIGINT')
    resourcesServer.kill('SIGINT')
    setTimeout(() => {
        process.exit(0)
    }, 1000)
})

console.log('📝 Both servers are starting up...')
console.log('🌐 OAuth Application: http://localhost:3000')
console.log('🔒 Resources Server: http://localhost:3001')
console.log('📊 Dashboard with favorite colors: http://localhost:3000/dashboard')
console.log('\n💡 To test the integration:')
console.log('   1. Visit http://localhost:3000/login_duo to authenticate')
console.log("   2. After login, you'll be redirected to the dashboard")
console.log('   3. The dashboard will display favorite colors from the Resources Server')
console.log('\n⏹️  Press Ctrl+C to stop both servers')
