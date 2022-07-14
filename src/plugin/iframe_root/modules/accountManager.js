define([
    'preact',
    'reactComponents/account/AccountManagerController'
], (
    preact,
    AccountManager
) => {
    class AccountManagerPanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        start(params) {
            preact.render(preact.h(AccountManager, {
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

    return AccountManagerPanel;
});
