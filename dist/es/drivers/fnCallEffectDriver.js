export function makeFnCallEffectDriver() {
    return function fnCallEffectDriver(fnCallEffect$) {
        fnCallEffect$.addListener({
            next: function (fnCallEffect) {
                if (typeof fnCallEffect.fn === 'function') {
                    fnCallEffect.fn.apply(null, fnCallEffect.args);
                }
            }
        });
    };
}
//# sourceMappingURL=fnCallEffectDriver.js.map