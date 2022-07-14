define([
    'preact',
    'reactComponents/SignIn'
], (
    preact,
    SignIn
) => {
    class SignInPanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        start(params) {
            preact.render(preact.h(SignIn, {
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

    return SignInPanel;
});
