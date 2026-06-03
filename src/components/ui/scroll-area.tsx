'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>;

type ScrollBarProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>;

type ScrollThumbProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Thumb>;

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root ref={ref} className={cn('overflow-hidden rounded-3xl', className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-3xl">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex touch-none select-none p-0.5 transition-colors duration-150 ease-out hover:bg-muted/80">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-muted" />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>, ScrollBarProps>(
  ({ className, ...props }, ref) => (
    <ScrollAreaPrimitive.Scrollbar ref={ref} className={cn('flex touch-none select-none p-0.5 transition-colors duration-150 ease-out hover:bg-muted/80', className)} {...props} />
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

const ScrollThumb = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Thumb>, ScrollThumbProps>(
  ({ className, ...props }, ref) => (
    <ScrollAreaPrimitive.Thumb ref={ref} className={cn('relative flex-1 rounded-full bg-border', className)} {...props} />
  )
);
ScrollThumb.displayName = ScrollAreaPrimitive.Thumb.displayName;

export { ScrollArea, ScrollBar, ScrollThumb };
