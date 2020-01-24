import { Stream } from "xstream";
export declare type InteractFn = (interactionType: string, predefinedValue?: any) => (value?: any) => void;
export declare type InteractionsProp<TInteractionEvents> = {
    [P in keyof TInteractionEvents]: (eventValue?: TInteractionEvents[P]) => void;
};
export declare type InteractionsProps<TInteractionEvents = any> = {
    interact: InteractFn;
    interactions: InteractionsProp<TInteractionEvents>;
};
export interface InteractionEvent<TType = any, TValue = any> {
    type: TType;
    value?: TValue;
}
export declare type InteractionsSink<TProps, TOverrides = {}> = Stream<Partial<{
    [P in keyof TProps]: Stream<any>;
}> & TOverrides>;
export declare type InteractionsSource<TEvent = any> = {
    select<TEvent = any, TInteractionType extends string = string>(interactionSelector: string): Stream<TEvent>;
} & {
    [P in keyof TEvent]: Stream<TEvent[P]>;
};
export declare type InteractionsSourceInternal = any;
