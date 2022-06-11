define([
    'bluebird',
    'dompurify',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    'kb_common/bootstrapUtils',
    './widgets/errorWidget',
    './lib/format',
    './lib/countdownClock',
    'lib/domUtils'
], (Promise, DOMPurify, html, DomEvent, UI, Auth2Error, auth2, BS, ErrorWidget, Format, CountDownClock, {setInnerHTML}) => {
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        b = t('b'),
        button = t('button'),
        a = t('a');

    function widget(config) {
        let hostNode,
            container;
        const runtime = config.runtime;
        let ui;

        // When we have a valid linking session, the linkId will be populated.
        let linkId;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        const currentUserToken = runtime.service('session').getAuthToken();

        // API

        function attach(node) {
            return Promise.try(() => {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
            });
        }

        function showMessage(message) {
            setInnerHTML(ui.getElement('message'), BS.buildPanel({
                type: message.type,
                title: message.title,
                body: message.message
            }));
        }

        let clock;

        function createTimer(container, response) {
            const timeOffset = runtime.service('session').serverTimeOffset();
            const clockId = html.genId();
            // xss safe
            setInnerHTML(container, p([
                'You have ',
                span({id: clockId}),
                ' until this linking session expires. After this, you will be returned to the linking tab.'
            ]));
            const clockNode = document.getElementById(clockId);

            function updateTimer(remainingTime) {
                // xss safe
                setInnerHTML(clockNode, Format.niceDuration(remainingTime));
            }

            clock = new CountDownClock({
                tick: 1000,
                until: response.expires - timeOffset,
                // for: 5000,
                onTick(remaining) {
                    updateTimer(remaining);
                },
                onExpired() {
                    cancelLink(response.id).then(() => {
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
            // xss safe
            setInnerHTML(container, div(
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
                                    class: 'col-md-12'
                                },
                                [
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
                                ]
                            )
                        ]
                    )
                ]
            ));
        }

        function doLink(accountId) {
            return auth2Client
                .linkPick(currentUserToken, accountId)
                .then(() => {
                    clock.stop();
                    runtime.send('app', 'navigate', {
                        path: 'auth2/account',
                        params: {
                            tab: 'links'
                        }
                    });
                })
                .catch((err) => {
                    console.error('ERROR', err);
                });
        }

        function cancelLink(id) {
            return auth2Client
                .linkCancel(id)
                .catch(Auth2Error.AuthError, (err) => {
                    // just continue...
                    if (err.code === '10010') {
                        // simply continue
                    } else {
                        throw err;
                    }
                })
                .then(() => {
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
                .catch((err) => {
                    // TODO: display error
                    console.error('error', err);
                });
        }

        function renderLinkChoice(choiceData) {
            const node = ui.getElement('link');
            const events = DomEvent.make({
                node: container
            });
            const content = div(
                {
                    class: 'row'
                },
                div(
                    {
                        class: 'col-md-12'
                    },
                    [
                        div(
                            {},
                            div([
                                p([
                                    `You have requested to link the ${
                                        b(choiceData.provider)
                                    } account ${
                                        b(choiceData.provusername)}`,
                                    ` to your KBase account ${  b(choiceData.user)}`
                                ])
                            ])
                        ),
                        div({}, [
                            button(
                                {
                                    class: 'btn btn-primary',
                                    type: 'button',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler() {
                                            doLink(choiceData.id);
                                        }
                                    })
                                },
                                `Link ${  b(choiceData.provusername)}`
                            ),
                            button(
                                {
                                    class: 'btn btn-default',
                                    type: 'button',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler() {
                                            cancelLink(choiceData.id);
                                        }
                                    }),
                                    style: {
                                        marginLeft: '10px'
                                    }
                                },
                                'Cancel &amp; Return to Links Page'
                            )
                        ])
                    ]
                )
            );
            // xss safe
            setInnerHTML(node, BS.buildPanel({
                title: 'Ready to Link',
                body: content
            }));
            events.attachEvents();
        }

        function start() {
            return Promise.try(() => {
                runtime.send('ui', 'setTitle', 'Link to Sign-In Account');
                renderLayout();
                auth2Client
                    .getLinkChoice(currentUserToken)
                    .then((result) => {
                        createTimer(ui.getElement('timer'), result);
                        linkId = result.id;
                        const currentUsername = runtime.service('session').getUsername();
                        if (result.canlink) {
                            renderLinkChoice(result);
                        } else  if (result.linkeduser === currentUsername) {
                            const events = DomEvent.make({node: container});
                            showMessage({
                                type: 'danger',
                                title: 'Sign-in account already linked',
                                message: div([
                                    p([
                                        'Sorry, you have already linked your current KBase account ',
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            currentUsername
                                        ),
                                        ' to this ',
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            result.provider
                                        ),
                                        ' sign-in account ',
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            result.provusername
                                        )
                                    ]),
                                    p(['A sign-in account may only be linked once to any KBase account.']),
                                    p([
                                        'You may ',
                                        button(
                                            {
                                                class: 'btn btn-default',
                                                type: 'button',
                                                id: events.addEvent({
                                                    type: 'click',
                                                    handler() {
                                                        cancelLink(result.id);
                                                    }
                                                })
                                            },
                                            'return to the linking tab'
                                        ),
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
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            result.provider
                                        ),
                                        ' sign-in account ',
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            result.provusername
                                        ),
                                        ' to the KBase account ',
                                        span(
                                            {
                                                style: {
                                                    fontWeight: 'bold'
                                                }
                                            },
                                            result.linkeduser
                                        )
                                    ]),
                                    p(['A sign-in account may only be linked to one KBase account at a time.']),
                                    p([
                                        'You may ',
                                        a(
                                            {
                                                href: `${window.location.origin}/#auth2/account?tab=links`
                                            },
                                            'return to the linking tab'
                                        ),
                                        ' and start again, this time choosing a different sign-in account to link to.'
                                    ])
                                ])
                            });
                        }
                    })
                    .catch((err) => {
                        // TODO: use the error component here.
                        switch (err.code) {
                        case '10010':
                            showMessage({
                                type: 'danger',
                                title: 'Link Session Expired',
                                message: div([
                                    p(['Sorry, your linking session has expired.']),
                                    p([
                                        'You may ',
                                        a(
                                            {
                                                href: `${window.location.origin}/#auth2/account?tab=links`
                                            },
                                            'return to the linking tab'
                                        ),
                                        ' and try again.'
                                    ])
                                ])
                            });
                            break;
                        default:
                            return ErrorWidget.make({
                                runtime
                            })
                                .attach(ui.getElement('error'))
                                .then((w) => {
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
                return auth2Client.linkCancel(linkId).catch(Auth2Error.AuthError, (err) => {
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
            attach,
            start,
            stop,
            detach
        };
    }

    return {
        make(config) {
            return widget(config);
        }
    };
});
