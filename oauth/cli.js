function createCLI() {
  return require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

module.exports = {
  createCLI,
}
