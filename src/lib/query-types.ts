import { LayoutItem1D } from '../types'

export type QueryResultBefore = {
  type: 'before'
  before: bigint
}

export type QueryResultAfter = {
  type: 'after'
  after: bigint
}

export type QueryResultInside = {
  type: 'inside'
  index: number // index of the item in the layout
  child: LayoutItem1D // the item itself
  rel: bigint // position in child relative to child start
}

export type QueryResultHead = {
  type: 'head'
  next: QueryResultInside
}

export type QueryResultTail = {
  type: 'tail'
  prev: QueryResultInside
}

export type QueryResultBoundary = {
  type: 'boundary'
  prev: QueryResultInside
  next: QueryResultInside
}

export type QueryResult = (
  QueryResultBefore | QueryResultAfter | QueryResultInside | QueryResultHead |
  QueryResultTail | QueryResultBoundary
)
