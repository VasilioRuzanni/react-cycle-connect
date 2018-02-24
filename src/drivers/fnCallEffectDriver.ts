import { Stream } from 'xstream';

// TODO: Somehow specify that this driver, while generic enough to operate
// "function calls", not really that generic because function can be called
// in a way that a synchronous response it expected (i.e., it might return
// a `Promise` back, or just some pure calculation result).

// TODO: Consider extending this to have result passed back as a source

export type FnCallEffect = {
  fn: (...args: any[]) => any;
  args: any[];
};

export function makeFnCallEffectDriver() {
  return function fnCallEffectDriver(fnCallEffect$: Stream<FnCallEffect>) {
    fnCallEffect$.addListener({
      next: (fnCallEffect) => {
        if (typeof fnCallEffect.fn === 'function') {
          fnCallEffect.fn.apply(null, fnCallEffect.args);
        }
      }
    });
  };
}
