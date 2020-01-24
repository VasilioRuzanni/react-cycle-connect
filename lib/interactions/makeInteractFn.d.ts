import { Stream } from 'xstream';
import { InteractFn, InteractionEvent } from './types';
export declare function makeInteractFn(interaction$: Stream<InteractionEvent>): InteractFn;
