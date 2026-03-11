const crypto = require('crypto');

PKCE_CODE_VERIFIER_LENGTH_BYTES = 64;
CHALLENGE_METHOD = 'sha256';

function generatePKCE() {
    const codeVerifier = crypto.randomBytes(PKCE_CODE_VERIFIER_LENGTH_BYTES).toString('base64url');
    const codeChallenge = crypto
        .createHash(CHALLENGE_METHOD)
        .update(codeVerifier)
        .digest('base64url');
    return { codeVerifier, codeChallenge };
}

module.exports = {
    generatePKCE,
};
