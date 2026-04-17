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
                                    <div onclick="showLibraries('${lang.name}')"
                                         style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;
                                            text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            cursor: pointer; transition: box-shadow 0.2s;"
                                         onmouseover="this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                                         onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                        <h3 style="margin: 10px 0 5px; color: #333;">${lang.name}</h3>
                                        <p style="color: #666; font-size: 12px; margin: 5px 0;">Since ${lang.year}</p>
                                        <p style="color: #888; font-size: 11px; margin: 5px 0;">${lang.paradigm}</p>
                                        <p style="color: #888; font-size: 11px; font-style: italic;">${lang.description}</p>
                                        <p style="color: #1976d2; font-size: 11px; margin-top: 8px;">Click to see libraries &amp; personalities</p>
                                    </div>
                                `,
                          )
                          .join('')}
                    </div>
                    <div id="libraries-dialog-overlay" onclick="closeLibrariesDialog()"
                         style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
                            background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
                        <div onclick="event.stopPropagation()"
                             style="background:white; border-radius:12px; padding:24px; max-width:400px;
                                width:90%; max-height:80vh; overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span id="libraries-dialog-title" style="font-weight:bold;"></span>
                                <button onclick="closeLibrariesDialog()"
                                    style="border:none; background:none; font-size:20px; cursor:pointer;">
                                    &times;</button>
                            </div>
                            <div id="libraries-dialog-content" style="margin-top:12px;">
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                    <script>
                        async function showLibraries(languageName) {
                            const overlay = document.getElementById('libraries-dialog-overlay');
                            const content = document.getElementById('libraries-dialog-content');
                            const title = document.getElementById('libraries-dialog-title');
                            title.textContent = languageName;
                            content.innerHTML = '<p>Loading...</p>';
                            overlay.style.display = 'flex';
                            try {
                                const encoded = encodeURIComponent(languageName);
                                const [libResp, persResp] = await Promise.all([
                                    fetch('/libraries/' + encoded),
                                    fetch('/personalities/' + encoded),
                                ]);
                                const libHtml = await libResp.text();
                                const persHtml = await persResp.text();
                                content.innerHTML = libHtml + persHtml;
                            } catch (e) {
                                content.innerHTML = '<p style="color:#d32f2f;">Failed to load details.</p>';
                            }
                        }
                        function closeLibrariesDialog() {
                            document.getElementById('libraries-dialog-overlay').style.display = 'none';
                        }
                    </script>
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
