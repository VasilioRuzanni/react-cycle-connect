import { Stream } from "xstream";
import { InteractionsSourceInternal, InteractionEvent } from "./types";
export declare class DefaultInteractionsSource implements InteractionsSourceInternal {
    _interaction$: Stream<InteractionEvent>;
    constructor(stream: Stream<InteractionEvent>);
    select<TEvent = any, TInteractionType extends string = string>(interactionSelector: TInteractionType): Stream<TEvent>;
}
export default DefaultInteractionsSource;
