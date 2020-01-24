import xs, { Stream, MemoryStream, Subscription } from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { Sources, Sinks, Drivers, Main } from "@cycle/run";
import { adapt } from "@cycle/run/lib/adapt";
import { CycleMainFn } from "../types";

export class ReactPropsSource<TProps> {
  public props$: MemoryStream<TProps>;
  private _props$: MemoryStream<TProps>;

  constructor(stream: Stream<TProps>) {
    this._props$ = stream.compose(dropRepeats()).remember();
    this.props$ = adapt(this._props$);
  }

  public pluck<P extends keyof TProps>(
    propName: P
  ): Stream<TProps[P] | undefined> {
    return this._props$
      .map(props => (props && props[propName]) || void 0)
      .compose(dropRepeats())
      .remember();
  }

  public select<P extends keyof TProps>(
    propSelector: P
  ): ReactPropsSource<TProps[P] | undefined> {
    return new ReactPropsSource<TProps[P] | undefined>(
      this.pluck(propSelector)
    );
  }
}

export function makeReactPropsWrapper<TProps extends {}>(
  inputProps$: Stream<TProps>,
  willUnmount$: Stream<null>
): {
  propsWrapper: (main: CycleMainFn) => CycleMainFn;
  props$: MemoryStream<TProps>;
} {
  const name = "props";
  const props$ = xs.createWithMemory<TProps>().endWhen(willUnmount$);

  function reactPropsWrapper(mainFn: CycleMainFn): CycleMainFn {
    return function mainWithReactProps(sources: Sources<Drivers>): Sinks<Main> {
      const sinkPropsImitator$ = xs.create<TProps>();
      const combinedProps$ = xs
        .merge(inputProps$, sinkPropsImitator$)
        .fold<TProps>(
          (combinedProps: TProps, newProps: TProps) => ({
            ...(combinedProps as any),
            ...(newProps as any)
          }),
          void 0 as any | undefined
        )
        .drop(1) // Dropping the initial `void 0`
        .remember()
        .endWhen(willUnmount$);

      const _sources = {
        ...sources,
        [name]: new ReactPropsSource(combinedProps$) as any
      };
      const sinks = mainFn(_sources);
      const propsSink = sinks[name];
      delete sinks[name];

      // Subscribe to combined props immediately to collect those in program's
      // `propsSource` so that the first subscriber immediately gets its
      // latest value.
      combinedProps$.addListener({
        next: (value: any) => props$._n(value)
      });

      if (propsSink) {
        const sinkProps$ = xs.fromObservable(propsSink);

        // TODO: Imitate with .imitate() once the way to convert
        // `MemoryStream` to `Stream` is found
        // sinkPropsImitator$.imitate(sinkProps$);
        sinkProps$.endWhen(willUnmount$).addListener({
          next: (value: any) => sinkPropsImitator$._n(value),
          complete: () => sinkPropsImitator$._c(),
          error: (error: any) => sinkPropsImitator$._e(error)
        });
      }

      return sinks;
    };
  }

  return {
    propsWrapper: reactPropsWrapper,
    props$
  };
}
