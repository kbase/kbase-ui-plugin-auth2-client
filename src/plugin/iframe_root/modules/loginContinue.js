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
    'lib/domUtils',
    // loaded for effect
    'bootstrap'
], (
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
    auth2,
    {setInnerHTML, clearInnerHTML}
) => {
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        a = t('a');

    class UIError extends Error {
        constructor({code, message, detail, data}) {
            super(message);
            this.code = code;
            this.detail = detail;
            this.data = data;
        }
    }

    function Query(search) {
        const query = {};
        search.split('&').forEach((field) => {
            const parts = field.split('=');
            const key = decodeURIComponent(parts[0]);
            const value = decodeURIComponent(parts[1]);
            query[key] = value;
        });
        return query;
    }

    function URL(url) {
        if (typeof url !== 'string') {
            throw new TypeError(`Incoming url must be a string, is ${  typeof url}`);
        }
        let scheme, host, query;
        // get scheme
        const fullUrl = /^(?:(http[s]*):\/\/)([^/?#]*)(?:(.*))?/.exec(url);
        let schemaLess;
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

        const theRest = /^(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?/.exec(schemaLess);

        const path = theRest[1];
        const search = theRest[2];
        const hash = theRest[3];
        if (search) {
            query = Query(search);
        }

        return {
            scheme,
            host,
            path,
            search,
            query,
            hash
        };
    }

    function getStateParam(choice) {
        if (choice.redirecturl) {
            let url;
            try {
                url = URL(choice.redirecturl);
            } catch (ex) {
                throw new UIError({
                    code: 'parse-error',
                    message: 'Error parsing redirecturl',
                    detail: div([
                        p('This is an error parsing the redirecturl in choice.redirecturl'),
                        p(['The original error message is: ', ex.message])
                    ]),
                    data: {
                        choice
                    }
                });
            }

            // we just expect a state param.
            if (url.query && url.query.state) {
                try {
                    return JSON.parse(url.query.state);
                } catch (ex) {
                    console.error('Error parsing state in redirect url', ex);
                    throw new UIError({
                        code: 'parse-error',
                        message: 'Error parsing state in redirect url',
                        detail: div([
                            p('This is an error parsing the KBase auth flow.'),
                            p([
                                'The choice object should have a property named "redirecturl" which ',
                                'should be a valid url with a query param named "state", which is in JSON format.'
                            ]),
                            p(['The original error message is: ', ex.message])
                        ]),
                        data: {
                            choice
                        }
                    });
                }
            }
            throw new UIError({
                code: 'missing-state',
                message: 'State query parameter missing from choice.redirecturl',
                detail: div([
                    p('This is an error using the KBase auth flow.'),
                    p([
                        'The choice object should have a property named "redirecturl" which ',
                        'should be a valid url with a query param named "state", which is in JSON format.'
                    ])
                ]),
                data: {
                    choice
                }
            });
        } else {
            throw new UIError({
                code: 'parse-error',
                message: 'Redirect url is missing or falsy.',
                // data: null,
                detail: div([
                    p('This is an error using the KBase auth flow.'),
                    p(
                        'The choice object should have a property named "redirecturl", but it is either missing or falsy.'
                    )
                ]),
                data: {
                    choice
                }
            });
        }
    }

    function factory(config) {
        let hostNode;
        let container;
        const mounts = {
            main: null,
            clock: null,
            error: null
        };
        const runtime = config.runtime;
        let serverTimeOffset;
        let clock;
        const koSubscriptions = new SubscriptionManager();

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        // const currentUserToken = runtime.service('session').getAuthToken();

        function createClock(clockNode, expires) {
            // var timeOffset = auth2Client.serverTimeOffset();

            function updateTimer(remainingTime) {
                // xss safe
                setInnerHTML(clockNode, Format.niceDuration(remainingTime));
            }

            const clock = new CountDownClock({
                tick: 1000,
                until: expires - serverTimeOffset,
                // for: 600000,
                onTick(remaining) {
                    updateTimer(remaining);
                },
                onExpired() {
                    cancelLogin().then(() => {
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
                .catch(Auth2Error.AuthError, (err) => {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw err;
                    }
                })
                .then(() => {
                    runtime.send('app', 'navigate', {
                        path: 'login'
                    });
                })
                .catch((err) => {
                    console.error('error', err);
                });
        }

        // LIFECYCLE API

        function attach(node) {
            return Promise.try(() => {
                hostNode = node;
                const id = html.genId();
                const errorId = html.genId();
                const clockId = html.genId();
                const layout = div(
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
                                            id
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

                setInnerHTML(container, layout);
                mounts.main = document.getElementById(id);
                mounts.clock = document.getElementById(clockId);
                mounts.error = document.getElementById(errorId);
            });
        }

        function doSignIn(choice, nextRequest) {
            return auth2Client
                .loginPick({
                    identityId: choice.login[0].id,
                    linkAll: false,
                    agreements: []
                })
                .then((pickResult) => {
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
                        runtime.send('app', 'auth-navigate', {
                            nextRequest: defaultPath,
                            tokenInfo: pickResult.token
                        });
                    }
                })
                .catch((err) => {
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

            const providers = new provider.Providers({runtime}).get();

            const providersMap = providers.reduce((providersMap, provider) => {
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
                .then((choice) => {
                    const stateParams = getStateParam(choice);

                    if (stateParams.origin === 'signup') {
                        const params = {};
                        // The next request is pulled out of the state param.
                        // It needs to be turned back into a JSON string in order to
                        // pass it as a query param value.
                        if (stateParams.nextrequest) {
                            params.nextrequest = JSON.stringify(stateParams.nextrequest);
                        }
                        runtime.send('app', 'navigate', {
                            path: ['signup'],
                            params
                        });
                        return null;
                    }

                    const policies = Policies.make({
                        runtime
                    });

                    return policies
                        .start()
                        .then(() => {
                            if (choice.login && choice.login.length === 1) {
                                return policies.evaluatePolicies(choice.login[0].policyids);
                            } else if (choice.create && choice.create.length === 1) {
                                // just pass empty policy ids, since this user has none yet.
                                return policies.evaluatePolicies([]);
                            }
                            // should never gethere.
                            throw new Error('Neither login nor signup available for this sign-up account');

                        })
                        .then((policiesToResolve) => {
                            let step;

                            const provider = providersMap[choice.provider];

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
                                const clockId = html.genId();
                                setInnerHTML(container, div(
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
                                ));
                                return createClock(document.getElementById(clockId), expires);
                            })(mounts.clock, choice.expires);

                            // Called by child components if they have either finished or cancelled
                            // the login choice session.

                            const done = ko.observable(false);

                            koSubscriptions.add(
                                done.subscribe((newDone) => {
                                    if (newDone) {
                                        if (clock) {
                                            clock.stop();
                                            clearInnerHTML(mounts.clock);
                                        }
                                    }
                                })
                            );

                            // xss safe
                            setInnerHTML(mounts.main,  div({
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
                            }));
                            const viewModel = {
                                runtime: config.runtime,
                                step,
                                nextRequest: stateParams.nextrequest,
                                choice,
                                policiesToResolve,
                                done
                            };
                            ko.applyBindings(viewModel, mounts.main);
                        });
                })
                .catch(Auth2Error.AuthError, (err) => {
                    // transform error message
                    let nextErr;
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
                                            href: '/#login'
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
                    const viewModel = {
                        code: nextErr.code,
                        message: nextErr.message,
                        detail: nextErr.detail,
                        data: nextErr.data
                    };
                    // xss safe
                    setInnerHTML(mounts.error, div({
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
                    }));
                    ko.applyBindings(viewModel, mounts.error);
                })
                .catch((err) => {
                    console.error('Error', err);
                    const viewModel = {
                        code: err.code || 'n/a',
                        message: err.message,
                        detail: err.detail || 'n/a',
                        data: err.data || null
                    };
                    setInnerHTML(mounts.error, div({
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
                    }));
                    ko.applyBindings(viewModel, mounts.error);
                });
        }

        function stop() {
            return Promise.try(() => {
                koSubscriptions.dispose();
                if (clock) {
                    clock.stop();
                }
            });
        }

        function detach() {
            return Promise.try(() => {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return {
            attach,
            start,
            stop,
            detach
        };
    }

    return {
        make(config) {
            return factory(config);
        }
    };
});
