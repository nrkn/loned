import { Layout1D, LayoutItem1D } from '../types'
import { templatedLayout } from './layout'
import { splitLayoutAt } from './split'

export const insertItem = (
  layout: Layout1D, oid: number, size: bigint, pos: bigint
) => {
  if (size < 0) throw Error('insertItem: size < 0')

  const res = splitLayoutAt(layout, pos)

  // Create new item to be inserted
  const newItem: LayoutItem1D = {
    type: 'segment',
    oid,
    size,
    start: pos,
    next: pos + size
  }

  // valid until newItem
  return templatedLayout(
    [...res.head, newItem, ...res.tail], BigInt(res.head.length)
  )
}

export const appendItem = (
  layout: Layout1D, oid: number, size: bigint
) =>
  insertItem(layout, oid, size, layout.size)

export const prependItem = (
  layout: Layout1D, oid: number, size: bigint
) =>
  insertItem(layout, oid, size, 0n)

export const overwrite = (
  layout: Layout1D, oid: number, size: bigint, pos: bigint
) => {
  if (size < 0) throw Error('overwrite: size < 0')
  if (pos < 0) throw Error('overwrite: pos < 0')

  const end = pos + size

  if (end > layout.size) throw Error('overwrite: end > layout.size')

  // Create new item to be inserted
  const newItem: LayoutItem1D = {
    type: 'segment',
    oid,
    size,
    start: pos,
    next: pos + size
  }

  const beforeStart = takeStart(layout, pos)
  const afterEnd = takeEnd(layout, layout.size - end)

  // valid until pos
  return templatedLayout(
    [...beforeStart.items, newItem, ...afterEnd.items]
    //, beforeStart.size
  )
}

export const takeStart = (
  layout: Layout1D, size: bigint
) => {
  if (size < 0) throw Error('takeStart: size < 0')
  if (size > layout.size) throw Error('takeStart: size > layout.size')

  const res = splitLayoutAt(layout, size)

  return templatedLayout(res.head, BigInt( res.head.length ) ) // the whole thing is valid  
}

export const removeEnd = takeStart

export const takeEnd = (
  layout: Layout1D, size: bigint
) => {
  if (size < 0) throw Error('takeEnd: size < 0')
  if (size > layout.size) throw Error('takeEnd: size > layout.size')

  const res = splitLayoutAt(layout, layout.size - size)

  return templatedLayout(res.tail) // all invalid
}

export const removeStart = takeEnd

export const takeSlice = (
  layout: Layout1D, start: bigint, size: bigint
) => {
  if (start < 0) throw Error('takeSlice: start < 0')
  if (size < 0) throw Error('takeSlice: size < 0')

  const end = start + size

  if (end > layout.size) throw Error('takeSlice: end > layout.size')

  const afterStart = takeEnd(layout, layout.size - start)

  return takeStart(afterStart, size) // validity handled by takeEnd/takeStart
}

export const removeSlice = (
  layout: Layout1D, start: bigint, size: bigint
) => {
  if (start < 0) throw Error('removeSlice: start < 0')
  if (size < 0) throw Error('removeSlice: size < 0')

  const end = start + size

  if (end > layout.size) throw Error('removeSlice: end > layout.size')

  const beforeStart = takeStart(layout, start )
  const afterEnd = takeEnd(layout, layout.size - end)

  return templatedLayout(
    [...beforeStart.items, ...afterEnd.items]
  )
}
