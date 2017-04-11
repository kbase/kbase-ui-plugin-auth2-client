define([], function () {
    function Observed(arg) {
        function changed() {
            try {
                arg.changed(arg.value);
            } catch (ex) {
                console.error('Observed', ex);
            }
        }

        function get() {
            return arg.value;
        }
        return {
            changed: changed,
            get: get
        };
    }

    return Observed;
});