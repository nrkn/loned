import * as assert from 'assert'

import { combineSplitLayout, insertItem, loned, splitLayoutAt } from '..'

import { Layout1D } from '../types'
import { appendItem, overwrite, prependItem, removeSlice, takeSlice } from '../lib/modify'

//

const layoutToStrings = (
  originalData: ArrayLike<string>,
  // the oid in layout items refers to the index in the original data
  layout: Layout1D
) => {
  const result: string[] = []

  for (const item of layout.items) {
    if (item.type === 'segment') {
      result.push(originalData[item.oid])
    } else if (item.type === 'slice') {
      const value = originalData[item.oid]

      const sliced = value.slice(Number(item.sliceStart), Number(item.sliceStart + item.sliceSize))

      result.push(sliced)
    }
  }

  return result
}

const stringsToSizes = (strings: string[]) =>
  new BigUint64Array(strings.map(s => BigInt(s.length)))

// splits the string, prepends the head to insert then appends the tail 
const stringInsert = (target: string, insert: string, position: number) => {
  if (position < 0) position = 0
  if (position > target.length) position = target.length

  const head = target.slice(0, position)
  const tail = target.slice(position)

  return head + insert + tail
}

//

type Fixture = {
  name: string
  input: string[]
  inputString: string
}

const fix = (
  name: string, input: string[]
): Fixture =>
  ({ name, input, inputString: input.join('') })

const fixtures = [
  // oregon trail
  fix(
    'oregon trail',
    [':( YOU', ' ', 'HAVE', ' ', 'DIED', ' ', 'OF', ' ', 'DYSENTERY :(']
  ),
  //empty (these break at moment, fix later lol)
  // fix(
  //   'empty',
  //   []
  // ),
]

const line = (value: number) => '-' + '=-'.repeat(Math.floor(value / 2))

const logIt = (head: string) => {
  console.log()
  console.log(line(head.length))
  console.log(head)
  console.log(line(head.length))
}

const logDescribe = (head: string, length: number) => {
  console.log()
  console.log(line(length))
  console.log(head)
  console.log(line(length))
}

for (const f of fixtures) {
  logDescribe(f.name, 40)
  console.log(f.input)
  console.log(f.inputString)

  const bigInts = stringsToSizes(f.input)

  const layout = loned(bigInts)

  // round trip test
  logIt('round trip layout')

  const output = layoutToStrings(f.input, layout)

  assert.deepStrictEqual(output, f.input)

  const outputString = output.join('')

  assert.deepStrictEqual(outputString, f.inputString)

  console.log('<tick symbol yo>')

  // split tests

  const splitPositions: bigint[] = []

  for (let s = -2n; s <= layout.size + 2n; s++) {
    splitPositions.push(s)
  }

  logIt('round trip split')

  for (const pos of splitPositions) {
    const fromStart = pos
    const startSplit = splitLayoutAt(layout, fromStart)
    const startComb = combineSplitLayout(startSplit)
    const startString = layoutToStrings(f.input, startComb).join('')

    assert.deepStrictEqual(startString, f.inputString)
  }

  console.log('<tick symbol yo>')

  logIt('insert')

  const insert = '(UwU)'
  const insertData = [...f.input, insert]
  const insertIndex = insertData.length - 1
  const insertSize = BigInt(insert.length)

  for (const pos of splitPositions) {
    const fromStart = pos
    const asString = stringInsert(f.inputString, insert, Number(fromStart))
    const startInserted = insertItem(
      layout, insertIndex, insertSize, fromStart
    )
    const startString = layoutToStrings(insertData, startInserted).join('')

    assert.deepStrictEqual(startString, asString)
  }

  console.log('<tick symbol yo>')

  logIt('removeSlice')

  for (const pos of splitPositions) {
    if (pos < 0n || pos >= (layout.size - insertSize - 1n)) continue

    // we will first do an insert, then we will call remove on the inserted item,
    // it should compare to the input

    const fromStart = pos
    const startInserted = insertItem(
      layout, insertIndex, insertSize, fromStart
    )

    let remString: string

    try {
      const removed = removeSlice(startInserted, fromStart, insertSize)
      remString = layoutToStrings(insertData, removed).join('')
    } catch (e) {
      const startString = layoutToStrings(insertData, startInserted).join('')
      console.error({ input: f.input, fromStart, insertSize, startString })
      throw e
    }

    assert.deepStrictEqual(remString, f.inputString)

  }

  console.log('<tick symbol yo>')
}

{
  logIt('split a split')

  const splsplData = ['abdefg', ' ', 'hijkkm']
  const splsplString = splsplData.join('')
  const splsplSizes = stringsToSizes(splsplData)
  const splitLayout = loned(splsplSizes)
  const splOnceOps = splitLayoutAt(splitLayout, 3n)
  const splOnce = combineSplitLayout(splOnceOps)
  const splTwoOps = splitLayoutAt(splOnce, 2n)
  const splTwo = combineSplitLayout(splTwoOps)
  const splTwoString = layoutToStrings(splsplData, splTwo).join('')

  assert.deepStrictEqual(splTwoString, splsplString)

  console.log('<tick symbol yo>')
}

{
  logIt('appendItem')

  const appendInput = ['abdefg', ' ', 'hijkkm']
  const append = '(UwU)'
  const appendData = [...appendInput, append]
  const appendIndex = appendData.length - 1
  const appendSize = BigInt(append.length)
  const appendExpect = appendInput.join('') + append

  const appendLayout = loned(stringsToSizes(appendInput))

  const appLayout = appendItem(appendLayout, appendIndex, appendSize)
  const appString = layoutToStrings(appendData, appLayout).join('')

  assert.deepStrictEqual(appString, appendExpect)

  console.log('<tick symbol yo>')
}

{
  logIt('prependItem')

  const prependInput = ['abdefg', ' ', 'hijkkm']
  const prepend = '(UwU)'
  const prependData = [...prependInput, prepend ]
  const prependIndex = prependData.length - 1
  const prependSize = BigInt(prepend.length)
  const prependExpect = prepend + prependInput.join('')
  const prependLayout = loned(stringsToSizes(prependInput))

  const prepLayout = prependItem(prependLayout, prependIndex, prependSize)
  const prepString = layoutToStrings(prependData, prepLayout).join('')
  assert.deepStrictEqual(prepString, prependExpect)

  console.log('<tick symbol yo>')
}

{
  logIt('overwrite')

  const overInput = ['abdefg <', 'uWu', '> hijkkm']
  const over = '(UwU)'

  const overData = [...overInput, over]
  const overIndex = overData.length - 1
  const overSize = BigInt(over.length)
  const overExpect = 'abdefg (UwU) hijkkm'
  const overLayout = loned(stringsToSizes(overInput))

  const overLayout2 = overwrite(overLayout, overIndex, overSize, 7n )
  const overString = layoutToStrings(overData, overLayout2).join('')
  
  assert.deepStrictEqual(overString, overExpect)
  
  console.log('<tick symbol yo>')  
}

{
  logIt('takeSlice')

  const takeInput = ['abdefg <', 'uWu', '> hijkkm']
  const takeLayout = loned(stringsToSizes(takeInput))
  const takeExpect = '<uWu>'

  const takeSliceLayout = takeSlice(takeLayout, 7n, 5n)
  const takeSliceString = layoutToStrings(takeInput, takeSliceLayout).join('')

  assert.deepStrictEqual(takeSliceString, takeExpect)

  console.log('<tick symbol yo>')
}