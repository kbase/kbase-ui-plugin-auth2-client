/*global Promise*/
define([
    'kb_common/html',
], function (
    html
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        h2 = t('h2'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        form = t('form'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        p = t('p'),
        iframe = t('iframe');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        var vm = {
            roles: {
                value: null
            },
            serverTokens: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            developerTokens: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            allTokens: {
                id: html.genId(),
                enabled: true,
                value: null
            }
        };

        function bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        function bindVm() {
            bindVmNode(vm.serverTokens);
            bindVmNode(vm.developerTokens);
            bindVmNode(vm.allTokens);
        }

        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({ class: 'col-md-12' }, [
                        div({
                            id: vm.allTokens.id
                        }),
                        div({
                            id: vm.serverTokens.id
                        }),
                        div({
                            id: vm.developerTokens.id
                        })
                    ])
                ])
            ]);
            bindVm();
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return date.toUTCString()
        }

        function renderAllTokens() {
            if (vm.allTokens.enabled) {
                runtime.service('session').getClient().getTokens()
                    .then(function (result) {
                        vm.allTokens.node.innerHTML = table({
                            class: 'table table-striped'
                        }, [
                            tr([
                                th('Created'),
                                th('Expires'),
                                th('Type'),
                                th('User'),
                                th('Id')
                            ])
                        ].concat(result.tokens.map(function (token) {
                            return tr([
                                td(niceDate(token.created)),
                                td(niceDate(token.expires)),
                                td(token.type),
                                td(token.user),
                                td(token.id)
                            ]);
                        })));
                    })
                    .catch(function (err) {
                        vm.serverTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                    });
            }
        }
        function renderServerTokens() {
            if (vm.serverTokens.enabled) {
                vm.serverTokens.node.innerHTML = 'enabled';
            }
        }
        function renderDeveloperTokens() {
            if (vm.developerTokens.enabled) {
                vm.developerTokens.node.innerHTML = 'enabled';
            }
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                renderLayout();
                return runtime.service('session').getClient().getAccount()
                    .then(function (account) {
                        vm.roles.value = account.roles;
                        vm.roles.value.forEach(function (role) {
                            switch (role.id) {
                            case 'ServToken':
                                vm.serverTokens.enabled = true;
                                break;
                            case 'DevToken':
                                vm.developerTokens.enabled = true;
                                break;
                            }
                        });
                        return [renderAllTokens(), renderServerTokens(), renderDeveloperTokens()];
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