/**
 * Fetches an access token using the Client Credentials grant type.
 */

require('dotenv').config({ path: __dirname + '/.env' })

const { discover } = require('../lib/discovery')
const { requireAccessToken, GrantType } = require('../lib/access-token')

async function main() {
  console.info()
  console.info('Client Credentials Grant')
  console.info('========================')
  const oauthServerInfo = await discover(process.env.OAUTH2_DISCOVERY_URL)
  await requireAccessToken({
    grantType: GrantType.CLIENT_CREDENTIALS,
    tokenEndpoint: oauthServerInfo['token_endpoint'],
    clientId: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    scope: process.env.OAUTH2_SCOPE,
  })
}

if (require.main === module) {
  main().catch((error) => console.error(error))
}
