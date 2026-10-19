import type { StepStatus } from '../models/Employee';

export type LineColor = 'gray' | 'red';

export interface IStepLinks {
  // line towards the previous step / towards the next step
  left?: LineColor;
  right?: LineColor;
}

// Steps are connected up to and including the first "not started" step.
// A link turns red once a delayed step appeared before it.
export function getStepLinks(steps: StepStatus[]): IStepLinks[] {
  const firstNotStarted = steps.indexOf('notStarted');
  const lastLinked = firstNotStarted === -1 ? steps.length - 1 : firstNotStarted;

  const linkColors: LineColor[] = [];
  let seenDelayed = false;
  for (let i = 0; i < lastLinked; i++) {
    seenDelayed = seenDelayed || steps[i] === 'delayed';
    linkColors.push(seenDelayed ? 'red' : 'gray');
  }

  return steps.map((_, i) => ({
    left: i > 0 && i <= lastLinked ? linkColors[i - 1] : undefined,
    right: i < lastLinked ? linkColors[i] : undefined
  }));
}
