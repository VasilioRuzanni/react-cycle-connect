import { ErrorInfo } from "react";
import { Stream } from "xstream";
import { CycleMainFn } from "../types";
export interface ReactLifecycleStreams<TProps> {
    willMount$: Stream<null>;
    didMount$: Stream<null>;
    willReceiveProps$: Stream<TProps>;
    willUpdate$: Stream<TProps>;
    didUpdate$: Stream<TProps>;
    willUnmount$: Stream<null>;
    didCatch$: Stream<{
        error: Error;
        errorInfo: ErrorInfo;
    }>;
}
export declare class ReactLifecycleSource<TProps> {
    lifecycleStreams: ReactLifecycleStreams<TProps>;
    constructor(lifecycleStreams: ReactLifecycleStreams<TProps>);
}
export declare function makeReactLifecycleWrapper<TProps>(): {
    lifecycleWrapper: (mainFn: CycleMainFn) => CycleMainFn;
    lifecycleStreams: ReactLifecycleStreams<TProps>;
};
