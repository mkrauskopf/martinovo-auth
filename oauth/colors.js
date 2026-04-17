// Reset
const RESET = '\x1b[0m'

// Regular Colors (30-37)
const BLACK = '\x1b[30m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const MAGENTA = '\x1b[35m'
const CYAN = '\x1b[36m'
const WHITE = '\x1b[37m'

// Bright Colors (90-97)
const BRIGHT_BLACK = '\x1b[90m' // Gray
const BRIGHT_RED = '\x1b[91m'
const BRIGHT_GREEN = '\x1b[92m'
const BRIGHT_YELLOW = '\x1b[93m'
const BRIGHT_BLUE = '\x1b[94m'
const BRIGHT_MAGENTA = '\x1b[95m'
const BRIGHT_CYAN = '\x1b[96m'
const BRIGHT_WHITE = '\x1b[97m'

// Background Colors (40-47)
const BG_BLACK = '\x1b[40m'
const BG_RED = '\x1b[41m'
const BG_GREEN = '\x1b[42m'
const BG_YELLOW = '\x1b[43m'
const BG_BLUE = '\x1b[44m'
const BG_MAGENTA = '\x1b[45m'
const BG_CYAN = '\x1b[46m'
const BG_WHITE = '\x1b[47m'

// Bright Background Colors (100-107)
const BG_BRIGHT_BLACK = '\x1b[100m'
const BG_BRIGHT_RED = '\x1b[101m'
const BG_BRIGHT_GREEN = '\x1b[102m'
const BG_BRIGHT_YELLOW = '\x1b[103m'
const BG_BRIGHT_BLUE = '\x1b[104m'
const BG_BRIGHT_MAGENTA = '\x1b[105m'
const BG_BRIGHT_CYAN = '\x1b[106m'
const BG_BRIGHT_WHITE = '\x1b[107m'

// Text Styles
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const ITALIC = '\x1b[3m'
const UNDERLINE = '\x1b[4m'
const BLINK = '\x1b[5m'
const REVERSE = '\x1b[7m'
const STRIKETHROUGH = '\x1b[9m'

function colorLog(text, color) {
  console.log(`${color}${text}${RESET}`)
}

module.exports = {
  RESET,
  BLACK,
  RED,
  GREEN,
  YELLOW,
  BLUE,
  MAGENTA,
  CYAN,
  WHITE,
  BRIGHT_BLACK,
  BRIGHT_RED,
  BRIGHT_GREEN,
  BRIGHT_YELLOW,
  BRIGHT_BLUE,
  BRIGHT_MAGENTA,
  BRIGHT_CYAN,
  BRIGHT_WHITE,
  BG_BLACK,
  BG_RED,
  BG_GREEN,
  BG_YELLOW,
  BG_BLUE,
  BG_MAGENTA,
  BG_CYAN,
  BG_WHITE,
  BG_BRIGHT_BLACK,
  BG_BRIGHT_RED,
  BG_BRIGHT_GREEN,
  BG_BRIGHT_YELLOW,
  BG_BRIGHT_BLUE,
  BG_BRIGHT_MAGENTA,
  BG_BRIGHT_CYAN,
  BG_BRIGHT_WHITE,
  BOLD,
  DIM,
  ITALIC,
  UNDERLINE,
  BLINK,
  REVERSE,
  STRIKETHROUGH,
  colorLog,
}
