import { adapt } from "@cycle/run/lib/adapt";
var DefaultInteractionsSource = /** @class */ (function () {
    function DefaultInteractionsSource(stream) {
        this._interaction$ = adapt(stream);
    }
    // tslint:disable-next-line no-any
    DefaultInteractionsSource.prototype.select = function (interactionSelector) {
        return this._interaction$
            .filter(function (i) {
            return i.type === interactionSelector;
        })
            .map(function (interaction) { return interaction.value; });
    };
    return DefaultInteractionsSource;
}());
export { DefaultInteractionsSource };
export default DefaultInteractionsSource;
//# sourceMappingURL=DefaultInteractionsSource.js.map