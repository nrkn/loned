export type Segment1D = {
  type: 'segment'

  oid: number // the original index into the sizes array

  // position of the segment in the layout
  start: bigint
  next: bigint // this is the exclusive end/start of next segment
  size: bigint
}


export type Slice1D = {
  type: 'slice'

  // info about where we came from
  // note, if we slice a slice, these don't change, we just update the sliceStart and sliceSize
  // and start, next, size
  oid: number
  ostart: bigint
  osize: bigint

  // how to slice from original 
  sliceStart: bigint
  sliceSize: bigint

  // position of the slice in the layout
  start: bigint
  next: bigint
  size: bigint
}

// extension point for all LayoutItem1D types
export type LayoutItem1D = Segment1D | Slice1D

export type Layout1D = {
  type: 'layout'
  items: Readonly<LayoutItem1D[]>
  start: bigint
  next: bigint
  size: bigint
}
