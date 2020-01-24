import { Stream, Subscription } from "xstream";
import { Drivers, Sources, Sinks, SinkProxies, Main } from "@cycle/run";
import { CycleMainFn, CycleMainFnWrapper, CycleConnectOptionsProps, IsolateOption } from "../types";
export declare function makeSinkProxies(driversOrSources: Drivers | Sources<Drivers>): SinkProxies<Drivers | Sources<Drivers>>;
export declare function subscribeStreamToStream(stream: Stream<any>, sourceStream: Stream<any>, sourceName?: string): Subscription;
export declare function subscribeSinkProxiesToSinks(sinkProxies: SinkProxies<Drivers | Sources<Drivers>>, sinks: Sinks<Main>): Subscription[];
export declare function pipeWrapper(f: CycleMainFnWrapper, g: CycleMainFnWrapper): (mainFn: CycleMainFn<{}, {}>) => Main;
export declare function wrapMain(mainFn: CycleMainFn, wrappers?: CycleMainFnWrapper[]): CycleMainFn;
export declare function maybeIsolate<P extends CycleConnectOptionsProps>(mainFn: CycleMainFn, isolateOption?: IsolateOption, isRootCycle?: boolean, initialProps?: P): CycleMainFn;
