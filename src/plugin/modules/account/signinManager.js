define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    'kb_common/format'
], function (
    Promise,
    html,
    DomEvent,
    BS,
    Format
) {
    'use strict';
    
    var
        t = html.tag,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        p = t('p'),
        em = t('em');

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

        //     function renderLayout2() {
        //         return div({
        //             style: {
        //                 display: 'flex',
        //                 flexDirection: 'column',
        //                 flex: '1 1 0px'
        //             }
        //         }, [
        //             div({
        //                 style: {
        //                     flex: '0 0 0px',
        //                     backgroundColor: 'rgba(255,185,2,0.5)',
        //                     padding: '6px',
        //                     display: 'flex',
        //                     flexDirection: 'row'
        //                 }
        //             }, [
        //                 div({
        //                     style: {
        //                         flex: '2',
        //                         color: 'rgba(0,121,98,1)', // 0, 121, 98
        //                         fontSize: '130%',
        //                         fontWeight: 'bold',
        //                         textAlign: 'center',
        //                         display: 'flex',
        //                         flexDirection: 'column',
        //                         justifyContent: 'center'
        //                     }
        //                 }, 'Edit Your Profile'),
        //                 div({
        //                     style: {
        //                         flex: '1',
        //                         textAlign: 'center',
        //                         display: 'flex',
        //                         flexDirection: 'column',
        //                         justifyContent: 'center'
        //                     },
        //                     dataBind: {
        //                         text: 'message'
        //                     }
        //                 }),
        //                 div({
        //                     style: {
        //                         flex: '1',
        //                         textAlign: 'right'
        //                     }
        //                 }, [
        //                     a({
        //                         class: 'btn btn-link',
        //                         href: '#people'
        //                     }, 'Open Your Profile Page'),
        //                     buildSaveButton()
        //                 ])
        //             ]),
        //             div({
        //                 style: {
        //                     display: 'flex',
        //                     flexDirection: 'row',
        //                     flex: '1 1 0px',
        //                     alignItems: 'stretch',
        //                     overflowY: 'auto',
        //                     padding: '5px'
        //                 }
        //             }, [
        //                 div({
        //                     style: {
        //                         // flexDirection: 'column',
        //                         // justifyContent: 'flex-start',
        //                         // alignItems: 'stretch',
        //                         // alignContent: 'stretch',
        //                         flex: '1 1 0px',
        //                         overflowY: 'auto',
        //                         padding: '0 10px 0 5px'
        //                     }
        //                 }, [

        //                     div({
        //                         style: {
        //                             height: '10px'
        //                         }
        //                     }),
        //                     buildForm(),
        //                     // buildSaver(),
        //                     div({
        //                         style: {
        //                             height: '10px'
        //                         }
        //                     }),
        //                 ]),
        //                 div({
        //                     style: {
        //                         flex: '1 1 0px',
        //                         overflowY: 'auto',
        //                         padding: '0 10px 0 5px'
        //                     }
        //                 }, [
        //                     div({
        //                         style: {
        //                             textAlign: 'center'
        //                         }
        //                     }, [
        //                         span({
        //                             style: {
        //                                 fontWeight: 'bold',
        //                                 fontSize: '120%'
        //                             }
        //                         }, 'Preview')
        //                     ]),
        //                     div({
        //                         id: 'profilePreview',
        //                         style: {
        //                             position: 'relative'
        //                         },
        //                         dataBind: {
        //                             component: {
        //                                 name: '"profile-view"',
        //                                 params: {
        //                                     profile: 'exportedProfile()'
        //                                 }
        //                             }
        //                         }
        //                     })
        //                 ])
        //             ])
        //         ]);
        //     }
        // }

        function renderLayout() {
            var tabs = BS.buildTabs({
                style: {
                    paddingTop: '10px'
                },
                tabs: [{
                    name: 'main',
                    label: 'Manage Your Sign-ins',
                    content: div({}, [
                        div({
                            id: vm.toolbar.id
                        }),
                        BS.buildPanel({
                            type: 'default',
                            class: 'kb-panel-light',
                            title: 'Your Current Sign-In',
                            body: div({
                                id: vm.currentToken.id
                            })
                        }),
                        BS.buildPanel({
                            type: 'default',
                            class: 'kb-panel-light',
                            title: 'Other Sign-In Sessions',
                            body: div({
                                id: vm.allTokens.id
                            })
                        }),
                    ])
                }, {
                    name: 'about',
                    icon: 'info-circle',
                    content: div({
                        id: vm.intro.id
                    })
                }]
            });

            container.innerHTML = div({
                style: {
                    marginTop: '10px'
                }
            }, tabs.content);
            bindVm();
        }

        function renderInfo() {
            vm.intro.node.innerHTML = div({
                style: {
                    maxWidth: '60em',
                    margin: '0 auto'
                }
            }, [
                p([
                    'A ',
                    em('sign-in session'),
                    ' is created when you ',
                    'sign in to KBase. A sign-in session is removed when you logout. ',
                    'However, if you do not logout, your sign-in session will remain active for two weeks. ',
                    'At the end of two weeks, the sign-in session will become invalid, and you will need to sign-in again.'
                ]),
                p([
                    'If you unselect the "stay signed in" option during sign-in, your sign-in session will be removed from the ',
                    'browser when you quit it. However, the KBase system will still have an internal record of the sign-in session, ',
                    'which will be displayed on this page.'
                ]),

                p({
                    style: {
                        fontWeight: 'bold'
                    }
                }, 'Current Sign-In'),
                p([
                    'Your <i>Current sign-in</i> is the one active in this browser.'
                ]),
                p({
                    style: {
                        fontWeight: 'bold'
                    }
                }, 'Other Sign-Ins'),
                p([
                    'The <i>Other sign-ins</i> are all other active sign-ins other than the current one. ',
                    'This includes sign-ins in other browsers on this or other computers, as well as past sign-ins in this browser. ',
                ]),
                p([
                    'Note that if you have deleted your browser cookies, or unselect the "keep me logged in" option at sign-in, ',
                    'your sign-in session will become disassociated from your web browser, and will become unusable. ',
                    'The KBase system does not know that this has occurred and will report the sign-in session on this page until ',
                    'it expires.'
                ]),
                p([
                    'The browser and operating system columns can help you locate the browser with which ',
                    'an active session is associated.'
                ]),
                p([
                    'If you have left the  "keep me logged in" option checked ',
                    'when logging in, the browser will have a sign-in cookie lasting for two weeks, even if you ',
                    'close and re-open your browser. ',
                    'However, if you unselected the "keep me logged in" option your KBase browser cookie will be removed ',
                    'when your browser is exited.'
                ])
            ]);
        }

        function doRevokeToken(tokenId) {
            // Revoke
            return runtime.service('session').getClient().revokeToken(tokenId)
                .then(function () {
                    return render();
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function doLogout() {
            // Revoke
            return runtime.service('session').getClient().logout()
                .then(function () {
                    // runtime.send('session', 'loggedout');
                    runtime.send('app', 'navigate', {
                        path: 'auth2/signedout'
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        // function doLogoutToken(tokenId) {
        //     // Revoke
        //     return runtime.service('session').getClient().logout(tokenId)
        //         .then(function () {
        //             // runtime.send('session', 'loggedout');
        //             runtime.send('app', 'navigate', {
        //                 path: 'auth2/signedout'
        //             });
        //         })
        //         .catch(function (err) {
        //             console.error('ERROR', err);
        //         });
        // }


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
                    }),
                    dataToggle: 'tooltip',
                    dataPlacement: 'left',
                    title: 'Remove all of your sign-in sessions other than the current one.'
                }, 'Remove All');
            } else {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    disabled: true,
                    dataToggle: 'tooltip',
                    dataPlacement: 'left',
                    title: 'You do not have any other sign-in sessions.'
                }, 'Remove All');
            }

            if (vm.allTokens.value.length === 0) {
                vm.allTokens.node.innerHTML = div({
                    style: {
                        fontStyle: 'italic',
                        textAlign: 'center'
                    }
                }, 'You do not have any additional active sign-ins.');
                return;
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
                            width: '10%'
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
                    }, 'Operating System'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'IP Address'),
                    th({
                        style: {
                            width: '10%',
                            textAlign: 'right'
                        }
                    }, revokeAllButton)
                ])
            ].concat(vm.allTokens.value
                .sort(function (a, b) {
                    return (a.created - b.created);
                })
                .map(function (token) {
                    return tr([
                        td(Format.niceTime(token.created)),
                        td(Format.niceElapsedTime(token.expires)),
                        td((function () {
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
                        td((function () {
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
                                fontFamily: 'monospace'
                            }
                        }, token.ip),
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
                            }),
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: 'Remove this sign-in session. Note that this will be leave the session cookie in the browser, but it will be unusable.'
                        }, 'Remove'))
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
                            width: '10%'
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
                    }, 'Operating System'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'IP Address'),
                    th({
                        style: {
                            width: '10%'
                        }
                    }, '')
                ])
            ].concat(tokens.map(function (token) {
                return tr([
                    td(Format.niceElapsedTime(token.created) +
                        ' (' +
                        Format.niceTime(token.created) +
                        ')'),
                    td(Format.niceElapsedTime(token.expires)),
                    td((function () {
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
                    td((function () {
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
                            fontFamily: 'monospace'
                        }
                    }, token.ip),

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
                                    // doLogoutToken(token.id);
                                    doLogout();
                                }
                            }),
                            dataToggle: 'tooltip',
                            dataPlacement: 'left',
                            title: 'Remove the current sign-in session and browser cookie. This is the same as "logging out".'
                        }, 'Logout')
                    ])
                ]);
            })));
            events.attachEvents();
        }

        function doRevokeAll2() {
            return runtime.service('session').getClient().revokeAllTokens()
                .then(function () {
                    runtime.service('session').getClient().removeSessionCookie();
                });
        }

        function doRevokeAll() {
            return Promise.all(vm.allTokens.value.map(function (token) {
                return runtime.service('session').getClient().revokeToken(token.id);
            }))
                .then(function () {
                    return render();
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
                            handler: doRevokeAll2
                        }),
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: 'Remove all of your sign-in sessions, including the current one, and log out of KBase'
                    }, 'Remove All and Logout')
                ])
            ]);
            events.attachEvents();
        }

        function renderAllTokens() {
            return runtime.service('session').getClient().getTokens()
                .then(function (result) {

                    renderInfo();

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

        function render() {
            return renderAllTokens()
                .then(function () {
                    BS.activateTooltips(container);
                });
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
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