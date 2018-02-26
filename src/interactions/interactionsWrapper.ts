import xs, { Stream, Subscription } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';
import { adapt } from '@cycle/run/lib/adapt';
import { Sources, Sinks } from '@cycle/run';
import { CycleMainFn } from '../types';
import { DefaultInteractionsSource } from './DefaultInteractionsSource';
import {
  InteractionsSourceInternal,
  InteractionEvent,
  InteractFn
} from './types';
import { makeInteractFn } from './makeInteractFn';
import { ReactPropsSource } from '../index';

export function makeInteractionsWrapper() {
  const name = 'interactions';
  const fnCallEffectDriverKey = 'fnCallEffect'; // TODO: Make configurable

  const interaction$ = xs.create<InteractionEvent>();
  const interactFn = makeInteractFn(interaction$);

  function interactionsWrapper(mainFn: CycleMainFn): CycleMainFn {
    return function mainWithInteractions(sources: Sources): Sinks {
      const interactionsSource = new DefaultInteractionsSource(interaction$);
      const interactionsSourceProxyHandler = {
        // tslint:disable-next-line no-any
        get(target: any, attr: string) {
          if (typeof target[attr] === 'undefined') {
            return (target as InteractionsSourceInternal).select(attr);
          }
          return target[attr];
        }
      };

      sources[name] = new Proxy(
        interactionsSource,
        interactionsSourceProxyHandler
      );
      const sinks = mainFn(sources);
      const upstreamInteractions$ = sinks[name] as Stream<{
        // tslint:disable-next-line no-any
        [propName: string]: Stream<any>;
      }>;

      // TODO: The current experimental/hacky code should be removed, though
      const propsSource = sources.props as ReactPropsSource<any>;
      if (upstreamInteractions$ && propsSource) {
        const props$ = propsSource.props$;
        const upstreamInteractionFnCall$ = upstreamInteractions$
          .compose(sampleCombine(props$))
          .map(([upstreamInteractions, props]) => {
            const fnCallStreams = Object.keys(upstreamInteractions)
              .filter(propName => typeof props[propName] === 'function')
              .map(propName => {
                return upstreamInteractions[
                  propName
                ].map(propInteractionValue => ({
                  fn: props[propName],
                  args: [propInteractionValue]
                }));
              });

            return xs.merge.apply(null, fnCallStreams);
          })
          .flatten();

        // TODO: We're mutating the sinks here, find out how to implement this
        // in a more safe and elegant way
        sinks[fnCallEffectDriverKey] = sinks[fnCallEffectDriverKey]
          ? xs.merge(sinks[fnCallEffectDriverKey], upstreamInteractionFnCall$)
          : upstreamInteractionFnCall$;
      }

      return sinks;
    };
  }

  return {
    interactionsWrapper,
    interactFn
  };
}
