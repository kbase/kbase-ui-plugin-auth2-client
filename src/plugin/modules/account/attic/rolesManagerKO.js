define([
    'bluebird',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'knockout',
    './components/userRoles',
], function (
    Promise,
    html,
    BS,
    ko
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        function render(id) {
            return div({
                id: id,
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12',
                    }, [
                        BS.buildPanel({
                            title: 'Your Roles',
                            body: div({
                                dataBind: {
                                    component: {
                                        name: '"user-roles"',
                                        params: {
                                            roles: 'roles'
                                        }
                                    }
                                }
                            })
                        })
                    ])
                ])
            ]);
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return runtime.service('session').getClient().getMe()
                .then(function (account) {
                    var id = html.genId();
                    var vm = {
                        roles: account.roles
                    };
                    container.innerHTML = render(id);
                    ko.applyBindings(vm, document.getElementById(id));
                });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                    hostNode.innerHTML = '';
                }
            });
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };

    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});