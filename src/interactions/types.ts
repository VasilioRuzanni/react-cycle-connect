import { Stream } from 'xstream';

export type InteractFn = (
  interactionType: string,
  predefinedValue?: any
) => (value?: any) => void;

export type InteractionsProp<TInteractionEvents> = {
  [P in keyof TInteractionEvents]: (eventValue?: TInteractionEvents[P]) => void
};

export type InteractionsProps<TInteractionEvents = any> = {
  interact: InteractFn;
  interactions: InteractionsProp<TInteractionEvents>;
};

export interface InteractionEvent<TType = any, TValue = any> {
  type: TType;
  value?: TValue;
}

// TODO: Extend it to preserve the original event types somehow
export type InteractionsSink<TProps, TOverrides = {}> = Stream<
  Partial<{ [P in keyof TProps]: Stream<any> }> & TOverrides
>;

export type InteractionsSource<TEvent = any> = {
  select<TEvent = any, TInteractionType extends string = string>(
    interactionSelector: string
  ): Stream<TEvent>;
} & { [P in keyof TEvent]: Stream<TEvent[P]> };
