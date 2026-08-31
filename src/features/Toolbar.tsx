/**
 * The toolbar.
 *
 * Dedicated, named buttons rather than a floating cluster of icons. Labels
 * carry meaning that icons only gesture at, and a fixed position is easier to
 * return to than something that moves as you read.
 *
 * It sits in the header and stays put. On narrow screens the labels remain —
 * they are the point — and the row scrolls horizontally if it must, which is
 * better than hiding them behind a glyph.
 */
import { BarChart3, Bookmark, Library as LibraryIcon, Settings2, Trophy } from 'lucide-react';
import type { ChoiceScriptApi, ChoiceScriptState } from '@/lib/choicescript';
import { Button } from '@/components/ui/button';

export function Toolbar({
  cs,
  state,
  onExit,
}: {
  cs: ChoiceScriptApi;
  state: ChoiceScriptState;
  onExit: () => void;
}) {
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
    { icon: LibraryIcon, label: 'Library', run: onExit },
  ];

  return (
    <nav
      aria-label="Game controls"
      className="-mx-1 flex flex-wrap gap-1 overflow-x-auto pb-1"
    >
      {actions.map(({ icon: Icon, label, run, badge }) => (
        <Button key={label} variant="ghost" size="sm" onClick={run} className="shrink-0 gap-1.5">
          <Icon className="size-4" aria-hidden="true" />
          {label}
          {badge && (
            <span className="ml-0.5 rounded-full bg-accent-wash px-1.5 py-px font-ui text-[11px] tabular-nums text-accent">
              {badge}
            </span>
          )}
        </Button>
      ))}
    </nav>
  );
}
