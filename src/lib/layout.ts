import { LayoutItem1D, Segment1D, Layout1D } from '../types'

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

export const templatedLayout = (
  template: LayoutItem1D[], lastSafeIndex = 0n
) => {
  const items: LayoutItem1D[] = []

  let start = 0n  
  let pos = start

  // Directly add the items that are known to be safe
  for (let i = 0; i < lastSafeIndex; i++) {
    items.push(template[i])
    pos += template[i].size
  }

  // Continue as before for the remaining items
  for (let i = Number(lastSafeIndex); i < template.length; i++) {
    const temp = template[i]
    const { oid, size } = temp

    if( temp.type === 'slice' ) {
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
