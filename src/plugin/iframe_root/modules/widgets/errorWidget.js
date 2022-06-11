define([
    'bluebird',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'lib/domUtils',
    '../lib/utils'
], (
    Promise,
    html,
    BS,
    {setInnerHTML},
    Utils
) => {
    const t = html.tag,
        div = t('div');

    function factory() {
        let hostNode, container;

        const vm = Utils.ViewModel({
            model: {
                error: {
                    id: html.genId(),
                    node: null,
                    model: {
                        code: {
                            id: html.genId()
                        },
                        message: {
                            id: html.genId()
                        },
                        detail: {
                            id: html.genId()
                        },
                        data: {
                            id: html.genId()
                        }
                    }
                }
            }
        });

        //

        function render() {
            setInnerHTML(container, BS.buildPanel({
                name: 'error',
                hidden: true,
                id: vm.get('error').id,
                title: 'Error',
                type: 'danger',
                body: div([
                    div({
                        id: vm.get('error.code').id,
                    }, BS.buildPanel({
                        name: 'code',
                        title: 'Code',
                        type: 'danger',
                        body: div({
                            dataElement: 'body'
                        })
                    })),
                    div({
                        id: vm.get('error.message').id,
                    }, BS.buildPanel({
                        name: 'message',
                        title: 'Message',
                        type: 'danger',
                        body: div({
                            dataElement: 'body'
                        })
                    })),
                    div({
                        id: vm.get('error.detail').id,
                    }, BS.buildCollapsiblePanel({
                        name: 'detail',
                        title: 'Detail',
                        type: 'danger',
                        collapsed: true,
                        hidden: false,
                        body: div({
                            dataElement: 'body'
                        })
                    })),
                    div({
                        id: vm.get('error.data').id,
                    }, BS.buildCollapsiblePanel({
                        name: 'data',
                        title: 'Data',
                        type: 'danger',
                        collapsed: true,
                        hidden: false,
                        body: div({
                            dataElement: 'body'
                        })
                    }))
                ])
            }));
            vm.bindAll();
        }

        function update(error) {
            vm.get('error').node.classList.remove('hidden');
            vm.setHTML('error.code', 'body', error.code || 'n/a');
            vm.setHTML('error.message', 'body', error.message);
            vm.setHTML('error.detail', 'body', error.detail || 'n/a');
            vm.setHTML('error.data', 'body', error.data ? BS.buildPresentableJson(error.data) : 'n/a');
        }

        // API

        function attach(node) {
            return Promise.try(() => {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                return api;
            });
        }

        function start(params) {
            return Promise.try(() => {
                render();
                update(params.error);
                return api;
            });
        }

        function stop() {
            return Promise.try(() => {
                return api;
            });
        }

        function detach() {
            return Promise.try(() => {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
                return api;
            });
        }


        const api = {
            attach,
            start,
            stop,
            detach
        };
        return api;
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});