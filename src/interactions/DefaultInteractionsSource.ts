import { Stream, Subscription } from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import { InteractionsSourceInternal, InteractionEvent } from './types';

export class DefaultInteractionsSource implements InteractionsSourceInternal {
  _interaction$: Stream<InteractionEvent>;

  constructor(stream: Stream<InteractionEvent>) {
    this._interaction$ = adapt(stream);
  }

  // tslint:disable-next-line no-any
  public select<TEvent = any, TInteractionType extends string = string>(
    interactionSelector: TInteractionType
  ): Stream<TEvent> {
    return this._interaction$
      .filter(
        (i: InteractionEvent<TInteractionType>) =>
          i.type === interactionSelector
      )
      .map(interaction => interaction.value);
  }
}

export default DefaultInteractionsSource;
