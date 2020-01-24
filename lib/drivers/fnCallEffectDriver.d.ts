import { Stream } from 'xstream';
export declare type FnCallEffect = {
    fn: (...args: any[]) => any;
    args: any[];
};
export declare function makeFnCallEffectDriver(): (fnCallEffect$: Stream<FnCallEffect>) => void;
