function parseJwt(token) {
    console.debug('Parsing JWT token:')
    const [headerBase64, payloadBase64, _signatureBase64] = token
        .split('.')
        .map((base64Url) => base64Url.replace(/-/g, '+').replace(/_/g, '/'))

    const jsonHeader = Buffer.from(headerBase64, 'base64').toString('utf8')
    const header = JSON.parse(jsonHeader)
    console.debug('  header\n', header)

    const jsonPayload = Buffer.from(payloadBase64, 'base64').toString('utf8')
    const payload = JSON.parse(jsonPayload)
    console.debug('  payload\n', payload)

    return { header, payload }
}

module.exports = {
    parseJwt,
}
