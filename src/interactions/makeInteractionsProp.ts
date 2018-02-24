import { InteractFn, InteractionsProp } from './types';

// tslint:disable no-any
export function makeInteractionsProp<TInteractionEvents = {}>(
  interactFn: InteractFn
): InteractionsProp<TInteractionEvents> {
  const interactionsPropProxyHandler = {
    get(target: any, interactionEventName: string) {
      return interactFn.call(null, interactionEventName);
    }
  };

  return new Proxy({}, interactionsPropProxyHandler);
}
