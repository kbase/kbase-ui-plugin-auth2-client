/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    'kb_common/format'
], function (
    html,
    DomEvent,
    BS,
    Format
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
            bindVmNode(vm.addTokenForm);
            bindVmNode(vm.newToken);
            bindVmNode(vm.allTokens);
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
                            title: 'Service Tokens',
                            body: div([
                                div({
                                    id: vm.addTokenForm.id,
                                    style: {
                                        marginBottom: '10px'
                                    }
                                }),
                                div({
                                    id: vm.newToken.id
                                }),
                                div({
                                    id: vm.allTokens.id
                                })
                            ])
                        })
                    ])
                ])
            ]);
            bindVm();
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return Format.niceTime(date);
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

            runtime.service('session').getClient().createToken({
                name: name.value,
                type: 'server'
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
                class: 'form-inline',
                id: events.addEvent({
                    type: 'submit', 
                    handler: function (e) {
                        e.preventDefault();
                        handleSubmitAddToken();
                        return false;
                    }
                })
            }, div({
                class: 'form-group'
            }, [
                label({
                    style: {
                        marginRight: '4px'
                    }
                }, 'Token name'),
                input({
                    name: 'name',
                    class: 'form-control'
                }),
                ' ',
                button({
                    class: 'btn btn-primary',
                    type: 'submit'
                }, 'Create Token')
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
                    td('never'),
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
                    // button({
                    //     type: 'button',
                    //     class: 'btn btn-danger',
                    //     // id: events.addEvent({
                    //     //     type: 'click',
                    //     //     handler: 
                    //     // })
                    // }, 'NOOP')
                ])
            ]);
            events.attachEvents();
        }

        function renderAllTokens() {
            if (vm.allTokens.enabled) {
                runtime.service('session').getClient().getTokens()
                    .then(function (result) {
                        renderToolbar();

                        vm.allTokens.value = result.tokens
                            .filter(function (token) {
                                return (token.type === 'Service');
                            });

                        renderTokens();
                        renderAddTokenForm();
                    })
                    .catch(function (err) {
                        vm.allTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                    });
            }
        }

        function render() {
            renderAllTokens();
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
            //         return Promise.all([renderAllTokens(), renderServerTokens(), renderDeveloperTokens()]);
            //     });
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