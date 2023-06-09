import * as assert from 'assert'

import { 
  combineSplitLayout, insertItem, loned, queryLayout, splitLayoutAt 
} from '..'

import { Layout1D } from '../types'

import {
  appendItem, overwrite, prependItem, removeSlice, takeEnd, takeSlice, takeStart
} from '../lib/modify'

import { fix, group, runTest, summary } from './fix'

// test utilities - treat strings as though they were BigUint64Arrays (their 
// lengths) as this is an easy way to visualise and test abstract layouts

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

      const sliced = value.slice(
        Number(item.sliceStart), Number(item.sliceStart + item.sliceSize)
      )

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



// fixtures

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

// start tests

for (let i = 0; i < fixtures.length; i++) {
  const f = fixtures[i]

  const fixtureLine = `fixture ${i + 1}/${fixtures.length}: ${f.name}`
  const inputLine = `input: '${JSON.stringify(f.input)}'`
  const inputSLine = `input as string: '${f.inputString}'`

  const fixGroupHeader = `${fixtureLine}\n${inputLine}\n${inputSLine}`

  group(
    fixGroupHeader,
    () => {
      const bigInts = stringsToSizes(f.input)

      const layout = loned(bigInts)

      // round trip test
      runTest('round trip layout', () => {
        const output = layoutToStrings(f.input, layout)

        assert.deepStrictEqual(output, f.input)

        const outputString = output.join('')

        assert.deepStrictEqual(outputString, f.inputString)
      })


      // split tests
      const splitPositions: bigint[] = []

      for (let s = -2n; s <= layout.size + 2n; s++) {
        splitPositions.push(s)
      }

      runTest('round trip split', () => {
        for (const pos of splitPositions) {
          const fromStart = pos
          const startSplit = splitLayoutAt(layout, fromStart)
          const startComb = combineSplitLayout(startSplit)
          const startString = layoutToStrings(f.input, startComb).join('')

          assert.deepStrictEqual(startString, f.inputString)
        }
      })

      // shared by insert and remove tests

      const insert = '(UwU)'
      const insertData = [...f.input, insert]
      const insertIndex = insertData.length - 1
      const insertSize = BigInt(insert.length)

      // insert tests      
      runTest('insert', () => {
        for (const pos of splitPositions) {
          const fromStart = pos

          const asString = stringInsert(
            f.inputString, insert, Number(fromStart)
          )

          const startInserted = insertItem(
            layout, insertIndex, insertSize, fromStart
          )

          const startString = layoutToStrings(
            insertData, startInserted
          ).join('')

          assert.deepStrictEqual(startString, asString)
        }
      })

      // remove tests      
      runTest('removeSlice', () => {
        for (const pos of splitPositions) {
          if (pos < 0n || pos >= (layout.size - insertSize - 1n)) continue

          // we will first do an insert, then we will call remove on the 
          // inserted item, it should round trip

          const fromStart = pos
          const startInserted = insertItem(
            layout, insertIndex, insertSize, fromStart
          )

          const removed = removeSlice(startInserted, fromStart, insertSize)
          const remString = layoutToStrings(insertData, removed).join('')

          assert.deepStrictEqual(remString, f.inputString)
        }
      })
    }
  )
}

group('one shots', () => {
  // make sure you can create a split item within an existing split item
  runTest('split a split', () => {
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
  })

  // append/prepend - exactly what you expect

  runTest('appendItem', () => {
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
  })

  runTest('prependItem', () => {
    const prependInput = ['abdefg', ' ', 'hijkkm']
    const prepend = '(UwU)'
    const prependData = [...prependInput, prepend]
    const prependIndex = prependData.length - 1
    const prependSize = BigInt(prepend.length)
    const prependExpect = prepend + prependInput.join('')
    const prependLayout = loned(stringsToSizes(prependInput))

    const prepLayout = prependItem(prependLayout, prependIndex, prependSize)
    const prepString = layoutToStrings(prependData, prepLayout).join('')
    assert.deepStrictEqual(prepString, prependExpect)
  })

  // should return the same length, we should check that!
  // would benefit from bounds checking too, like we do with fixtures
  // in fact maybe we should have it in fixtures?
  runTest('overwrite', () => {
    const overInput = ['abdefg <', 'uWu', '> hijkkm']
    const over = '(UwU)'

    const overData = [...overInput, over]
    const overIndex = overData.length - 1
    const overSize = BigInt(over.length)
    const overExpect = 'abdefg (UwU) hijkkm'
    const overLayout = loned(stringsToSizes(overInput))

    const overLayout2 = overwrite(overLayout, overIndex, overSize, 7n)
    const overString = layoutToStrings(overData, overLayout2).join('')

    assert.deepStrictEqual(overString, overExpect)
  })

  // as per above
  runTest('takeSlice', () => {
    const takeInput = ['abdefg <', 'uWu', '> hijkkm']
    const takeLayout = loned(stringsToSizes(takeInput))
    const takeExpect = '<uWu>'

    const takeSliceLayout = takeSlice(takeLayout, 7n, 5n)
    const takeSliceString = layoutToStrings(takeInput, takeSliceLayout).join('')

    assert.deepStrictEqual(takeSliceString, takeExpect)
  })
})

group( 'modify', () => {
  runTest( 'insert negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => insertItem( layout, 0, -1n, 0n ) )
  })

  runTest( 'overwrite negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => overwrite( layout, 0, -1n, 0n ) )
  })

  runTest( 'overwrite negative pos fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => overwrite( layout, 0, 1n, -1n ) )
  })

  // pos + size = end
  runTest( 'overwrite with end out of layout bounds fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => overwrite( layout, 0, 10n, layout.size - 1n ) )
  } )

  // takeStart - just test negative size and that size is less that layout size

  runTest( 'takeStart negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeStart( layout, -1n ) )
  })

  runTest( 'takeStart size greater than layout size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeStart( layout, layout.size + 1n ) )
  })

  // same for takeEnd

  runTest( 'takeEnd negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeEnd( layout, -1n ) )
  })

  runTest( 'takeEnd size greater than layout size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeEnd( layout, layout.size + 1n ) )
  })

  // for takeSlice: negative start, negative size, end > layout.size

  runTest( 'takeSlice negative start fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeSlice( layout, -1n, 1n ) )
  })

  runTest( 'takeSlice negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeSlice( layout, 0n, -1n ) )
  })

  runTest( 'takeSlice end > layout.size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => takeSlice( layout, 0n, layout.size + 1n ) )
  })

  // same for removeSlice

  runTest( 'removeSlice negative start fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))

    assert.throws( () => removeSlice( layout, -1n, 1n ) )
  })

  runTest( 'removeSlice negative size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))
    
    assert.throws( () => removeSlice( layout, 0n, -1n ) )
  })

  runTest( 'removeSlice end > layout.size fails', () => {
    const input = ['abdefg', ' ', 'hijkkm']
    const layout = loned(stringsToSizes(input))
    
    assert.throws( () => removeSlice( layout, 0n, layout.size + 1n ) )
  })
})

group('query layout', () => {
  runTest('empty', () => {
    const emptyInput = new BigUint64Array(0)
    const emptyLayout = loned(emptyInput)

    const res = queryLayout(emptyLayout, 0n)

    const expect = {
      type: 'before',
      before: 0n
    }

    assert.deepStrictEqual(res, expect)
  })

  runTest('malformed layout', () => {
    const oneInput = new BigUint64Array([2n])

    const oneLayout = loned(oneInput)

    // let's add our own nonsense
    const malformedLayout = {
      ...oneLayout,
      items: [{ type: 'nonsense' }]
    } as unknown as Layout1D

    assert.throws(() => queryLayout(malformedLayout, 1n))
  })

  runTest('layout with pos out of boundaries', () => {
    const oneInput = new BigUint64Array([2n])

    const oneLayout = loned(oneInput)

    // let's malform the layout so that 'pos' is outside of the range of any 
    // layout item
    const malformedLayout = {
      ...oneLayout,
      items: oneLayout.items.map(
        item => ({ ...item, start: item.start + 1n, next: item.next - 1n })
      )
    } as unknown as Layout1D

    assert.throws(
      // 'pos' is out of the range of all items
      () => queryLayout(malformedLayout, 1n)
    )
  })
})

summary(() => {
  console.log('hey thanks for testing! bye!')
})
