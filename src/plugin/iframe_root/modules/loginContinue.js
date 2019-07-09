define([
    'bluebird',
    'knockout',
    'kb_knockout/lib/subscriptionManager',
    'kb_lib/html',
    'kb_common_ts/Auth2Error',
    './lib/policies',
    './lib/format',
    './lib/countdownClock',
    './lib/provider',
    './components/errorView',
    './components/signinView',
    'kb_common_ts/Auth2',
    // loaded for effect
    'bootstrap'
], function (
    Promise,
    ko,
    SubscriptionManager,
    html,
    Auth2Error,
    Policies,
    Format,
    CountDownClock,
    provider,
    ErrorViewComponent,
    SigninViewComponent,
    auth2
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a');

    function Query(search) {
        var query = {};
        search.split('&').forEach(function (field) {
            var parts = field.split('=');
            var key = decodeURIComponent(parts[0]);
            var value = decodeURIComponent(parts[1]);
            query[key] = value;
        });
        return query;
    }

    function URL(url) {
        if (typeof url !== 'string') {
            throw new TypeError('Incoming url must be a string, is ' + typeof url);
        }
        var scheme, host, path, search, hash, query;
        // get scheme
        var fullUrl = /^(?:(http[s]*):\/\/)([^/?#]*)(?:(.*))?/.exec(url);
        var schemaLess;
        if (fullUrl) {
            // Either host + path or just host.
            scheme = fullUrl[1];
            host = fullUrl[2];
            schemaLess = fullUrl[3] || '';
        } else {
            // If it has no schema, it is a url relative to the
            // current origin.
            // TODO: add that in here?
            schemaLess = url;
        }

        var theRest = /^(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?/.exec(schemaLess);

        path = theRest[1];
        search = theRest[2];
        hash = theRest[3];
        if (search) {
            query = Query(search);
        }

        return {
            scheme: scheme,
            host: host,
            path: path,
            search: search,
            query: query,
            hash: hash
        };
    }

    function getStateParam(choice) {
        if (choice.redirecturl) {
            try {
                var u = URL(choice.redirecturl);

                // we just expect a state param.
                if (u.query && u.query.state) {
                    return JSON.parse(u.query.state);
                }
            } catch (ex) {
                console.warn('Error parsing state in redirect url', ex);
                return {};
            }
        } else {
            return {};
        }
    }

    function factory(config) {
        var hostNode,
            container,
            mounts = {
                main: null,
                clock: null,
                error: null
            },
            runtime = config.runtime,
            serverTimeOffset;
        var clock;
        var koSubscriptions = new SubscriptionManager();

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        // const currentUserToken = runtime.service('session').getAuthToken();

        function createClock(clockNode, expires) {
            // var timeOffset = auth2Client.serverTimeOffset();

            function updateTimer(remainingTime) {
                clockNode.innerHTML = Format.niceDuration(remainingTime);
            }

            var clock = new CountDownClock({
                tick: 1000,
                until: expires - serverTimeOffset,
                // for: 600000,
                onTick: function (remaining) {
                    updateTimer(remaining);
                },
                onExpired: function () {
                    cancelLogin().then(function () {
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
            return auth2Client
                .loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw err;
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
                var layout = div(
                    {
                        class: 'container-fluid'
                    },
                    [
                        div(
                            {
                                class: 'row'
                            },
                            [
                                div(
                                    {
                                        class: 'col-sm-10 col-sm-offset-1'
                                    },
                                    [
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
                                    ]
                                )
                            ]
                        )
                    ]
                );
                container = hostNode.appendChild(document.createElement('div'));
                container.innerHTML = layout;
                mounts.main = document.getElementById(id);
                mounts.clock = document.getElementById(clockId);
                mounts.error = document.getElementById(errorId);
                // renderLayout();
            });
        }

        function doSignIn(choice, nextRequest) {
            return auth2Client
                .loginPick({
                    identityId: choice.login[0].id,
                    linkAll: false,
                    agreements: []
                })
                .then(function (pickResult) {
                    // runtime.send('app', 'auth', runtime.service('session').getAuthToken(), nextRequest);
                    if (nextRequest !== null) {
                        try {
                            // since the plugin is operating inside of the iframe, it needs
                            // to send the token with the navigation path so the parent
                            // window can also set the cookie.
                            runtime.send('app', 'auth-navigate', {
                                nextRequest,
                                tokenInfo: pickResult.token
                            });
                        } catch (ex) {
                            console.error('[doSignIn] ERROR parsing next request', nextRequest, ex);
                            runtime.send('app', 'navigate', '');
                        }
                    } else {
                        const defaultPath = runtime.config('ui.defaults.loginPath', 'dashboard');
                        console.log('navigating...', defaultPath);
                        runtime.send('app', 'auth-navigate', {
                            nextRequest: defaultPath,
                            tokenInfo: pickResult.token
                        });
                    }
                })
                .catch(function (err) {
                    console.error('Error', err);
                    // showError(err);
                });
        }

        function start() {
            // if we landed here and are already logged in, simply redirect to the dashboard.
            // TODO: honor nextrequest
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }

            var providers = new provider.Providers({ runtime: runtime }).get();

            var providersMap = providers.reduce((providersMap, provider) => {
                providersMap[provider.id] = provider;
                return providersMap;
            }, {});

            runtime.send('ui', 'setTitle', 'KBase Sign-In');
            return auth2Client
                .root()
                .then((root) => {
                    serverTimeOffset = new Date().getTime() - root.servertime;
                    return auth2Client.getLoginChoice();
                })
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

                    return policies
                        .start()
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

                            var provider = providersMap[choice.provider];

                            // If no policies to resolve and auth provider does not require signin
                            // confirmation, then just auto-signin.
                            if (
                                policiesToResolve.missing.length === 0 &&
                                policiesToResolve.outdated.length === 0 &&
                                !provider.confirmSignin
                            ) {
                                return doSignIn(choice, stateParams.nextrequest);
                            }
                            clock = (function (container, expires) {
                                var clockId = html.genId();
                                container.innerHTML = div(
                                    {
                                        dataBind: {
                                            if: 'clockTime'
                                        },
                                        style: {
                                            textAlign: 'right'
                                        }
                                    },
                                    div(
                                        {
                                            style: {
                                                display: 'inline-block',
                                                padding: '6px',
                                                backgroundColor: '#999',
                                                color: '#FFF'
                                            }
                                        },
                                        [
                                            div([
                                                'You have ',
                                                span({
                                                    id: clockId,
                                                    style: {
                                                        fontWeight: 'bold'
                                                    }
                                                }),
                                                ' to complete the signin process.'
                                            ]),
                                            div('After this you will be returned to the sign-in page.')
                                        ]
                                    )
                                );
                                return createClock(document.getElementById(clockId), expires);
                            })(mounts.clock, choice.expires);

                            // Called by child components if they have either finished or cancelled
                            // the login choice session.

                            var done = ko.observable(false);

                            koSubscriptions.add(
                                done.subscribe(function (newDone) {
                                    if (newDone) {
                                        if (clock) {
                                            clock.stop();
                                            mounts.clock.innerHTML = '';
                                        }
                                    }
                                })
                            );

                            mounts.main.innerHTML = div({
                                dataBind: {
                                    component: {
                                        name: SigninViewComponent.quotedName(),
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
                                    a(
                                        {
                                            href: '#login'
                                        },
                                        'sign in page'
                                    ),
                                    '.'
                                ])
                            ]),
                            data: err.data
                        };
                        break;
                    default:
                        nextErr = err;
                    }
                    console.error('Auth Error', err);
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
                                name: ErrorViewComponent.quotedName(),
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
                    console.error('Error', err);
                    var viewModel = {
                        code: err.code,
                        message: err.message,
                        detail: err.detail || '',
                        data: ko.observable(err.data || {})
                    };
                    mounts.error.innerHTML = div({
                        dataBind: {
                            component: {
                                name: ErrorViewComponent.quotedName(),
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
                koSubscriptions.dispose();
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
