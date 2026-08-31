/**
 * The HUD.
 *
 * PRODUCT.md calls for a split register: the reading surface recedes, the
 * chrome has presence. It also says mobile short sessions are the default
 * case, not the responsive afterthought.
 *
 * So navigation is not a toolbar pinned to the top of the page, a hand's
 * length from the thumb. It is a floating bar in the thumb zone that retreats
 * while you read and returns the moment you stop — present when wanted,
 * invisible while the prose has the floor.
 *
 * On desktop, where reach costs nothing, it settles into the header instead.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { BarChart3, Bookmark, Menu, Trophy, Settings2 } from 'lucide-react';
import type { ChoiceScriptApi, ChoiceScriptState } from '@/lib/choicescript';
import { cn } from '@/lib/utils';

interface HudProps {
  cs: ChoiceScriptApi;
  state: ChoiceScriptState;
  onExit: () => void;
}

const REVEAL_DELAY = 900;

export function Hud({ cs, state }: HudProps) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const idle = useRef<number | undefined>(undefined);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    // hide while reading downward, return immediately on any upward intent
    if (y > previous && y > 120) setHidden(true);
    else setHidden(false);

    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setHidden(false), REVEAL_DELAY);
  });

  useEffect(() => () => window.clearTimeout(idle.current), []);

  const earned = state.achievements?.earned.length ?? 0;
  const total = state.achievements?.total ?? 0;

  const actions = [
    { icon: BarChart3, label: 'Stats', run: () => cs.openStats() },
    { icon: Bookmark, label: 'Saves', run: () => cs.openSaves() },
    {
      icon: Trophy,
      label: 'Achievements',
      run: () => cs.openAchievements(),
      badge: total > 0 ? `${earned}/${total}` : undefined,
    },
    { icon: Settings2, label: 'Settings', run: () => cs.openSettings() },
    { icon: Menu, label: 'Menu', run: () => cs.openMenu() },
  ];

  return (
    <motion.nav
      aria-label="Game controls"
      initial={false}
      animate={{ y: hidden ? 96 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 flex justify-center',
        'pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3',
        'pointer-events-none',
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-1 rounded-full border border-rule',
          'bg-raised/85 px-2 py-1.5 shadow-lg backdrop-blur-md',
          'supports-[backdrop-filter]:bg-raised/70',
        )}
      >
        {actions.map(({ icon: Icon, label, run, badge }) => (
          <button
            key={label}
            onClick={run}
            aria-label={label}
            className={cn(
              'group relative grid size-touch place-items-center rounded-full',
              'text-ink-muted transition-colors hover:text-accent',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {badge && (
              <span className="absolute -top-0.5 right-0.5 rounded-full bg-accent px-1.5 py-px font-ui text-[10px] font-medium tabular-nums text-accent-fg">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
