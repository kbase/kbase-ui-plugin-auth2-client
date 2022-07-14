define([
    'preact',
    'reactComponents/LinkContinueController'
], (
    preact,
    LinkContinue
) => {
    class LinkContinuePanel {
        constructor(config) {
            this.runtime = config.runtime;
        }

        attach(node) {
            this.container = node;
        }

        start(params) {
            preact.render(preact.h(LinkContinue, {
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

    return LinkContinuePanel;
});
