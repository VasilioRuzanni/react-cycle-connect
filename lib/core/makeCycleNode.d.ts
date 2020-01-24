import { Drivers, Sources, Sinks, SinkProxies, Main } from "@cycle/run";
import { CycleConnectOptions, CycleConnectOptionsProps, CycleMainFn, CycleNode } from "../types";
export declare function makeCycleNode<P extends CycleConnectOptionsProps>(mainFn: CycleMainFn, cycleConnectOptions?: CycleConnectOptions, upstreamSources?: Sources<Drivers>, upstreamSinkProxies?: SinkProxies<Sinks<Main>>, initialProps?: P, componentName?: string): CycleNode;
