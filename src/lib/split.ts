import { LayoutItem1D, Layout1D, Slice1D } from '../types'
import { queryLayout } from './query'
import { QueryResult } from './query-types'

export type SplitLayoutType = 'unsplit' | 'boundarySplit' | 'segmentSplit'

export type SplitLayout = {
  type: SplitLayoutType
  splits: LayoutItem1D[][]
  head: LayoutItem1D[],
  tail: LayoutItem1D[],
  start: bigint
  next: bigint
  size: bigint
  queryResult: QueryResult
  splitPos: bigint
}

const splitHelper = (
  layout: Layout1D, type: SplitLayoutType, splits: LayoutItem1D[][],
  head: LayoutItem1D[], tail: LayoutItem1D[],
  queryResult: QueryResult, splitPos: bigint
) => {
  const splitLayout: SplitLayout = {
    type,
    splits,
    head, tail,
    start: layout.start,
    next: layout.next,
    size: layout.size,
    queryResult,
    splitPos
  }

  return Object.freeze(splitLayout)
}

export const splitLayoutAt = (layout: Layout1D, pos: bigint): SplitLayout => {
  const res = queryLayout(layout, pos)

  // none of these result in a split
  if (
    res.type === 'before' || res.type === 'after' || res.type === 'head' ||
    res.type === 'tail'
  ) {
    // it is better to cast in one place with a comment explaining why than to 
    // try to handle the inconsistencies in typescripts handling of arrays and 
    // readonly arrays all through our code - eg Array.flat works perfectly with 
    // either and returns the same types in theory, but typescript can't infer
    // the return type correctly if it's not an explcity array, this is just
    // one example of many
    const litems = layout.items as LayoutItem1D[]

    let head = litems
    let tail = litems

    if( res.type === 'before' || res.type === 'head' ) {
      head = []
    }

    if( res.type === 'after' || res.type === 'tail' ) {
      tail = []
    }

    return splitHelper(
      layout, 'unsplit', [litems], head, tail, res, pos
    )
  }

  // easy 
  if (res.type === 'boundary') {
    const { next } = res

    const head = layout.items.slice(0, next.index)
    const tail = layout.items.slice(next.index)

    return splitHelper(layout, 'boundarySplit', [head, tail], head, tail, res, pos)
  }

  // this is implicit - I don't like it any more than you men.
  // if (res.type === 'inside') {

  // inside - we have to split the child
  const { index } = res
  const child = res.child

  // Get the items before and after the child
  const beforeItems = layout.items.slice(0, index)
  const afterItems = layout.items.slice(index + 1)

  // Split the child
  const [childHead, childTail] = splitChildAt(child, pos)

  return splitHelper(
    layout, 'segmentSplit',
    [beforeItems, [childHead], [childTail], afterItems],
    [ ...beforeItems, childHead ],
    [ childTail, ...afterItems ],
    res, pos
  )

  //}
  //throw Error('Unhandled case @ ' + pos)
}

// if the user has modified the split layout, then unexpected things can happen
// - they should have created the split object with the splitLayoutAt function
//   currently we will call it "undefined" behaviour if they pass a customized 
//   SplitLayout
// - we already freeze our results, but that's not foolsafe, a more reliable
//   way would be to create a Symbol and attach it to the SplitLayout we create
//   which is still not foolsafe, but much better
// - our function always maintains the original size of the layout it was
//   created from, so it is safe to construct a new one from the saved data
export const combineSplitLayout = (split: SplitLayout): Layout1D => {
  // we don't care about the type for reconstruction - it's useful if you're
  // calling splitLayoutAt for another purpose, but not here
  const { splits, start, next, size } = split

  const items = Object.freeze(splits.flat())

  const layout: Layout1D = {
    type: 'layout',
    items,
    start,
    next,
    size
  }

  return Object.freeze(layout)
}

// childAt helper

type ChildData = Pick<Slice1D, 'oid' | 'ostart' | 'osize'>
type SliceChildData = Pick<Slice1D, 'type'> & ChildData

const getShared = (child: LayoutItem1D) => {
  const shared: SliceChildData = {
    type: 'slice',
    oid: child.oid,
    ostart: child.start,
    osize: child.size,
  }

  return shared
}

const sliceHelper = (
  shared: SliceChildData,
  sliceStart: bigint,
  sliceSize: bigint,
  start: bigint,
  next: bigint,
  size: bigint
) => {
  const slice: Slice1D = {
    ...shared,
    sliceStart,
    sliceSize,
    start,
    next,
    size
  }

  return Object.freeze(slice)
}

const splitChildAt = (child: LayoutItem1D, pos: bigint) => {
  // this can never happen, because we don't export this function and it is 
  // never called with a bad pos. but if you need to use it elsewhere, add this
  // back in - it returns an array as expected, but with just the existing
  // child in it
  //
  // if (pos <= child.start || pos >= child.next)
  //   return Object.freeze([child])

  const split: LayoutItem1D[] = []

  const headPos = child.start
  const headSize = pos - headPos

  const tailPos = pos
  const tailSize = child.next - tailPos

  const shared = getShared(child)

  if (child.type === 'segment') {
    const head = sliceHelper(
      shared, 0n, headSize, headPos, pos, headSize
    )

    const tail = sliceHelper(
      shared, headSize, tailSize, pos, child.next, tailSize
    )

    split.push(head, tail)

    return Object.freeze(split)
  }

  // this is implicit - but you need to remember it if you add more types

  //if (child.type === 'slice') {
    const head = sliceHelper(
      shared, child.sliceStart, headSize, headPos, pos, headSize
    )

    const tail = sliceHelper(
      shared, child.sliceStart + headSize, tailSize, pos, child.next, tailSize
    )

    split.push(head, tail)

    return Object.freeze(split)
  //}

  //throw Error('Unhandled case @ ' + pos)
}
