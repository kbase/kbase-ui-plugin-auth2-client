/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    'kb_common/format'
], function(
    html,
    DomEvent,
    BS,
    format
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        p = t('p');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        var vm = {
            intro: {
                id: html.genId(),
                node: null,
                enabled: true,
                value: null,
            },
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
            bindVmNode(vm.intro);
        }

        function renderLayout() {
            var tabs = BS.buildTabs({
                style: {
                    paddingTop: '10px'
                },
                tabs: [{
                    name: 'main',
                    label: 'Main',
                    content: div({}, [
                        div({
                            id: vm.toolbar.id
                        }),
                        BS.buildPanel({
                            type: 'default',
                            title: 'Your Current Sign-In',
                            body: div({
                                id: vm.currentToken.id
                            })
                        }),
                        BS.buildPanel({
                            type: 'default',
                            title: 'Active Sign-Ins in other Browsers',
                            body: div({
                                id: vm.allTokens.id
                            })
                        }),
                    ])
                }, {
                    name: 'about',
                    label: 'About',
                    content: div({
                        id: vm.intro.id
                    })
                }]
            });

            container.innerHTML = tabs.content;
            bindVm();
        }

        function renderIntro() {
            vm.intro.node.innerHTML = div({}, [
                p([
                    'The "Sign-Ins" tab allows you to manage your current sign-ins. A sign-in is created when you ',
                    'sign in to KBase. Normally a sign-in is removed when you logout. However, if you do not create ',
                    ' '
                ])
            ]);
        }

        function doRevokeToken(tokenId) {
            // Revoke
            runtime.service('session').getClient().revokeToken(tokenId)
                .then(function() {
                    render();
                    return null;
                })
                .catch(function(err) {
                    console.error('ERROR', err);
                });
        }

        function doLogoutToken(tokenId) {
            // Revoke
            return runtime.service('session').getClient().logout(tokenId)
                .then(function() {
                    // runtime.send('session', 'loggedout');
                    runtime.send('app', 'navigate', {
                        path: 'auth2/signedout'
                    });
                })
                .catch(function(err) {
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
                            width: '20%'
                        }
                    }, 'Created'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'Expires'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'Browser'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'System'),
                    th({
                        style: {
                            width: '20%',
                            textAlign: 'right'
                        }
                    }, revokeAllButton)
                ])
            ].concat(vm.allTokens.value.map(function(token) {
                console.log('token', token);
                return tr([
                    td(format.niceTime(token.created)),
                    td(format.niceElapsedTime(token.expires)),
                    td((function() {
                        if (token.os === null || token.os.length === 0) {
                            return span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, 'n/a');
                        }
                        return span([
                            token.agent,
                            span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, token.agentver)
                        ]);
                    }())),
                    td((function() {
                        if (token.os === null || token.os.length === 0) {
                            return span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, 'n/a');
                        }
                        return span([
                            token.os,
                            span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, token.osver)
                        ]);
                    }())),
                    td({
                        style: {
                            textAlign: 'right'
                        }
                    }, button({
                        class: 'btn btn-danger',
                        type: 'button',
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
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
                            width: '20%'
                        }
                    }, 'Created'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'Expires'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'Browser'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'System'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, '')
                ])
            ].concat(tokens.map(function(token) {
                return tr([
                    td(format.niceTime(token.created)),
                    td(format.niceElapsedTime(token.expires)),
                    td((function() {
                        if (token.os === null || token.os.length === 0) {
                            return span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, 'n/a');
                        }
                        return span([
                            token.agent,
                            span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, token.agentver)
                        ]);
                    }())),
                    td((function() {
                        if (token.os === null || token.os.length === 0) {
                            return span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, 'n/a');
                        }
                        return span([
                            token.os,
                            span({
                                style: {
                                    fontStyle: 'italic',
                                    marginLeft: '0.2em',
                                    color: '#888'
                                }
                            }, token.osver)
                        ]);
                    }())),
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
                                handler: function() {
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
                .then(function() {
                    // sloppy, but conserves code.
                    return doLogoutToken(null);
                });
        }

        function doRevokeAll() {
            return Promise.all(vm.allTokens.value.map(function(token) {
                    return runtime.service('session').getClient().revokeToken(token.id);
                }))
                .then(function() {
                    render();
                    return null;
                })
                .catch(function(err) {
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
                    .then(function(result) {

                        renderIntro();

                        renderToolbar();

                        // Render "current" token.
                        renderCurrentTokens(vm.currentToken.node, [result.current]);

                        // Render "other" tokens

                        vm.allTokens.value = result.tokens
                            .filter(function(token) {
                                return (token.type === 'Login');
                            });

                        renderTokens();

                    })
                    .catch(function(err) {
                        vm.allTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                    });
            }
        }

        function render() {
            return renderAllTokens();
        }

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return Promise.try(function() {
                renderLayout();
                return render();
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