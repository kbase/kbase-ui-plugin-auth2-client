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
        button = t('button'),
        form = t('form'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        p = t('p'),
        b = t('b'),
        span = t('span');

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
            currentToken: {
                id: html.genId(),
                enabled: true,
                value: null
            },
            addTokenForm: {
                id: html.genId(),
                enabled: true,
                value: null
            },
            allTokens: {
                id: html.genId(),
                enabled: true,
                value: null
            },
            newToken: {
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
            bindVmNode(vm.addTokenForm);
            bindVmNode(vm.newToken);
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
                      
                        BS.buildPanel({
                            title: 'Developer and Server Tokens',
                            body: div([
                                div({
                                    id: vm.addTokenForm.id
                                }),
                                div({
                                    id: vm.newToken.id
                                }),
                                div({
                                    id: vm.allTokens.id
                                })
                            ])
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

        function renderNewToken() {
            var newToken = vm.newToken.value;
            var clockId = html.genId();
            var events = new DomEvent.make({
                node: vm.newToken.node
            });
            vm.newToken.node.innerHTML = div({
                class: 'well',
                style: {
                    marginTop: '10px'
                }
            }, [
                p('New ' + b(newToken.type) + ' token successfully created'),
                p('Please copy it to a secure location and remove this message'),
                p('This message will self-destruct in ' + span({id: clockId}) + '.'),
                p('New Token: ' + newToken.token),
                div(button({
                    type: 'button',
                    class: 'btn btn-danger',
                    id: events.addEvent({
                        type: 'click',
                        handler: function () {
                            clock.stop();
                            vm.newToken.node.innerHTML = '';
                        }
                    })
                }, 'Done'))
            ]);
            events.attachEvents();

            function Clock(countdown, id) {
                var node = document.getElementById(id);
                var timer;
                if (!node) {
                    return;
                }
                function render() {
                    node.innerHTML = String(countdown);
                }
                function loop() {
                    timer = window.setTimeout(function () {                       
                        countdown -= 1;
                        render();
                        if (countdown > 0) {
                            loop();
                        } else {
                            vm.newToken.node.innerHTML = '';
                        }
                    }, 1000);
                }
                function stop() {
                    countdown = 0;
                    if (timer) {
                        window.clearTimeout(timer);
                    }
                }
                render();
                loop();
                return {
                    stop: stop
                };
            }
            var clock = Clock(10, clockId);
        }

        function handleSubmitAddToken() {
            var name = vm.addTokenForm.node.querySelector('[name="name"]');
            var type = vm.addTokenForm.node.querySelector('[name="type"]');

            runtime.service('session').getClient().createToken({
                name: name.value,
                type: type.value
            })
            .then(function (result) {
                renderAllTokens();
                vm.newToken.value = result;
                renderNewToken();
                return null;
            })
            .catch(function (err) {
                console.error('ERROR',err);
            });

        }

        function renderAddTokenForm() {
            var events = DomEvent.make({
                node: vm.addTokenForm.node
            });
            vm.addTokenForm.node.innerHTML = form({
                id: events.addEvent('submit', function (e) {
                    e.preventDefault();
                    handleSubmitAddToken();
                    return false;
                })
            }, div([
                div([
                    label('Token name:'),
                    input({
                        name: 'name',
                    })
                ]),
                div([
                    label('Token type:'),
                    select({
                        name: 'type'
                    }, [
                        option({
                            value: 'dev'
                        }, 'Developer'),
                        option({
                            value: 'server'
                        }, 'Server')
                    ])
                ]),
                div([
                    button({
                        class: 'btn btn-primary',
                        type: 'button',
                        id: events.addEvent({
                            type: 'click', 
                            handler: function (e) {
                                handleSubmitAddToken();
                            }
                        })
                    }, 'Create Token')
                ])
            ]));
            events.attachEvents();
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
                            width: '25%'
                        }
                    }, 'Created'),
                    th({
                        style: {
                            width: '25%'
                        }
                    }, 'Expires'),
                    th({
                        style: {
                            width: '25%'
                        }
                    }, 'Type'),
                    th({
                        style: {
                            width: '25%'
                        }
                    }, 'Name'),
                    th({
                        style: {
                            width: '25%',
                            textAlign: 'right'
                        }
                    }, revokeAllButton)
                ])
            ].concat(vm.allTokens.value.map(function (token) {
                return tr([
                    td(niceDate(token.created)),
                    td(niceDate(token.expires) + '<br>' + token.expires),
                    td(token.type),
                    td(token.name),
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
                                return (token.type !== 'Login');
                            });

                        renderTokens();
                        renderAddTokenForm();

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

        function render() {
            return runtime.service('session').getClient().getMe()
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
                    return Promise.all([renderAllTokens(), renderServerTokens(), renderDeveloperTokens()]);
                });
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
                render();
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