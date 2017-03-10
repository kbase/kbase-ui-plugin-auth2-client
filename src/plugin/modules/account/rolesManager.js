/*global Promise*/
define([
    'kb_common/html',
], function (
    html
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;
        var vm = {
            roles: {
                label: 'Roles',
                value: null
            }
        };

        function render() {
            return div({
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({ class: 'col-md-12' }, (function () {
                        if (vm.roles.value.length === 0) {
                            return 'No roles assigned';
                        }
                        return table({
                            class: 'table table-striped'
                        }, [tr([
                            th('Id'),
                            td('Desc'),
                            td()
                        ])].concat(vm.roles.value.map(function (role) {
                            return tr([
                                th(role.id),
                                td(role.desc),
                                td(button({
                                    class: 'btn btn-danger'                            
                                }, 'Remove'))
                            ]);
                        })));
                    }()))
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
            return Promise.try(function () {
                return runtime.service('session').getClient().getAccount()
                    .then(function (account) {
                        vm.roles.value = account.roles;
                        container.innerHTML = render();
                    });
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