import { InteractionsProps } from "./interactions";
import { CycleConnectOptions, CycleMainFn, MakeConnectedComponentFn } from "./types";
export declare function cycleConnect<TProps = {}, TViewProps = {}, TSinkProps = {}, TInteractionEvents = {}>(mainFn: CycleMainFn<TProps | Partial<TViewProps>, TSinkProps>, options?: CycleConnectOptions): MakeConnectedComponentFn<TProps, InteractionsProps>;
export declare function cycleConnect<TProps = {}>(options: CycleConnectOptions): MakeConnectedComponentFn<TProps, InteractionsProps>;
