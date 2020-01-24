import { CycleMainFn } from "../types";
import { InteractFn } from "./types";
export declare function makeInteractionsWrapper(): {
    interactionsWrapper: (mainFn: CycleMainFn<{}, {}>) => CycleMainFn<{}, {}>;
    interactFn: InteractFn;
};
