define([
    'preact',
    'reactComponents/SignUp'
], (
    preact,
    SignUp
) => {
    class SignUpPanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        async start(params) {
            preact.render(preact.h(SignUp, {
                runtime: this.runtime,
                params
            }), this.container);
        }

        detach() {
            this.container.innerHTML = '';
        }

    }

    return SignUpPanel;
});
