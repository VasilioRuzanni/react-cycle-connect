import { Stream } from 'xstream';

export type InteractFn = (
  interactionType: string,
  predefinedValue?: any
) => (value?: any) => void;

// TODO: Either back to it or remove
// export type InteractionsProp<TInteractionEvents> = {
//   [P in keyof TInteractionEvents]: (
//     predefinedValue?: TInteractionEvents[P]
//   ) => (eventValue?: TInteractionEvents[P]) => void
// };

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

// export interface InteractionsSink<
//   T = {
//     [propName: string]: Stream<any>;
//   }
// > extends Stream<T> {}

// TODO: Extend it to preserve the event types somehow, or make
// easily overridable with explicitly passed type (i.e., as a
// second generic param)
export type InteractionsSink<TProps, TOverrides = {}> = Stream<
  Partial<{ [P in keyof TProps]: Stream<any> }> & TOverrides
>;

export interface InteractionsSourceInternal {
  select<TEvent = any, TInteractionType extends string = string>(
    interactionSelector: string
  ): Stream<TEvent>;
}

export type DynamicInteractionStreams<TEvent> = {
  [P in keyof TEvent]: Stream<TEvent[P]>
};

export type InteractionsSource<T = any> = InteractionsSourceInternal &
  DynamicInteractionStreams<T>;
