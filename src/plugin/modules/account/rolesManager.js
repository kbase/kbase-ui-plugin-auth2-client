/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils'
], function (
    html,
    DomEvent,
    BS
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
                id: html.genId(),
                node: null,
                label: 'Roles',
                value: null
            }
        };

        function bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        function bindVm() {
            bindVmNode(vm.roles);
        }
        function renderRoles() {
            var events = DomEvent.make({
                node: vm.roles.node
            });
            var content;
            if (vm.roles.value.length === 0) {
                content =vm.roles.node.innerHTML = 'No roles assigned';
            } else {
                content = table({
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
            }
            vm.roles.node.innerHTML = BS.buildPanel({
                title: 'Your Roles',
                body: content
            });

            events.attachEvents();
        }

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
                    div({ 
                        class: 'col-md-12',
                        id: vm.roles.id
                    })
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
                return runtime.service('session').getClient().getMe()
                    .then(function (account) {
                        vm.roles.value = account.roles;
                        container.innerHTML = render();
                        bindVm();
                        renderRoles();
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