// AI generated and tweaked
async function loadFavoriteColorsHtml(accessToken) {
    try {
        const response = await fetch('http://localhost:3001/favorite-colors', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })

        if (response.ok) {
            const res = await response.json()
            console.debug(`Successfully fetched favorite colors ${res.data.length} colors`)

            // Generate HTML for favorite colors (AI production)
            return `
                    <h2>Your Favorite Colors</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                        ${res.data
                            .map(
                                (color) => `
                                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <div style="width: 60px; height: 60px; background-color: ${color.hex}; border-radius: 50%; margin: 0 auto 10px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                                        <h3 style="margin: 10px 0 5px; color: #333;">${color.name}</h3>
                                        <p style="color: #666; font-size: 12px; margin: 5px 0;">${color.hex}</p>
                                        <p style="color: #888; font-size: 11px; font-style: italic;">${color.description}</p>
                                    </div>
                                `,
                            )
                            .join('')}
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        <em>Data retrieved from Resources Server at ${res.timestamp}</em>
                    </p>
                `
        } else {
            console.error('Failed to fetch favorite colors:', response.status, response.statusText)
            const errorData = await response.json().catch(() => ({}))
            return `
                    <h2>Favorite Colors</h2>
                    <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                        ❌ Failed to load favorite colors: ${errorData.error_description || 'Unknown error'}
                    </p>
                `
        }
    } catch (error) {
        console.error('Error calling Resources Server:', error)
        return `
                <h2>Favorite Colors</h2>
                <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                    ❌ Error connecting to Resources Server. Make sure it's running on port 3001.
                </p>
            `
    }
}

module.exports = {
    loadFavoriteColorsHtml,
}
