async function loadPersonalitiesHtml(accessToken, languageName) {
  try {
    const response = await fetch(
      `http://localhost:3002/favorite-languages/${encodeURIComponent(languageName)}/personalities`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const res = await response.json()
      console.debug(`Successfully fetched personalities for ${languageName}: ${res.data.length} personalities`)

      return `
                    <h3>Famous People in ${languageName}</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${res.data
                          .map(
                            (person) => `
                                    <li style="padding: 8px 12px; margin: 4px 0; background: #f5f5f5;
                                        border-radius: 4px; font-size: 14px;">${person}</li>
                                `,
                          )
                          .join('')}
                    </ul>
                `
    } else {
      console.error('Failed to fetch personalities:', response.status, response.statusText)
      const errorData = await response.json().catch(() => ({}))
      return `
                    <h3>Personalities for ${languageName}</h3>
                    <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                        Failed to load personalities: ${errorData.error_description || 'Unknown error'}
                    </p>
                `
    }
  } catch (error) {
    console.error('Error calling Languages Resource Server for personalities:', error)
    return `
                <h3>Personalities for ${languageName}</h3>
                <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                    Error connecting to Languages Resource Server. Make sure it's running on port 3002.
                </p>
            `
  }
}

module.exports = {
  loadPersonalitiesHtml,
}
