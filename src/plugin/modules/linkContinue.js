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
    './lib/format'
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
    Format
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        b = t('b'),
        button = t('button'),
        a = t('a'),
        h1 = t('h1');

    function widget(config) {
        var hostNode, container, runtime = config.runtime,
            events, ui,
            // passed in the params to invoke this endpoint
            inProcessToken,
            // obtained via the login/choice call
            redirectUrl;

        var vm = Utils.ViewModel({
            model: {
                error: {
                    id: html.genId(),
                    title: {
                        id: html.genId()
                    },
                    message: {
                        id: html.genId()
                    },
                    detail: {
                        id: html.genId()
                    }
                }
            }
        });

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                events = DomEvent.make(container);
                ui = UI.make({
                    node: container
                });
            });
        }

        // function getElement(node, name) {
        //     return node.querySelector('[data-element="' + name + '"]');
        // }

        // function hideError() {
        //     var node = container.querySelector('[data-element="error"]');
        //     node.classList.add('hidden');
        // }

        function setContent(id, selector, content) {
            document.getElementById(id).querySelector(selector).innerHTML = content;
        }

        // function renderError() {
        //     var node = ui.getElement('error');
        // }

        // function showError(error) {
        //     var node = ui.getElement('error');
        //     node.classList.remove('hidden');
        //     setContent(vm.error.id, '[data-element="title"]', error.code);
        //     setContent(vm.error.message.id, '[data-element="body"]', error.message);
        //     setContent(vm.error.detail.id, '[data-element="body"]', error.detail);
        // }

        function hideResponse(response) {
            var node = container.querySelector('[data-element="response"]');
            node.classList.add('hidden');
            node.innerHTML = BS.buildPresentableJson(response);
        }

        function showResponse(response) {
            var node = container.querySelector('[data-element="response"]');
            node.classList.remove('hidden');
            node.innerHTML = BS.buildPresentableJson(response);
        }

        function showMessage(message) {
            var node = ui.getElement('message');
            node.innerHTML = BS.buildPanel({
                type: message.type,
                title: message.title,
                body: message.message
            });
        }


        function CountDownClock(config) {
            var targetTime;
            // Either countdown until a specific time ...
            if (config.until) {
                targetTime = config.until;
                // ... or for a quantity of time.
            } else if (config.for) {
                targetTime = new Date().getTime() + config.for;
            }
            // var startTime;
            var tick = config.tick || 1000;
            var onTick = config.onTick;
            var onExpired = config.onExpired;
            var timer;

            function start() {
                // startTime = new Date().getTime();

                function runAgain() {
                    timer = window.setTimeout(function () {
                        if (!timer) {
                            return;
                        }
                        var now = new Date().getTime();
                        var remaining = targetTime - now;

                        try {
                            onTick(remaining);
                        } catch (ex) {
                            console.error('clock onRun: ' + ex.message);
                        }
                        if (remaining > 0) {
                            runAgain();
                        } else {
                            onExpired();
                        }
                    }, tick);
                }
                runAgain();
            }

            function stop() {
                timer = null;
            }

            return {
                start: start,
                stop: stop
            };
        }


        var clock;

        function createTimer(response) {
            var node = ui.getElement('timer');
            node.innerHTML = p([
                'You have ',
                span({ dataElement: 'clock' }),
                ' until this linking session expires. After this, you will be returned to the linking tab.'
            ]);

            clock = CountDownClock({
                tick: 1000,
                // until: response.expires - timeOffset,
                for: 5000,
                onTick: function (remaining) {
                    updateTimer(remaining);
                },
                onExpired: function () {
                    cancelLink(response.id)
                        .then(function () {
                            runtime.send('notification', 'notify', {
                                type: 'warn',
                                message: 'Your linking session timed out.'
                            });
                        });
                }
            });
            clock.start();
        }

        function updateTimer(remainingTime) {
            var node = ui.getElement('timer.clock');
            node.innerHTML = Format.niceDuration(remainingTime);
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
                    runtime.send('app', 'navigate', {
                        path: 'auth2/account',
                        params: {
                            tab: 'links'
                        }
                    });
                })
                .catch(function (err) {
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

        function start(params) {
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
                // var events = DomEvent.make({
                //     node: container
                // });
                runtime.send('ui', 'setTitle', 'Link to Sign-In Account');
                renderLayout();
                runtime.service('session').getClient().getLinkChoice()
                    .then(function (result) {
                        createTimer(result);
                        if (result.canlink) {
                            renderLinkChoice(result);
                        } else {
                            // it is already linked.
                            if (result.linkeduser === runtime.service('session').getUsername()) {
                                var events = DomEvent.make({ node: container });
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

                                            // a({
                                            //     href: '#auth2/account?tab=links'
                                            // }, 'return to the linking tab'),
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
                                }).attach(ui.getElement('error'))
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