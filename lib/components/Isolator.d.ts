import React, { ReactNode } from 'react';
import { Scopes } from '@cycle/isolate';
export interface Props {
    children: ReactNode;
    scope: Scopes<any>;
}
export declare const Isolator: React.ComponentClass<Props, any>;
export default Isolator;
