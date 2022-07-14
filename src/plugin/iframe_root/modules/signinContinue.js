define([
    'preact',
    'reactComponents/SignInContinue'
], (
    preact,
    SignInContinue
) => {
    class SignInContinuePanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        start(params) {
            preact.render(preact.h(SignInContinue, {
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

    return SignInContinuePanel;
});
