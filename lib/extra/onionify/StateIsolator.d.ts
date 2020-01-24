import React, { ReactNode } from "react";
import { Scope } from "@cycle/state";
export interface StateIsolatorProps {
    children: ReactNode;
    channelName?: string;
    lens: Scope<any, any>;
}
export declare const StateIsolator: React.ComponentClass<StateIsolatorProps, any>;
export default StateIsolator;
