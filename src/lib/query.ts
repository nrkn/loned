import { LayoutItem1D, Layout1D } from '../types'

import {
  QueryResultBefore, QueryResultAfter, QueryResultInside, QueryResultHead,
  QueryResultTail, QueryResultBoundary, QueryResult
} from './query-types'

const beforeHelper = (before: bigint): QueryResultBefore =>
  ({ type: 'before', before })

const afterHelper = (after: bigint): QueryResultAfter =>
  ({ type: 'after', after })

const insideHelper = (
  index: number, child: LayoutItem1D, rel: bigint
): QueryResultInside =>
  ({ type: 'inside', index, child, rel })

const headHelper = (next: QueryResultInside): QueryResultHead =>
  ({ type: 'head', next })

const tailHelper = (prev: QueryResultInside): QueryResultTail =>
  ({ type: 'tail', prev })

const boundaryHelper = (
  prev: QueryResultInside, next: QueryResultInside
): QueryResultBoundary =>
  ({ type: 'boundary', prev, next })

export const queryLayout = (layout: Layout1D, pos: bigint): QueryResult => {
  // there's nothing in the layout, treat it as though it would go at 0
  if( layout.size <= 0n ) return beforeHelper(0n)

  // there is no segment - the pos was 'before' the layout
  if (pos < layout.start) return beforeHelper(layout.start - pos)

  // there is no segment - the pos was 'after' the layout
  if (pos > layout.next) return afterHelper(pos - layout.next)

  if (pos === layout.next) return tailHelper(
    insideHelper(
      layout.items.length - 1,
      layout.items[layout.items.length - 1],
      layout.items[layout.items.length - 1].size
    )
  )

  if (pos === layout.start) return headHelper(
    insideHelper(0, layout.items[0], 0n)
  )

  for (let i = 0; i < layout.items.length; i++) {
    const item = layout.items[i]

    const isHandled = item.type === 'segment' || item.type === 'slice'

    if (!isHandled) throw Error('Unhandled case @ ' + pos)

    if (pos >= item.start && pos < item.next) {
      // Check if pos is at the boundary
      if (pos === item.start) {
        const prev = layout.items[i - 1]

        return boundaryHelper(
          insideHelper(i - 1, prev, prev.size),
          insideHelper(i, item, 0n)
        )
      } else if (pos === item.next) {
        return boundaryHelper(
          insideHelper(i, item, item.size),
          insideHelper(i + 1, layout.items[i + 1], 0n)
        )
      }

      return insideHelper(i, item, pos - item.start)
    }
  }

  throw Error('Unhandled case @ ' + pos)
}
