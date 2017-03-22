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
            toolbar: {
                id: html.genId(),
                enabled: false,
                value: null
            },
            currentToken: {
                id: html.genId(),
                enabled: true,
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
            bindVmNode(vm.allTokens);
            bindVmNode(vm.currentToken);
            bindVmNode(vm.toolbar);
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
                            id: vm.toolbar.id
                        }),
                        div({
                        }, [
                            p([
                                'The "Sign-Ins" tab allows you to manage your current sign-ins. A sign-in is created when you ',
                                'sign in to KBase. Normally a sign-in is removed when you logout. However, if you do not create ',
                                ' '
                            ])
                        ]),
                        BS.buildPanel({
                            title: 'Your Current Sign-In',
                            body: div({
                                id: vm.currentToken.id
                            })
                        }),  
                        BS.buildPanel({
                            title: 'Active Sign-Ins in other Browsers',
                            body: div({
                                id: vm.allTokens.id
                            })
                        }),                        
                    ])
                ])
            ]);
            bindVm();
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return date.toUTCString();
        }

        function doRevokeToken(tokenId) {
            // Revoke
            runtime.service('session').getClient().revokeToken(tokenId)
                .then(function () {
                    render();
                    return null;
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function doLogoutToken(tokenId) {
            // Revoke
            return runtime.service('session').getClient().logout(tokenId)
                .then(function () {
                    runtime.send('session', 'loggedout');
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function renderTokens() {
            var events = DomEvent.make({
                node: vm.allTokens.node
            });
            var revokeAllButton;
            if (vm.allTokens.value.length > 0) {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    id: events.addEvent({
                        type: 'click',
                        handler: doRevokeAll
                    })
                }, 'Revoke All');
            } else {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    disabled: true
                }, 'Revoke All');
            }
            vm.allTokens.node.innerHTML = table({
                class: 'table table-striped',
                style: {
                    width: '100%'
                }
            }, [
                tr([
                    th({
                        style: {
                            width: '40%'
                        }
                    }, 'Created'),
                    th({
                        style: {
                            width: '40%'
                        }
                    }, 'Expires'),
                    th({
                        style: {
                            width: '20%',
                            textAlign: 'right'
                        }
                    }, revokeAllButton)
                ])
            ].concat(vm.allTokens.value.map(function (token) {
                return tr([
                    td(niceDate(token.created)),
                    td(niceDate(token.expires) + '<br>' + token.expires),
                    td({
                        style: {
                            textAlign: 'right'
                        }
                    }, button({
                        class: 'btn btn-danger',
                        type: 'button',
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doRevokeToken(token.id);
                            }
                        })
                    }, 'Revoke'))
                ]);
            })));
            events.attachEvents();
        }

        function renderCurrentTokens(node, tokens) {
            var events = DomEvent.make({
                node: node
            });
            node.innerHTML = table({
                class: 'table table-striped',
                style: {
                    width: '100%'
                }
            }, [
                tr([
                    th({
                        style: {
                            width: '40%'
                        }
                    }, 'Created'),
                    th({
                        style: {
                            width: '40%'
                        }
                    }, 'Expires'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, '')
                ])
            ].concat(tokens.map(function (token) {
                return tr([
                    td(niceDate(token.created)),
                    td(niceDate(token.expires) + '<br>' + token.expires),
                    td({
                        style: {
                            textAlign: 'right'
                        }
                    }, [
                        button({
                            class: 'btn btn-danger',
                            type: 'button',
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doLogoutToken(token.id);
                                }
                            })
                        }, 'Logout')
                    ])
                ]);
            })));
            events.attachEvents();
        }

        function doRevokeAllAndLogout() {
            return doRevokeAll()
                .then(function () {
                    // sloppy, but conserves code.
                    return doLogoutToken(null);
                });
        }

        function doRevokeAll() {
            return Promise.all(vm.allTokens.value.map(function (token) {
                return runtime.service('session').getClient().revokeToken(token.id);
            }))
            .then(function () {
                render();
                return null;
            })
            .catch(function (err) {
                console.error('ERROR', err);
            });
        }

        function renderToolbar() {
            var events = DomEvent.make({
                node: container
            });
            vm.toolbar.node.innerHTML = div({
                class: 'btn-toolbar',
                role: 'toolbar',
                style: {
                    margin: '10px 0 10px 0'
                }
            }, [
                div({
                    class: 'btn-group pull-right',
                    role: 'group'
                }, [
                    button({
                        type: 'button',
                        class: 'btn btn-danger',
                        id: events.addEvent({
                            type: 'click',
                            handler: doRevokeAllAndLogout
                        })
                    }, 'Revoke All and Logout')
                ])
            ]);
            events.attachEvents();
        }

        function renderAllTokens() {
            if (vm.allTokens.enabled) {
                runtime.service('session').getClient().getTokens()
                    .then(function (result) {

                        renderToolbar();

                        // Render "current" token.
                        renderCurrentTokens(vm.currentToken.node, [result.current]);

                        // Render "other" tokens

                        vm.allTokens.value = result.tokens
                            .filter(function (token) {
                                return (token.type === 'Login');
                            });

                        renderTokens();

                    })
                    .catch(function (err) {
                        vm.allTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                    });
            }
        }

        function render() {
            return renderAllTokens();
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
                return render();
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