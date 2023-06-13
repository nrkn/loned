export type Fixture = {
  name: string
  input: string[]
  inputString: string
}

export const fix = (
  name: string, input: string[]
): Fixture =>
  ({ name, input, inputString: input.join('') })

export const tickLabel = ' :)'
export const failLabel = '>:('


// if interactive, fit to screen, else use 40 columns

let cols = process.stdout.columns || 40

// leave some room for our decorative dividers
if (cols > 3) cols -= 2

// divider helper
export const line = (value: number, head = '-', pattern = '=-') =>
  head + pattern.repeat(Math.floor(value / pattern.length))

// test runners
let totalTests = 0
let passedTests = 0
let failedTests = 0

export const restart = () => {
  totalTests = 0
  passedTests = 0
  failedTests = 0
}

export const runTest = (head: string, action: () => void) => {
  let label = failLabel

  try {
    action()
    passedTests++
    label = tickLabel
  } catch (err: any) {
    console.error(err)
    failedTests++
  }

  head = label + ' ' + head

  console.log(head)
  console.log(line(head.length))

  totalTests++
}

export const group = (head: string, action: () => void) => {
  const length = cols
  console.log()
  console.log(line(length, '=', '-='))
  console.log(head)
  console.log(line(length, '=', '-='))

  action()
}

export const summary = (action: () => void) => {
  const passReport = `passed ${passedTests}/${totalTests}`
  const failReport = `failed ${failedTests}/${totalTests}`
  const report = `${passReport}\n${failReport}`

  const length = cols
  console.log()
  console.log(line(length, 'U', 'wU'))
  console.log(report)
  console.log(line(length, 'O', 'wO'))

  action()
}
