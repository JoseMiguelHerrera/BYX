'use client'
import { cn } from '@/utils/classnames';
import React from 'react'
import GridLayout from 'react-grid-layout';

const layout: GridLayout.Layout[] = [
  // { i: "a", x: 0, y: 0, w: 1, h: 2, static: true },
  // { i: "b", x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
  // { i: "c", x: 4, y: 0, w: 1, h: 2 }
];

const classes = cn('bg-red-500')
function MarketComponents() {
  return (
    <GridLayout
        className="layout"
        autoSize
        layout={layout}
        cols={5}
        rowHeight={30}
        width={1200}
      >
        <div key="a" className={classes}>a</div>
        <div key="b" className={classes}>b</div>
        <div key="c" className={classes}>c</div>
      </GridLayout>
  )
}

export default MarketComponents;