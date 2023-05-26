# loned

Layout in 1D

Abstracts handling linear layout of items that can be measured in 1 dimension

Are you:

- laying out UI elements
- handling memory layout
- dealing with file formats

If so, please, for the sake of all that is good, find a more robust and reliable 
solution. 

However, *I* will be using it for toy projects dabbling in these things, and you 
are welcome to join me.

In its current state, it is considerably more low-level than future releases
will be - later on, you won't have to eg keep track of your own indices when 
modifying the layout, among other annoyances

## install

`npm install @nrkn/loned`

## usage

```js
import { 
  loned, relayout, 
  
  queryLayout, 

  splitLayoutAt, combineSplitLayout,

  insertItem, appendItem, prependItem, overwrite, takeStart, takeEnd, 
  removeStart, removeEnd, takeSlice, removeSlice
} from '@nrkn/loned'

const myData = [
  { text: 'UwU', fg: 10, bg: 4 },
  { text: ' ', fg: 7, bg: 0 },
  { text: 'OwO', fg: 4, bg: 10 }
]

const mySizes = new BigUint64Array(
  myData.map(({ text }) => BigInt(text.length))
)

const layout = loned(mySizes)

const res = queryLayout(layout, 5n )

console.log( res.type ) 
/*  
  will be 'inside', could have also been: 
  'before' - the query is before the start of the layout
  'after' - the query is after the end of the layout
  'head' - the query is exactly at the start of the layout
  'tail' - the query is exactly at the end of the layout
  'boundary' - the query is on the boundary between two items

  res also contains information about the items that are involved in the query,
  if any
*/

// updating - we want to give it the new id
const newData = { text: ' uWu', fg: 2, bg: 8 }
const newSize = BigInt(newData.text.length)

const dataLookup = [
  ...myData,
  newData
]

const nextId = dataLookup.length - 1

// insert after the first UwU
// note we pass it the layout we created earlier, without the newData in it
// - when modifying, you need a way to keep track of the new items
const nextLayout = insertItem(layout, nextId, newSize, 3n)

// now use the layout data to create a new array 

const result = []

for( const item of newLayout.items ){
  if( item.type === 'segment' ){
    result.push( dataLookup[item.oid] )
  } else if( item.type === 'slice' ){
    const data = dataLookup[item.oid]

    data.text = data.text.slice(
      Number(item.sliceStart), 
      Number(item.sliceStart + item.sliceSize)
    )

    result.push(sliced)
  }
}

console.log( result ) // back in our original format, but with new uWu
```

## API

- `loned(sizes: BigUint64Array): Layout1D`
  create a layout given the sizes of the items
- `relayout(items: LayoutItem1D[] ): Layout1D`
  relayout items from one or more other layouts

- `queryLayout(layout: Layout1D, pos: bigint): QueryResult`
  find out what's at the position - is it inside an item, between items, which
  items and so forth

- `splitLayoutAt(layout: Layout1D, pos: bigint): SplitLayout`
  split a layout into a head and tail of LayoutItem1D, along with a lot of 
  other information about the split (eg the query result)
- `combineSplitLayout(split: SplitLayout): Layout1D`
  combine a split layout back into a single layout
   
- `insertItem(layout: Layout1D, oid: number, size: bigint, pos: bigint): Layout1D`
  insert a new item into the layout, splitting an existing item if necessary 
- `appendItem(layout: Layout1D, oid: number, size: bigint): Layout1D`
  appends an item to end of layout
- `prependItem(layout: Layout1D, oid: number, size: bigint): Layout1D`
  prepends an item to start of layout
- `overwrite(layout: Layout1D, oid: number, size: bigint, pos: bigint): Layout1D`
  overwrite any items that overlap with the new item, splitting them if only
  partial
- `takeStart(layout: Layout1D, size: bigint): Layout1D`
  take the start of the layout, up to the given size
- `takeEnd(layout: Layout1D, size: bigint): Layout1D`
  take the end of the layout, up to the given size
- `removeStart(layout: Layout1D, size: bigint): Layout1D`
  remove the start of the layout, up to the given size
- `removeEnd(layout: Layout1D, size: bigint): Layout1D`
  remove the end of the layout, up to the given size
- `takeSlice(layout: Layout1D, start: bigint, size: bigint): Layout1D`
  take a slice of the layout, splitting items at the bounds if necessary
- `removeSlice(layout: Layout1D, start: bigint, size: bigint): Layout1D`
  remove a slice of the layout, splitting items at the bounds if necessary

# future

Wrap everything in a factory function that abstracts away annoying low level
details like having to pass in a BigUint64Array for sizes, and having to manage
your own indices when inserting etc

You will just need to bring your own:

measure: (item: T) => bigint
slice: (item: T, slicedata ) => T[] 

We will provide an implementation for plain strings

# nb

Early stages, API likely to change frequently. More detailed documentation may
one day be written. Here be dragons, use at your own peril.

# license

MIT License

Copyright (c) 2023 Nik Coughlin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
