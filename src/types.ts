import {
  Drivers,
  Driver,
  DisposeFunction,
  Sources,
  Sinks,
  SinkProxies
} from '@cycle/run';
import { Stream } from 'xstream';
import {
  ReactNode,
  ComponentClass,
  SFC,
  ReactElement,
  ComponentType
} from 'react';
import { InteractionsProps } from './interactions/index';
import { ReactPropsSource } from './wrappers/reactPropsWrapper';

// Low-level type helpers.
// Borrowed from here:
// https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766

export type Diff<T extends string, U extends string> = ({ [P in T]: P } &
  { [P in U]: never } & { [x: string]: never })[T];

export type Omit<T extends { [name: string]: any }, K extends keyof T> = Pick<
  T,
  Diff<keyof T, K>
>;

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
  // ): ComponentClass<Omit<P, keyof TExcludeProps> & TProps>;
}
