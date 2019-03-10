define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_common_ts/Auth2Error',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils',
    './widgets/errorWidget',
    './lib/utils',
    './lib/format',
    './lib/countdownClock'
], function (
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    Auth2Error,
    Plugin,
    BS,
    ErrorWidget,
    Utils,
    Format,
    CountDownClock
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        b = t('b'),
        button = t('button'),
        a = t('a');

    function widget(config) {
        var hostNode, container, runtime = config.runtime,
            ui;

        // When we have a valid linking session, the linkId will be populated.
        var linkId;

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
            });
        }

        function showMessage(message) {
            var node = ui.getElement('message');
            node.innerHTML = BS.buildPanel({
                type: message.type,
                title: message.title,
                body: message.message
            });
        }

        var clock;

        function createTimer(container, response) {
            var timeOffset = runtime.service('session').getClient().serverTimeOffset();
            var clockId = html.genId();
            container.innerHTML = p([
                'You have ',
                span({ id: clockId }),
                ' until this linking session expires. After this, you will be returned to the linking tab.'
            ]);
            var clockNode = document.getElementById(clockId);

            function updateTimer(remainingTime) {
                clockNode.innerHTML = Format.niceDuration(remainingTime);
            }

            clock = new CountDownClock({
                tick: 1000,
                until: response.expires - timeOffset,
                // for: 5000,
                onTick: function (remaining) {
                    updateTimer(remaining);
                },
                onExpired: function () {
                    cancelLink(response.id)
                        .then(function () {
                            runtime.send('notification', 'notify', {
                                type: 'warning',
                                message: 'Your linking session timed out.'
                            });
                        });
                }
            });
            clock.start();
        }

        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div({
                            dataElement: 'introduction'
                        }),
                        div({
                            dataElement: 'timer'
                        }),
                        div({
                            dataElement: 'link'
                        }),
                        div({
                            dataElement: 'response'
                        }),
                        div({
                            dataElement: 'error'
                        }),
                        div({
                            dataElement: 'message'
                        })
                    ])
                ])
            ]);
        }

        function doLink(accountId) {
            return runtime.service('session').getClient().linkPick(accountId)
                .then(function () {
                    clock.stop();
                    runtime.send('app', 'navigate', {
                        path: 'auth2/account',
                        params: {
                            tab: 'links'
                        }
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function cancelLink(id) {
            return runtime.service('session').getClient().linkCancel(id)
                .catch(Auth2Error.AuthError, function (err) {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw (err);
                    }
                })
                .then(function () {
                    if (clock) {
                        clock.stop();
                    }
                    linkId = null;
                    runtime.send('app', 'navigate', {
                        path: 'auth2/account',
                        params: {
                            tab: 'links'
                        }
                    });
                })
                .catch(function (err) {
                    // TODO: display error
                    console.error('error', err);
                });
        }

        function renderLinkChoice(choiceData) {
            var node = ui.getElement('link');
            var events = DomEvent.make({
                node: container
            });
            var content = div({
                class: 'row'
            }, div({
                class: 'col-md-12'
            }, [
                div({}, div([
                    p([
                        'You have requested to link the ' + b(choiceData.provider) + ' account ' + b(choiceData.provusername),
                        ' to your KBase account ' + b(choiceData.user)
                    ])
                ])),
                div({}, [
                    button({
                        class: 'btn btn-primary',
                        type: 'button',
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doLink(choiceData.id);
                            }
                        })
                    }, 'Link ' + b(choiceData.provusername)),
                    button({
                        class: 'btn btn-default',
                        type: 'button',
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                cancelLink(choiceData.id);
                            }
                        }),
                        style: {
                            marginLeft: '10px'
                        }
                    }, 'Cancel &amp; Return to Links Page')
                ])
            ]));
            node.innerHTML = BS.buildPanel({
                title: 'Ready to Link',
                body: content
            });
            events.attachEvents();
        }

        function start() {
            // inProcessToken = params['in-process-login-token'];
            // var cookieManager = new M_Cookie.CookieManager();
            // inProcessToken = cookieManager.getItem('in-process-login-token');

            // Clean up window
            // if (window.history != undefined &&
            //     window.history.pushState != undefined &&
            //     window.location.search &&
            //     window.location.search.length > 0) {
            //     // if pushstate exists, add a new state the the history, this changes the url without
            //     // reloading the page
            //     var newUrl = new URL(window.location.href);
            //     var oldQuery = newUrl.search;
            //     var newHash = newUrl.hash + oldQuery;
            //     newUrl.search = '';
            //     newUrl.hash = newHash;
            //     window.history.pushState({}, document.title, newUrl.toString());
            // }


            return Promise.try(function () {
                runtime.send('ui', 'setTitle', 'Link to Sign-In Account');
                renderLayout();
                runtime.service('session').getClient().getLinkChoice()
                    .then(function (result) {
                        createTimer(ui.getElement('timer'), result);
                        linkId = result.id;
                        var currentUsername = runtime.service('session').getUsername();
                        if (result.canlink) {
                            renderLinkChoice(result);
                        } else {
                            // it is already linked.
                            if (result.linkeduser === currentUsername) {
                                var events = DomEvent.make({ node: container });
                                showMessage({
                                    type: 'danger',
                                    title: 'Sign-in account already linked',
                                    message: div([
                                        p([
                                            'Sorry, you have already linked your current KBase account ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, currentUsername),
                                            ' to this ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, result.provider),
                                            ' sign-in account ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, result.provusername)
                                        ]),
                                        p([
                                            'A sign-in account may only be linked once to any KBase account.'
                                        ]),
                                        p([
                                            'You may ',
                                            button({
                                                class: 'btn btn-default',
                                                type: 'button',
                                                id: events.addEvent({
                                                    type: 'click',
                                                    handler: function () {
                                                        cancelLink(result.id);
                                                    }
                                                }),
                                            }, 'return to the linking tab'),
                                            ' and start again, this time choosing a different sign-in account to link to.'
                                        ])
                                    ])
                                });
                                events.attachEvents();
                            } else {
                                showMessage({
                                    type: 'danger',
                                    title: 'Sign-in account already linked',
                                    message: div([
                                        p([
                                            'Sorry, you have already linked to this ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, result.provider),
                                            ' sign-in account ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, result.provusername),
                                            ' to the KBase account ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            }, result.linkeduser)
                                        ]),
                                        p([
                                            'A sign-in account may only be linked to one KBase account at a time.'
                                        ]),
                                        p([
                                            'You may ',
                                            a({
                                                href: '#auth2/account?tab=links'
                                            }, 'return to the linking tab'),
                                            ' and start again, this time choosing a different sign-in account to link to.'
                                        ])
                                    ])
                                });
                            }

                        }
                    })
                    .catch(function (err) {
                        // TODO: use the error component here.
                        switch (err.code) {
                        case '10010':
                            showMessage({
                                type: 'danger',
                                title: 'Link Session Expired',
                                message: div([
                                    p([
                                        'Sorry, your linking session has expired.'
                                    ]),
                                    p([
                                        'You may ',
                                        a({
                                            href: '#auth2/account?tab=links'
                                        }, 'return to the linking tab'),
                                        ' and try again.'
                                    ])
                                ])
                            });
                            break;
                        default:
                            return ErrorWidget.make({
                                runtime: runtime
                            })
                                .attach(ui.getElement('error'))
                                .then(function (w) {
                                    return w.start({
                                        error: err
                                    });
                                });
                        }
                    });
            });
        }

        function stop() {
            if (clock) {
                clock.stop();
            }
            if (linkId) {
                return runtime.service('session').getClient().linkCancel(linkId)
                    .catch(Auth2Error.AuthError, function (err) {
                        // just continue...
                        if (err.code === '10010') {
                            // simply continue
                        } else {
                            console.error('Error canceling link session', err);
                        }
                    });
            }
            return null;
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
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
            return widget(config);
        }
    };

});