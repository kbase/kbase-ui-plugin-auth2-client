/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2'
], function(
    html,
    DomEvents
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        span = t('span'),
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

        function bindVm(vm) {
            Object.keys(vm).forEach(function(key) {
                bindVmNode(vm[key]);
            });
        }

        function renderUsers(users) {
            var events = DomEvents.make({
                node: container
            });
            vm.users.node.innerHTML = div([
                table({
                    class: 'table table-striped'
                }, [
                    tr([
                        th('Username'),
                        th('Real name'),
                        th('')
                    ])
                ].concat(Object.keys(users).map(function(key) {
                    return tr([
                        td((a({
                            href: '#people/' + key,
                            target: '_blank'
                        }, key))),
                        td(users[key]),
                        td(a({
                            class: 'btn btn-default',
                            href: '#auth2/admin/user/' + key
                        }, span({
                            class: 'fa fa-pencil'
                        }), 'Edit'))
                    ]);
                })))
            ]);
            events.attachEvents();
        }

        function doUserSearch(searchString) {
            return runtime.service('session').getClient().adminUserSearch({
                    prefix: searchString,
                    fields: 'username,displayname'
                })
                .then(function(result) {
                    renderUsers(result);
                })
                .catch(function(err) {
                    console.error('ERR', err);
                });
        }

        function handleKeyUp(ev) {
            // don't get the key, just get the data from the control.
            var searchText = vm.search.node.querySelector('[name="search-input"]').value;
            if (searchText.length >= 2) {
                doUserSearch(searchText);
            }
        }


        function renderSearch() {
            var events = DomEvents.make({
                node: container
            });
            vm.search.node.innerHTML = div([
                input({
                    name: 'search-input',
                    type: 'text',
                    class: 'form-control',
                    id: events.addEvent({
                        type: 'keyup',
                        handler: handleKeyUp
                    })
                })
            ]);
            events.attachEvents();
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
            bindVm(vm);
        }

        function renderIntro() {
            vm.intro.node.innerHTML = div({}, [
                p('This is the user manager')
            ]);
        }

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function() {
                renderLayout();
                renderIntro();
                renderSearch();
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
            return Promise.try(function() {});
        }

        function detach() {
            return Promise.try(function() {
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
        make: function(config) {
            return factory(config);
        }
    };
});