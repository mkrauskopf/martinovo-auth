async function loadFavoriteLanguagesHtml(accessToken) {
    try {
        const response = await fetch('http://localhost:3002/favorite-languages', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })

        if (response.ok) {
            const res = await response.json()
            console.debug(`Successfully fetched favorite languages: ${res.data.length} languages`)

            return `
                    <h2>Your Favorite Languages</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                        ${res.data
                            .map(
                                (lang) => `
                                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <h3 style="margin: 10px 0 5px; color: #333;">${lang.name}</h3>
                                        <p style="color: #666; font-size: 12px; margin: 5px 0;">Since ${lang.year}</p>
                                        <p style="color: #888; font-size: 11px; margin: 5px 0;">${lang.paradigm}</p>
                                        <p style="color: #888; font-size: 11px; font-style: italic;">${lang.description}</p>
                                    </div>
                                `,
                            )
                            .join('')}
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        <em>Data retrieved from Languages Resource Server at ${res.timestamp}</em>
                    </p>
                `
        } else {
            console.error('Failed to fetch favorite languages:', response.status, response.statusText)
            const errorData = await response.json().catch(() => ({}))
            return `
                    <h2>Favorite Languages</h2>
                    <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                        Failed to load favorite languages: ${errorData.error_description || 'Unknown error'}
                    </p>
                `
        }
    } catch (error) {
        console.error('Error calling Languages Resource Server:', error)
        return `
                <h2>Favorite Languages</h2>
                <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                    Error connecting to Languages Resource Server. Make sure it's running on port 3002.
                </p>
            `
    }
}

module.exports = {
    loadFavoriteLanguagesHtml,
}
