import { LayoutItem1D, Segment1D, Layout1D } from '../types'

// performs a contiguous 1D layout of the given sizes
// using oid to track the index into the original data
export const loned = (sizes: BigUint64Array) => {
  const items: LayoutItem1D[] = []

  let start = 0n
  let pos = start

  for (let oid = 0; oid < sizes.length; oid++) {
    const size = sizes[oid]

    const item: Segment1D = {
      type: 'segment',
      oid,
      start: pos,
      next: pos + size,
      size
    }

    items.push(Object.freeze(item))

    pos += size
  }

  const layout: Layout1D = {
    type: 'layout',
    items: Object.freeze(items),
    start,
    next: pos,
    size: pos - start
  }

  return Object.freeze(layout)
}

export const relayout = (template: LayoutItem1D[]) =>
  // safe - forces recalculation for all items  
  dangerousLayout(template, 0)

// if used incorrectly, this will create a corrupt layout!
//
// takes items from potentially one or more other layouts as template examples 
// and creates a new layout, by default treating all of their positions as 
// invalid, but allowing faster relayouts when we know that the head of the
// layout is already valid
export const dangerousLayout = (
  template: LayoutItem1D[],

  // if the head of the layout is already a valid layout, then this is the
  // index of the first item in the template that could be invalid, and only
  // positions from here on need to be recalculated
  //
  // number instead of BigInt, because it's an index into a regular array
  // and having to cast a bigint position or size to pass to this should
  // hopefully make you pause for a moment
  firstUntrustedIndex: number
) => {
  const items: LayoutItem1D[] = []

  let start = 0n
  let pos = start

  const f = Math.max(0, firstUntrustedIndex)
  // Directly add the items that are known to be safe
  for (let i = 0; i < f; i++) {
    items.push(template[i])
    pos += template[i].size
  }

  // Do a full recalculation of the rest of the items
  for (let i = Number(firstUntrustedIndex); i < template.length; i++) {
    const temp = template[i]
    const { oid, size } = temp

    if (temp.type === 'slice') {
      const item: LayoutItem1D = {
        type: 'slice',
        oid,
        size,
        start: pos,
        next: pos + size,
        ostart: temp.ostart,
        osize: temp.osize,
        sliceStart: temp.sliceStart,
        sliceSize: temp.sliceSize
      }

      items.push(Object.freeze(item))
    } else {
      const item: Segment1D = {
        type: 'segment',
        oid,
        start: pos,
        next: pos + size,
        size: size
      }

      items.push(Object.freeze(item))
    }

    pos += size
  }

  const layout: Layout1D = {
    type: 'layout',
    items: Object.freeze(items),
    start,
    next: pos,
    size: pos - start
  }

  return Object.freeze(layout)
}
