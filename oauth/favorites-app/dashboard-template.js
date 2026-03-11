// AI generated and tweaked
function dashboardTemplate(body, accessToken) {
    return `<div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px;">
                <h1>Welcome to your Dashboard!</h1>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p>✅ You are authenticated with an access token.</p>
                    <p><strong>Access Token Scopes:</strong> <code>${accessToken.payload.scope}</code></p>
                </div>
                
                ${body}
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p><a href="/logout" style="color: #d32f2f; text-decoration: none;">🚪 Logout</a></p>
                </div>
            </div>`
}

module.exports = {
    dashboardTemplate,
}
