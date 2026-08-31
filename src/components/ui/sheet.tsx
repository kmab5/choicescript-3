/**
 * Sheet — a drag-to-dismiss bottom sheet on phones, a centred dialog above.
 *
 * Built on vaul, which gives real drag physics rather than a modal that
 * happens to be anchored low. Mobile short sessions are the default case here,
 * so the sheet is the primary form and the desktop dialog is the adaptation.
 *
 * vaul is Radix Dialog underneath, so focus trapping, Escape and aria-modal
 * come along unchanged.
 */
import * as React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 flex max-h-[88vh] flex-col',
            'rounded-t-2xl border border-rule bg-paper text-ink shadow-2xl outline-none',
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-[60ch]',
            'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-cs',
          )}
        >
          {/* grab handle: the affordance that says this sheet moves */}
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-rule sm:hidden"
          />
          <header className="flex shrink-0 items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
            <Drawer.Title className="font-ui text-[1.0625rem] font-semibold tracking-tight">
              {title}
            </Drawer.Title>
            <Drawer.Close
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-5" />
            </Drawer.Close>
          </header>
          <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
