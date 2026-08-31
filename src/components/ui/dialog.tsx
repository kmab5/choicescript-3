/* shadcn/ui Dialog. Renders as a bottom sheet on phones, because the controls
   belong in the thumb zone when someone is reading one-handed. */
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-30 bg-black/45 backdrop-blur-sm animate-fade-in', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-40 border border-rule bg-paper text-ink shadow-xl',
        'inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl p-5',
        'pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-sheet-up',
        'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-[60ch]',
        'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-cs sm:pb-5',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-rule sm:hidden" />
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className="absolute right-4 top-4 rounded-cs text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="size-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 border-b border-rule pb-3 pr-8', className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-ui text-[1.0625rem] font-semibold tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle };
