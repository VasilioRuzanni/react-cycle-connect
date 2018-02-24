import { Stream } from 'xstream';
import { InteractFn, InteractionEvent } from './types';

// tslint:disable no-any
export function makeInteractFn(
  interaction$: Stream<InteractionEvent>
): InteractFn {
  return function interactFn(interactionType: string, predefinedValue?: any) {
    return (value: any) => {
      interaction$._n({
        type: interactionType,
        value: typeof predefinedValue !== 'undefined' ? predefinedValue : value
      });
    };
  };
}
