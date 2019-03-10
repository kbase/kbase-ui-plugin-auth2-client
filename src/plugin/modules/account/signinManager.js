define([
    'bluebird',
    'kb_lib/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    'kb_common/format'
], (
    Promise,
    html,
    DomEvent,
    BS,
    Format
) => {
    'use strict';

    const
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

    class SigninManager {
        constructor({ runtime }) {
            this.runtime = runtime;

            this.hostNode = null;
            this.container = null;

            this.vm = {
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
        }

        bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        bindVm() {
            this.bindVmNode(this.vm.allTokens);
            this.bindVmNode(this.vm.currentToken);
            this.bindVmNode(this.vm.toolbar);
            this.bindVmNode(this.vm.intro);
        }

        renderLayout() {
            const tabs = BS.buildTabs({
                style: {
                    paddingTop: '10px'
                },
                tabs: [{
                    name: 'main',
                    label: 'Manage Your Sign-ins',
                    content: div({}, [
                        div({
                            id: this.vm.toolbar.id
                        }),
                        BS.buildPanel({
                            type: 'default',
                            class: 'kb-panel-light',
                            title: 'Your Current Sign-In',
                            body: div({
                                id: this.vm.currentToken.id
                            })
                        }),
                        BS.buildPanel({
                            type: 'default',
                            class: 'kb-panel-light',
                            title: 'Other Sign-In Sessions',
                            body: div({
                                id: this.vm.allTokens.id
                            })
                        }),
                    ])
                }, {
                    name: 'about',
                    icon: 'info-circle',
                    content: div({
                        id: this.vm.intro.id
                    })
                }]
            });

            this.container.innerHTML = div({
                style: {
                    marginTop: '10px'
                }
            }, tabs.content);
            this.bindVm();
        }

        renderInfo() {
            this.vm.intro.node.innerHTML = div({
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

        doRevokeToken(tokenId) {
            // Revoke
            return this.runtime.service('session').getClient().revokeToken(tokenId)
                .then(() => {
                    return this.render();
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });
        }

        doLogout() {
            // Revoke
            return this.runtime.service('session').getClient().logout()
                .then(() => {
                    // runtime.send('session', 'loggedout');
                    this.runtime.send('app', 'navigate', {
                        path: 'auth2/signedout'
                    });
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });
        }

        renderTokens() {
            const events = DomEvent.make({
                node: this.vm.allTokens.node
            });
            let revokeAllButton;
            if (this.vm.allTokens.value.length > 0) {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    id: events.addEvent({
                        type: 'click',
                        handler: this.doRevokeAll.bind(this)
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

            if (this.vm.allTokens.value.length === 0) {
                this.vm.allTokens.node.innerHTML = div({
                    style: {
                        fontStyle: 'italic',
                        textAlign: 'center'
                    }
                }, 'You do not have any additional active sign-ins.');
                return;
            }

            this.vm.allTokens.node.innerHTML = table({
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
            ].concat(this.vm.allTokens.value
                .sort((a, b) => {
                    return (a.created - b.created);
                })
                .map((token) => {
                    return tr([
                        td(Format.niceTime(token.created)),
                        td(Format.niceElapsedTime(token.expires)),
                        td((() => {
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
                        })()),
                        td((() => {
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
                        })()),
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
                                handler: () => {
                                    this.doRevokeToken(token.id);
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

        renderCurrentTokens(node, tokens) {
            const events = DomEvent.make({
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
            ].concat(tokens.map((token) => {
                return tr([
                    td(Format.niceElapsedTime(token.created) +
                            ' (' +
                            Format.niceTime(token.created) +
                            ')'),
                    td(Format.niceElapsedTime(token.expires)),
                    td((() => {
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
                    })()),
                    td((() => {
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
                    })()),
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
                                handler: () => {
                                    // doLogoutToken(token.id);
                                    this.doLogout();
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

        doRevokeAll2() {
            return this.runtime.service('session').getClient().revokeAllTokens()
                .then(() => {
                    this.runtime.service('session').getClient().removeSessionCookie();
                });
        }

        doRevokeAll() {
            return Promise.all(this.vm.allTokens.value.map((token) => {
                return this.runtime.service('session').getClient().revokeToken(token.id);
            }))
                .then(() => {
                    return this.render();
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });
        }

        renderToolbar() {
            const events = DomEvent.make({
                node: this.container
            });
            this.vm.toolbar.node.innerHTML = div({
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
                            handler: this.doRevokeAll2.bind(this)
                        }),
                        dataToggle: 'tooltip',
                        dataPlacement: 'left',
                        title: 'Remove all of your sign-in sessions, including the current one, and log out of KBase'
                    }, 'Remove All and Logout')
                ])
            ]);
            events.attachEvents();
        }

        renderAllTokens() {
            return this.runtime.service('session').getClient().getTokens()
                .then((result) => {

                    this.renderInfo();

                    this.renderToolbar();

                    // Render "current" token.
                    this.renderCurrentTokens(this.vm.currentToken.node, [result.current]);

                    // Render "other" tokens
                    this.vm.allTokens.value = result.tokens
                        .filter((token) => {
                            return (token.type === 'Login');
                        });

                    this.renderTokens();

                })
                .catch((err) => {
                    this.vm.allTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                });
        }

        render() {
            return this.renderAllTokens()
                .then(() => {
                    BS.activateTooltips(this.container);
                });
        }

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode.appendChild(document.createElement('div'));
            });
        }

        start() {
            return Promise.try(() => {
                this.renderLayout();
                return this.render();
            });
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            return Promise.try(() => {
                if (this.hostNode && this.container) {
                    this.hostNode.removeChild(this.container);
                    this.hostNode.innerHTML = '';
                }
            });
        }
    }

    return SigninManager;
});