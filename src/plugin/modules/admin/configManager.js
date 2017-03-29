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
            intro: {
                id: html.genId(),
                node: null
            },
            search: {
                id: html.genId(),
                node: null
            },
            users: {
                id: html.genId(),
                node: null
            }
        };

        function bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        function bindVm() {
            Object.keys(vm).forEach(function (key) {
                bindVmNode(vm[key]);
            });
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
                            id: vm.intro.id
                        }),
                        div({
                            id: vm.search.id
                        }),
                        div({
                            id: vm.users.id
                        })
                    ])
                ])
            ]);
            bindVm();
        }

        function renderIntro() {
            vm.intro.node.innerHTML = div({},[
                p('This is the CONFIG manager')
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
                renderLayout();
                renderIntro();
                // return runtime.service('session').getClient().getMe()
                //     .then(function (account) {
                //         vm.roles.value = account.roles;
                //         vm.roles.value.forEach(function (role) {
                //             switch (role.id) {
                //             case 'ServToken':
                //                 vm.serverTokens.enabled = true;
                //                 break;
                //             case 'DevToken':
                //                 vm.developerTokens.enabled = true;
                //                 break;
                //             }
                //         });
                //         return [renderAllTokens(), renderServerTokens(), renderDeveloperTokens()];
                //     });
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