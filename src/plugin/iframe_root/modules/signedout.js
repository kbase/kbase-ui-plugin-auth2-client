define([
    'preact',
    'reactComponents/SignedOutController'
], (
    preact,
    SignedOut
) => {
    class SignedOutPanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        start(params) {
            preact.render(preact.h(SignedOut, {
                runtime: this.runtime,
                params
            }), this.container);
        }

        detach() {
            if (this.container) {
                this.container.innerHTML = '';
            }
        }

    }

    return SignedOutPanel;
});
