define([
    'bluebird',
    'kb_lib/html',
    'kb_common/domEvent2',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    '../lib/format',
    '../lib/utils'
], (
    Promise,
    html,
    DomEvent,
    BS,
    Format,
    fmt,
    Utils
) => {
    'use strict';

    const // t = html.tagMaker(),
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

    class ServiceTokenManager {
        constructor({ runtime }) {
            this.runtime = runtime;

            this.hostNode = null;
            this.container = null;
            this.serverBias = null;

            this.utils = Utils.make({
                runtime: runtime
            });


            this.vm = {
                roles: {
                    value: null
                },
                alerts: {
                    id: html.genId(),
                    enabled: true,
                    value: false
                },
                addTokenForm: {
                    id: html.genId(),
                    enabled: true,
                    value: null
                },
                serviceTokens: {
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
        }

        bindVmNode(vmNode) {
            vmNode.node = document.getElementById(vmNode.id);
        }

        bindVm() {
            this.bindVmNode(this.vm.addTokenForm);
            this.bindVmNode(this.vm.alerts);
            this.bindVmNode(this.vm.newToken);
            this.bindVmNode(this.vm.serviceTokens);
        }

        timeRemaining(time) {
            const now = new Date().getTime();
            return time - (now + this.serverBias);
        }

        showAlert(type, message) {
            const alert = div({
                class: 'alert ' + 'alert-' + type,
                style: {
                    marginTop: '10px'
                },
                dataBind: 'css: messageType'
            }, [
                button({
                    type: 'button',
                    class: 'close',
                    dataDismiss: 'alert',
                    ariaLabel: 'Close'
                }, span({
                    ariaHidden: 'true'
                }, '&times;')),
                div({}, message)
            ]);
            const temp = document.createElement('div');
            temp.innerHTML = alert;
            this.vm.alerts.node.appendChild(temp);
        }

        renderLayout() {
            this.container.innerHTML = div({
                style: {
                    marginTop: '10px'
                }
            }, BS.buildTabs({
                tabs: [{
                    title: 'Manage Your Service Tokens',
                    body: [
                        BS.buildPanel({
                            classes: ['kb-panel-light'],
                            title: 'Add a New Service Token',
                            body: [
                                div({
                                    id: this.vm.alerts.id
                                }),
                                div({
                                    id: this.vm.addTokenForm.id,
                                    style: {
                                        marginBottom: '10px'
                                    }
                                }),
                                div({
                                    id: this.vm.newToken.id
                                })
                            ]
                        }),
                        BS.buildPanel({
                            classes: ['kb-panel-light'],
                            title: 'Your Active Service Tokens',
                            body: div({
                                id: this.vm.serviceTokens.id
                            })
                        })
                    ]
                }]
            }).content);
            this.bindVm();
        }

        niceDate(epoch) {
            return Format.niceTime(new Date(epoch));
        }

        doRevokeToken(tokenId, button) {
            button.disabled = true;
            return this.runtime.service('session').getClient().revokeToken(tokenId)
                .then(() => {
                    return this.render();
                })
                .catch((err) => {
                    button.disabled = false;
                    console.error('ERROR', err);
                });
        }

        renderNewToken() {
            const newToken = this.vm.newToken.value;
            const clockId = html.genId();
            const events = new DomEvent.make({
                node: this.vm.newToken.node
            });
            this.vm.newToken.node.innerHTML = div({
                class: 'well',
                style: {
                    marginTop: '10px'
                }
            }, [
                p('New ' + b(newToken.type) + ' token successfully created'),
                p('Please copy it to a secure location and remove this message'),
                p('This message will self-destruct in ' + span({ id: clockId }) + '.'),
                p([
                    'New Token: ',
                    span({
                        style: {
                            fontWeight: 'bold',
                            fontSize: '120%',
                            fontFamily: 'monospace'
                        }
                    }, newToken.token)
                ]),
                div(button({
                    type: 'button',
                    class: 'btn btn-danger',
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            this.clock.stop();
                            this.vm.newToken.node.innerHTML = '';
                        }
                    })
                }, 'Done'))
            ]);
            events.attachEvents();

            const CountDownClock = (countDownInSeconds, id) => {
                let countdown = countDownInSeconds * 1000;
                const node = document.getElementById(id);
                const startTime = new Date().getTime();
                let timer;
                if (!node) {
                    return;
                }

                const render = (timeLeft) => {
                    node.innerHTML = fmt.niceDuration(timeLeft);
                };

                const loop = () => {
                    timer = window.setTimeout(() => {
                        const now = new Date().getTime();
                        const elapsed = now - startTime;
                        render(countdown - elapsed);
                        if (elapsed < countdown) {
                            loop();
                        } else {
                            this.vm.newToken.node.innerHTML = '';
                        }
                    }, 500);
                };

                const stop = () => {
                    countdown = 0;
                    if (timer) {
                        window.clearTimeout(timer);
                    }
                };
                render();
                loop();
                return {
                    stop: stop
                };
            };
            this.clock = CountDownClock(300, clockId);
        }

        handleSubmitAddToken() {
            const name = this.vm.addTokenForm.node.querySelector('[name="name"]');

            const tokenName = name.value;
            if (tokenName.length === 0) {
                this.showAlert('danger', 'A token must have a non-zero length name');
                return;
            }

            this.runtime.service('session').getClient().createToken({
                name: name.value,
                type: 'service'
            })
                .then((result) => {
                    this.vm.newToken.value = result;
                    this.renderNewToken();
                    return this.render();
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });

        }

        renderAddTokenForm() {
            const events = DomEvent.make({
                node: this.vm.addTokenForm.node
            });
            this.vm.addTokenForm.node.innerHTML = form({
                class: 'form-inline',
                id: events.addEvent({
                    type: 'submit',
                    handler: (e) => {
                        e.preventDefault();
                        this.handleSubmitAddToken();
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

        renderServiceTokens() {
            const events = DomEvent.make({
                node: this.vm.serviceTokens.node
            });
            let revokeAllButton;
            if (this.vm.serviceTokens.value.length > 0) {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    id: events.addEvent({
                        type: 'click',
                        handler: this.doRevokeAll.bind(this)
                    })
                }, 'Revoke All');
            } else {
                revokeAllButton = button({
                    type: 'button',
                    class: 'btn btn-danger',
                    disabled: true
                }, 'Revoke All');
            }
            this.vm.serviceTokens.node.innerHTML = table({
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
            ].concat(this.vm.serviceTokens.value.map((token) => {
                return tr([
                    td(this.niceDate(token.created)),
                    // td(niceElapsed(token.expires)),
                    td(fmt.niceDuration(this.timeRemaining(token.expires), {
                        trimEnd: true
                    })),
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
                            handler: (e) => {
                                this.doRevokeToken(token.id, e.target);
                            }
                        })
                    }, 'Revoke'))
                ]);
            })));
            events.attachEvents();
        }

        doRevokeAll(e) {
            e.target.disabled = true;
            return Promise.all(this.vm.serviceTokens.value.map((token) => {
                return this.runtime.service('session').getClient().revokeToken(token.id);
            }))
                .then(() => {
                    return this.render();
                })
                .catch((err) => {
                    e.target.disabled = false;
                    console.error('ERROR', err);
                });
        }

        render() {
            return this.runtime.service('session').getClient().getTokens()
                .then((result) => {
                    this.vm.serviceTokens.value = result.tokens
                        .filter((token) => {
                            return (token.type === 'Service');
                        });
                    this.renderServiceTokens();
                    this.renderAddTokenForm();
                })
                .catch((err) => {
                    this.vm.serviceTokens.node.innerHTML = 'Sorry, error, look in console: ' + err.message;
                });
        }

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode.appendChild(document.createElement('div'));
            });
        }

        start() {
            return this.utils.getTimeBias()
                .then((bias) => {
                    this.serverBias = bias;
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

    return ServiceTokenManager;
});