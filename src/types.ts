import { Stream } from 'xstream';
import {
  Drivers,
  Driver,
  DisposeFunction,
  Sources,
  Sinks,
  SinkProxies
} from '@cycle/run';
import {
  ReactNode,
  ComponentClass,
  SFC,
  ReactElement,
  ComponentType
} from 'react';
import { InteractionsProps } from './interactions/index';
import { ReactPropsSource } from './wrappers/reactPropsWrapper';

// React-related

export interface CycleConnectContextType {
  cycleNodeLink?: CycleNodeLink;
}

// Cycle-connect related

export type StatelessSinkProxies<Si extends Sinks> = {
  [P in keyof Si]: Stream<any>
};

export type ConnectedSources<TSourceProps> = Sources & {
  props: ReactPropsSource<TSourceProps>;
};

export type ConnectedSinks<TSinkProps> = Sinks & {
  props: Stream<TSinkProps>;
} & {
    interactions: Stream<TSinkProps>;
  };

export type CycleMainFn<TSourceProps = {}, TSinkProps = {}> = (
  sources: ConnectedSources<TSourceProps> | Sources
) => ConnectedSinks<TSinkProps> | Sinks;

export type CycleMainFnWrapper = (mainFn: CycleMainFn) => CycleMainFn;

export type CycleRunFunction = (
  main: CycleMainFn,
  drivers: Drivers<Sources, Sinks>
) => DisposeFunction;

export type IsolateOptionStatic =
  | {
      [sourceName: string]: any;
    }
  | string
  | boolean;
export type IsolateOptionFn<TProps = any> = (
  props: TProps
) => IsolateOptionStatic;
export type IsolateOption = IsolateOptionStatic | IsolateOptionFn;

export type RenderOption = (props: any) => ReactNode;

export type CycleConnectOptions = {
  root?: boolean;
  runFn?: CycleRunFunction;
  isolate?: IsolateOption;
  render?: RenderOption;
  drivers?: Drivers<Sources, Sinks>;
  wrappers?: CycleMainFnWrapper[];
  _innerWrappers?: CycleMainFnWrapper[];
  displayName?: string;
};

export type CycleNode = {
  childSources: Sources;
  sinkProxies: SinkProxies<Sinks>;
  run: () => DisposeFunction;
};

export type CycleNodeLink = {
  sources: any;
  sinkProxies: SinkProxies<Sinks>;
};

export interface CycleConnectOptionsProps {
  isolate?: IsolateOption;
}

export interface CycleConnectViewProps<TInteractionEvents>
  extends InteractionsProps<TInteractionEvents> {}

export interface CycleConnectedProps<TInteractionEvents>
  extends CycleConnectOptionsProps,
    CycleConnectViewProps<TInteractionEvents> {}

export interface MakeConnectedComponentFn<TOuterProps, TExcludeProps> {
  <P extends TExcludeProps>(
    WrappedComponent?: ComponentType<P>
  ): ComponentClass<TOuterProps>;
}
