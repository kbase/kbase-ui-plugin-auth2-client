define([
    'bluebird',
    'knockout',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Error',
    './lib/utilsKO',
    './widgets/errorWidget',
    './lib/policies',
    './lib/format',
    './lib/countdownClock',

    // loaded for effect
    'bootstrap'
], function (
    Promise,
    ko,
    html,
    DomEvents,
    BS,
    Plugin,
    HttpClient,
    Auth2,
    Auth2Error,
    Utils,
    ErrorWidget,
    Policies,
    Format,
    CountDownClock
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a');

    // glues a countdown clock into the vm and the ui.
    // function Clock(config) {
    //     var runtime = config.runtime;
    //     var clockVar = config.clock;
    //     var doneVar = config.done;
    //     var expires = config.expires;
    //     var clock;

    //     function start() {
    //         var timeOffset = runtime.service('session').getClient().serverTimeOffset();

    //         clock = CountDownClock({
    //             // until: expires - timeOffset,
    //             for: 60000,
    //             onTick: function (remaining) {
    //                 clockVar(remaining);
    //             },
    //             onExpired: function () {
    //                 doneVar(true);
    //             }
    //         });
    //         clock.start();
    //     }

    //     function stop() {
    //         clock.stop();
    //         clockVar(null);
    //     }

    //     return {
    //         start: start,
    //         stop: stop
    //     };
    // }

    function getStateParam(choice) {
        var q = {};
        if (choice.redirecturl) {
            var u = new URL(choice.redirecturl);
            var s = u.search;
            if (s.length > 1) {
                s = s.substr(1);
            }

            s.split('&').forEach(function (field) {
                var f = field.split('=').map(decodeURIComponent);
                q[f[0]] = f[1];
            });

            // we just expect a state param.
            if (q.state) {
                return JSON.parse(q.state);
            }
        }
        return q;
    }

    function factory(config) {
        var hostNode, container,
            mounts = {
                main: null,
                clock: null,
                error: null
            },
            runtime = config.runtime;
        var clock;

        function createClock(clockNode, expires) {
            var timeOffset = runtime.service('session').getClient().serverTimeOffset();

            function updateTimer(remainingTime) {
                clockNode.innerHTML = Format.niceDuration(remainingTime);
            }

            var clock = CountDownClock({
                tick: 1000,
                until: expires - timeOffset,
                // for: 600000,
                onTick: function (remaining) {
                    updateTimer(remaining);
                },
                onExpired: function () {
                    cancelLogin()
                        .then(function () {
                            runtime.send('notification', 'notify', {
                                type: 'warning',
                                message: 'Your sign-in session has expired.'
                            });
                        });
                }
            });
            clock.start();
            return clock;
        }

        function cancelLogin() {
            return runtime.service('session').getClient().loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw (err);
                    }
                })
                .then(function () {
                    runtime.send('app', 'navigate', {
                        path: 'login'
                    });
                })
                .catch(function (err) {
                    console.error('error', err);
                });
        }

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                var id = html.genId();
                var errorId = html.genId();
                var clockId = html.genId();
                var layout = div({
                    class: 'container-fluid'
                }, [
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-sm-10 col-sm-offset-1'
                        }, [
                            div({
                                id: clockId,
                                style: {
                                    marginBottom: '10px'
                                }
                            }),
                            div({
                                id: id
                            }),
                            div({
                                id: errorId
                            })
                        ])
                    ])
                ]);
                container = hostNode.appendChild(document.createElement('div'));
                container.innerHTML = layout;
                mounts.main = document.getElementById(id);
                mounts.clock = document.getElementById(clockId);
                mounts.error = document.getElementById(errorId);
                // renderLayout();
            });
        }

        function doSignIn(choice, nextRequest) {
            return runtime.service('session').getClient().loginPick({
                    identityId: choice.login[0].id,
                    linkAll: false,
                    agreements: []
                })
                .then(function () {
                    if (nextRequest !== null) {
                        try {
                            runtime.send('app', 'navigate', nextRequest);
                        } catch (ex) {
                            console.error('ERROR parsing next request', nextRequest, ex);
                            runtime.send('app', 'navigate', '');
                        }
                    } else {
                        runtime.send('app', 'navigate', runtime.config('ui.defaults.loginPath', 'dashboard'));
                    }
                })
                .catch(function (err) {
                    console.error('Error', err);
                    // showError(err);
                });
        }

        function start(params) {
            // if we landed here and are already logged in, simply redirect to the dashboard.
            // TODO: honor nextrequest
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }

            runtime.send('ui', 'setTitle', 'KBase Sign-In');
            return runtime.service('session').getClient().getClient().getLoginChoice()
                .then(function (choice) {
                    var stateParams = getStateParam(choice);

                    if (stateParams.origin === 'signup') {
                        runtime.send('app', 'navigate', {
                            path: ['signup']
                        });
                        return null;
                    }

                    var policies = Policies.make({
                        runtime: runtime
                    });

                    return policies.start()
                        .then(function () {
                            if (choice.login && choice.login.length === 1) {
                                return policies.evaluatePolicies(choice.login[0].policyids);
                            } else if (choice.create && choice.create.length === 1) {
                                // just pass empty policy ids, since this user has none yet.
                                return policies.evaluatePolicies([]);
                            } else {
                                // should never gethere.
                                throw new Error('Neither login nor signup available for this sign-up account');
                            }
                        })
                        .then(function (policiesToResolve) {
                            var step;
                            // comes in as "nextrequest" all lower case, but known otherwise
                            // as "nextRequest", camelCase
                            // if (params.nextrequest) {
                            //     nextRequest = JSON.parse(params.nextrequest);
                            // } else {
                            //     nextRequest = '';
                            // }

                            // If no policies to resolve and google auth provider then just
                            // auto-signin.
                            if (policiesToResolve.missing.length === 0 &&
                                policiesToResolve.outdated.length === 0 &&
                                choice.provider === 'Google') {
                                return doSignIn(choice, stateParams.nextrequest);
                            }

                            // Countdown clock, knockout style.
                            // mounts.clock.innerHTML = div({
                            //     dataBind: {
                            //         if: 'clockTime'
                            //     },
                            //     style: {
                            //         textAlign: 'right',
                            //     }
                            // }, p({
                            //     style: {
                            //         display: 'inline-block',
                            //         padding: '6px',
                            //         backgroundColor: '#999',
                            //         color: '#FFF'
                            //     }
                            // }, [
                            //     'You have ',
                            //     span({
                            //         dataBind: {
                            //             text: 'clockDisplay'
                            //         },
                            //         style: {
                            //             fontWeight: 'bold'
                            //         }
                            //     }),
                            //     ' to complete the signin process.'
                            // ]));
                            // var clockVm = (function () {
                            //     var clockTime = ko.observable();
                            //     var clockDisplay = ko.pureComputed(function () {
                            //         if (typeof clockTime() === 'number') {
                            //             return Format.niceDuration(clockTime());
                            //         } else {
                            //             return '';
                            //         }
                            //     });
                            //     var expired = ko.observable();
                            //     expired.subscribe(function (newExpired) {
                            //         if (newExpired) {
                            //             clock.stop();
                            //             cancelLogin();
                            //         }
                            //     });
                            //     clock = Clock({
                            //         runtime: runtime,
                            //         expires: choice.expires,
                            //         clock: clockTime,
                            //         done: expired
                            //     });
                            //     return {
                            //         clockTime: clockTime,
                            //         clockDisplay: clockDisplay,
                            //         expired: expired,
                            //         clock: clock
                            //     };
                            // }());
                            // ko.applyBindings(clockVm, mounts.clock);
                            // clockVm.clock.start();

                            clock = (function (container, expires) {
                                var clockId = html.genId();
                                container.innerHTML = div({
                                    dataBind: {
                                        if: 'clockTime'
                                    },
                                    style: {
                                        textAlign: 'right',
                                    }
                                }, div({
                                    style: {
                                        display: 'inline-block',
                                        padding: '6px',
                                        backgroundColor: '#999',
                                        color: '#FFF'
                                    }
                                }, [
                                    div(['You have ',
                                        span({
                                            id: clockId,
                                            style: {
                                                fontWeight: 'bold'
                                            }
                                        }),
                                        ' to complete the signin process.'
                                    ]),
                                    div('After this you will be returned to the sign-in page.')
                                ]));
                                return createClock(document.getElementById(clockId), expires);
                            }(mounts.clock, choice.expires));

                            // Called by child components if they have either finished or cancelled
                            // the login choice session.

                            var done = ko.observable(false);

                            done.subscribe(function (newDone) {
                                if (newDone) {
                                    if (clock) {
                                        clock.stop();
                                        mounts.clock.innerHTML = '';
                                    }
                                }
                            });

                            mounts.main.innerHTML = div({
                                dataBind: {
                                    component: {
                                        name: '"signin-view"',
                                        params: {
                                            runtime: 'runtime',
                                            requestedStep: 'step',
                                            nextRequest: 'nextRequest',
                                            choice: 'choice',
                                            source: '"signin"',
                                            policiesToResolve: 'policiesToResolve',
                                            done: 'done'
                                        }
                                    }
                                }
                            });
                            var viewModel = {
                                runtime: config.runtime,
                                step: step,
                                nextRequest: stateParams.nextrequest,
                                choice: choice,
                                policiesToResolve: policiesToResolve,
                                done: done
                            };
                            ko.applyBindings(viewModel, mounts.main);
                        });
                })
                .catch(Auth2Error.AuthError, function (err) {
                    // transform error message
                    var nextErr;
                    switch (err.code) {
                    case '10010':
                        nextErr = {
                            code: 'no-signin-session',
                            message: 'No sign-in session present',
                            detail: div([
                                p([
                                    'A sign-in session was not found. ',
                                    'This may be due to the expiration of the sign-in or sign-up session, ',
                                    'which is valid for 30 minutes. ',
                                    'Or it may be because you have visited this path from your browser ',
                                    'history.'
                                ]),
                                p([
                                    'If you wish to sign-in or sign-up, please revisit the ',
                                    a({
                                        href: '#login'
                                    }, 'sign in page'),
                                    '.'
                                ])
                            ]),
                            data: err.data
                        };
                        break;
                    default:
                        nextErr = err;
                    }

                    // This is most likely due to an expired token.
                    // When token expiration detection is implemented, we should rarely see this.
                    var viewModel = {
                        code: nextErr.code,
                        message: nextErr.message,
                        detail: nextErr.detail,
                        data: nextErr.data
                    };
                    mounts.error.innerHTML = div({
                        dataBind: {
                            component: {
                                name: '"error-view"',
                                params: {
                                    code: 'code',
                                    message: 'message',
                                    detail: 'detail',
                                    data: 'data'
                                }
                            }
                        }
                    });
                    ko.applyBindings(viewModel, mounts.error);
                })

            .catch(function (err) {
                var viewModel = {
                    code: err.code,
                    message: err.message,
                    detail: err.detail || '',
                    data: ko.observable(err.data || {})
                };
                mounts.error.innerHTML = div({
                    dataBind: {
                        component: {
                            name: '"error-view"',
                            params: {
                                code: 'code',
                                message: 'message',
                                detail: 'detail',
                                data: 'data'
                            }
                        }
                    }
                });
                ko.applyBindings(viewModel, mounts.error);
            });
        }

        function stop() {
            return Promise.try(function () {
                if (clock) {
                    clock.stop();
                }
            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
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