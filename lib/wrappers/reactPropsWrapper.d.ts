import { Stream, MemoryStream } from "xstream";
import { CycleMainFn } from "../types";
export declare class ReactPropsSource<TProps> {
    props$: MemoryStream<TProps>;
    private _props$;
    constructor(stream: Stream<TProps>);
    pluck<P extends keyof TProps>(propName: P): Stream<TProps[P] | undefined>;
    select<P extends keyof TProps>(propSelector: P): ReactPropsSource<TProps[P] | undefined>;
}
export declare function makeReactPropsWrapper<TProps extends {}>(inputProps$: Stream<TProps>, willUnmount$: Stream<null>): {
    propsWrapper: (main: CycleMainFn) => CycleMainFn;
    props$: MemoryStream<TProps>;
};
