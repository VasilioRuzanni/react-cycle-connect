import { Stream } from "xstream";
import { Drivers, DisposeFunction, Sources, Sinks, SinkProxies, Main } from "@cycle/run";
import { ReactNode, ComponentClass, ComponentType } from "react";
import { InteractionsProps } from "./interactions/index";
import { ReactPropsSource } from "./wrappers/reactPropsWrapper";
export interface CycleConnectContextType {
    cycleNodeLink?: CycleNodeLink;
}
export declare type StatelessSinkProxies<Si extends Sinks<Main>> = {
    [P in keyof Si]: Stream<any>;
};
export declare type ConnectedSources<TSourceProps> = Sources<Drivers> & {
    props: ReactPropsSource<TSourceProps>;
};
export declare type ConnectedSinks<TSinkProps> = Sinks<Main> & {
    props: Stream<TSinkProps>;
} & {
    interactions: Stream<TSinkProps>;
};
export declare type CycleMainFn<TSourceProps = {}, TSinkProps = {}> = (sources: ConnectedSources<TSourceProps> | Sources<Drivers>) => ConnectedSinks<TSinkProps> | Sinks<Main>;
export declare type CycleMainFnWrapper = (mainFn: Main) => Main;
export declare type CycleRunFunction = (main: Main, drivers: Drivers) => DisposeFunction;
export declare type IsolateOptionStatic = {
    [sourceName: string]: any;
} | string | boolean;
export declare type IsolateOptionFn<TProps = any> = (props: TProps) => IsolateOptionStatic;
export declare type IsolateOption = IsolateOptionStatic | IsolateOptionFn;
export declare type RenderOption = (props: any) => ReactNode;
export declare type CycleConnectOptions = {
    root?: boolean;
    runFn?: CycleRunFunction;
    isolate?: IsolateOption;
    render?: RenderOption;
    drivers?: Drivers;
    wrappers?: CycleMainFnWrapper[];
    _innerWrappers?: CycleMainFnWrapper[];
    displayName?: string;
};
export declare type CycleNode = {
    childSources: Sources<Drivers>;
    sinkProxies: SinkProxies<Sinks<Main>>;
    run: () => DisposeFunction;
};
export declare type CycleNodeLink = {
    sources: any;
    sinkProxies: SinkProxies<Sinks<Main>>;
};
export interface CycleConnectOptionsProps {
    isolate?: IsolateOption;
}
export interface CycleConnectViewProps<TInteractionEvents> extends InteractionsProps<TInteractionEvents> {
}
export interface CycleConnectedProps<TInteractionEvents> extends CycleConnectOptionsProps, CycleConnectViewProps<TInteractionEvents> {
}
export interface MakeConnectedComponentFn<TOuterProps, TExcludeProps> {
    <P extends TExcludeProps>(WrappedComponent?: ComponentType<P>): ComponentClass<TOuterProps>;
}
