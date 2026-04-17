// Disable TLS verification for development (same as other files)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

// Uncomment to disable debug logging.
//console.debug = () => {} // No-op function

process.removeAllListeners('warning')
process.on('warning', (warning) => {
  // For  now only suppress the specific TLS warning for this project.
  if (warning.name === 'Warning' && warning.message.includes('NODE_TLS_REJECT_UNAUTHORIZED')) {
    return
  }

  // Show other warnings
  console.warn(warning.name + ': ' + warning.message)
})
