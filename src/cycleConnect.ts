import React, {
  SFC,
  PureComponent,
  ComponentClass,
  ComponentType,
  ErrorInfo,
  ReactNode
} from "react";
import xs, { Stream, MemoryStream, Subscription } from "xstream";
import { Sources, Sinks, DisposeFunction, Drivers, Main } from "@cycle/run";
import isolate from "@cycle/isolate";
import { makeCycleNode } from "./core/makeCycleNode";
import { makeReactPropsWrapper } from "./wrappers/reactPropsWrapper";
import {
  makeReactLifecycleWrapper,
  ReactLifecycleStreams
} from "./wrappers/reactLifecycleWrapper";
import {
  makeInteractionsWrapper,
  InteractFn,
  InteractionsProp,
  makeInteractionsProp,
  InteractionsProps
} from "./interactions";
import {
  StatelessSinkProxies,
  CycleConnectOptions,
  CycleMainFn,
  CycleMainFnWrapper,
  CycleNode,
  MakeConnectedComponentFn,
  IsolateOption,
  CycleConnectContextType,
  ShouldUpdateFunction
} from "./types";

const CONTEXT_TYPES = {
  cycleNodeLink: () => null
};

function noopMainFn(sources: Sources<Drivers>): Sinks<Main> {
  return {};
}

function defaultRenderFn(props: { children?: ReactNode }) {
  return props.children || null;
}

// TODO: Reconsider typing (perhaps, once conditional types land in TypeScript)
export function cycleConnect<
  TProps = {},
  TViewProps = {},
  TSinkProps = {},
  TInteractionEvents = {}
>(
  mainFn: CycleMainFn<TProps | Partial<TViewProps>, TSinkProps>,
  options?: CycleConnectOptions
): MakeConnectedComponentFn<TProps, InteractionsProps>;

export function cycleConnect<TProps = {}>(
  options: CycleConnectOptions
): MakeConnectedComponentFn<TProps, InteractionsProps>;

export function cycleConnect<
  TProps = {},
  TViewProps = {},
  TSinkProps = {},
  TInteractionEvents = {}
>(
  mainFn:
    | CycleMainFn<TProps | Partial<TViewProps>, TSinkProps>
    | CycleConnectOptions,
  options: CycleConnectOptions = {}
): MakeConnectedComponentFn<TProps, InteractionsProps<TInteractionEvents>> {
  let _mainFn: CycleMainFn;

  if (typeof mainFn === "object") {
    options = mainFn as CycleConnectOptions;
    _mainFn = noopMainFn as CycleMainFn;
  }

  if (typeof mainFn === "function") {
    _mainFn = mainFn;
  }

  return function makeComponent<TOuterProps, TInnerProps>(
    WrappedComponent?: ComponentType<TInnerProps>
  ) {
    const sourceComponentName =
      (options.render && "customRenderFn") ||
      (WrappedComponent &&
        (WrappedComponent.displayName ||
          WrappedComponent.name ||
          "AnonymousComponent")) ||
      "defaultRenderFn";

    const displayName =
      options.displayName || `cycleConnect(${sourceComponentName})`;

    const shouldUpdateFn = options.shouldUpdate || (x => true);

    return class CycleConnectContainer extends PureComponent<TOuterProps> {
      static contextTypes = CONTEXT_TYPES;
      static childContextTypes = CONTEXT_TYPES;
      static displayName = displayName;

      cycleNode: CycleNode;
      disposeCycleNode: DisposeFunction;

      lifecycleStreams: ReactLifecycleStreams<TOuterProps>;

      inputProps$: MemoryStream<TInnerProps>;
      props$: MemoryStream<TInnerProps>;
      props$Subscription: Subscription;
      propsSnapshot: TInnerProps;

      interactFn: InteractFn;
      interactionsProp: InteractionsProp<TInteractionEvents>;

      constructor(
        props: TOuterProps & TInnerProps,
        context: CycleConnectContextType
      ) {
        super(props, context);

        const { cycleNodeLink } = context;
        const sources = (cycleNodeLink && cycleNodeLink.sources) || {};
        const sinkProxies = (cycleNodeLink && cycleNodeLink.sinkProxies) || {};

        // Configuring internal wrappers
        // React component lifecycle
        const {
          lifecycleWrapper,
          lifecycleStreams
        } = makeReactLifecycleWrapper<TOuterProps>();
        this.lifecycleStreams = lifecycleStreams;

        // React props
        this.inputProps$ = xs.createWithMemory<TInnerProps>().startWith(props);
        const { propsWrapper, props$ } = makeReactPropsWrapper(
          this.inputProps$,
          this.lifecycleStreams.willUnmount$
        );
        this.props$ = props$;

        // Interactions
        const { interactionsWrapper, interactFn } = makeInteractionsWrapper();
        this.interactFn = interactFn;
        this.interactionsProp = makeInteractionsProp(interactFn);

        const _options = {
          ...options,
          _innerWrappers: [interactionsWrapper, propsWrapper, lifecycleWrapper]
        };

        this.cycleNode = makeCycleNode(
          _mainFn,
          _options,
          sources,
          sinkProxies,
          props,
          displayName
        );

        this.disposeCycleNode = this.cycleNode.run();
      }

      getChildContext(): CycleConnectContextType {
        const cn = this.cycleNode;
        if (!cn) {
          return {};
        }

        return {
          cycleNodeLink: {
            sources: cn.childSources,
            sinkProxies: cn.sinkProxies
          }
        };
      }

      // componentWillMount() {
      //   this.subscribeToPropsUpdates();
      //   this.lifecycleStreams.willMount$._n(null);
      // }

      componentDidMount() {
        //   this.lifecycleStreams.willMount$._n(null);
        this.subscribeToPropsUpdates(shouldUpdateFn);
        this.lifecycleStreams.didMount$._n(null);
      }

      // componentWillReceiveProps(nextProps: Readonly<TOuterProps>) {
      //   this.lifecycleStreams.willReceiveProps$._n(nextProps);
      // }

      // NOTE: Not passing `nextState` intentionally, keep the state
      // inside the "connected" Cycle program instead.
      // componentWillUpdate(nextProps: Readonly<TOuterProps>) {
      //   this.lifecycleStreams.willUpdate$._n(nextProps);
      // }

      componentDidUpdate(prevProps: Readonly<TOuterProps>) {
        this.lifecycleStreams.didUpdate$._n(prevProps);
      }

      componentWillUnmount() {
        this.lifecycleStreams.willUnmount$._n(null);

        if (this.disposeCycleNode) {
          this.disposeCycleNode();
        }
      }

      componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.lifecycleStreams.didCatch$._n({ error, errorInfo });
      }

      subscribeToPropsUpdates(shouldUpdateFn: ShouldUpdateFunction) {
        this.props$.endWhen(this.lifecycleStreams.willUnmount$).addListener({
          next: (props: TInnerProps) => {
            const update = shouldUpdateFn(this.propsSnapshot, props);
            this.propsSnapshot = props;
            update && this.forceUpdate();
          }
        });
      }

      render() {
        const props = {
          ...(this.propsSnapshot as any),
          interact: this.interactFn,
          interactions: this.interactionsProp
        };

        if (typeof options.render === "function") {
          return options.render(props);
        }

        return WrappedComponent
          ? React.createElement(WrappedComponent, props)
          : defaultRenderFn(props);
      }
    };
  };
}
