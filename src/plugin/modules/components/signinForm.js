define([
    'knockout',
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_common_ts/Auth2',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils'
], function(
    ko,
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    M_Auth2,
    Plugin,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        form = t('form'),
        button = t('button');

    function buildLogin() {
        return BS.buildPanel({
            title: 'Log in to KBase',
            type: 'default',
            body: div({}, [
                div({}, p('You may log into the following KBase account:')),
                div({
                    dataBind: {
                        component: {
                            name: '"policy-resolver"',
                            params: {
                                policiesToResolve: 'policiesToResolve'
                            }
                        }
                    }
                }),
                div({
                    dataBind: {
                        with: 'choice.login[0]'
                    }
                }, div({
                    style: {
                        margin: '4px',
                        padding: '4px'
                    }
                }, form({
                    dataBind: {
                        submit: '$parent.doSigninSubmit'
                    }
                }, [
                    div([
                        button({
                            class: 'btn btn-primary',
                            type: 'submit',
                            dataBind: {
                                disable: '!$parent.canSignin()'
                            }
                        }, [
                            'Continue to the KBase account ',
                            span({
                                dataBind: {
                                    text: 'username'
                                },
                                style: {
                                    textWeight: 'bold'
                                }
                            })
                        ])
                    ])
                ])))
            ])
        });
    }

    function buildOops() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'default',
            collapsed: true,
            classes: ['kb-panel-light', '-lighter'],
            body: div([
                p([
                    'If this is not the account you were expecting, you may need to sign out of the identity provider ',
                    'and start the sign-in process again.'
                ]),
                p([
                    'KBase cannot sign you out of an identity provider, but the links below will allow you ',
                    'to do so.'
                ]),
                ul({
                    dataBind: {
                        foreach: 'providers'
                    }
                }, li(a({
                    dataBind: {
                        attr: {
                            href: 'logoutUrl'
                        }
                    },
                    target: '_blank'
                }, [
                    'Log out from ',
                    span({
                        dataBind: {
                            text: 'label'
                        }
                    })
                ]))),
                p([
                    'After signing out you will need to start the ',
                    a({
                        href: '#login'
                    }, 'signin'),
                    ' process again.'
                ]),
            ])
        });
    }

    function template() {
        return div([
            p([
                'This ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'choice.provider'
                    }
                }),
                ' account ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'login.prov_usernames[0]'
                    }
                }),
                ' is associated with the KBase account ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'login.username'
                    }
                })
            ]),
            buildLogin(),
            buildOops()
        ]);
        // ui.setContent('main-title', 'KBase Login - Ready to Sign In');
    }

    function getAgreements(policiesToResolve) {
        var agreementsToSubmit = [];
        // missing policies
        policiesToResolve.missing.forEach(function(policy) {
            if (!policy.agreed()) {
                throw new Error('Cannot submit with missing policies not agreed to');
            }
            agreementsToSubmit.push({
                id: policy.id,
                version: policy.version
            });
        });
        // outdated policies.
        policiesToResolve.outdated.forEach(function(policy) {
            if (!policy.agreed()) {
                throw new Error('Cannot submit with missing policies not agreed to');
            }
            agreementsToSubmit.push({
                id: policy.id,
                version: policy.version
            });
        });
        return agreementsToSubmit;
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var choice = params.choice;
        var login = choice.login[0];
        var nextRequest = params.nextRequest;
        var runtime = params.runtime;

        var policiesToResolve = {
            missing: params.policiesToResolve.missing.map(function(item) {
                return {
                    id: item.id,
                    version: item.version,
                    policy: item.policy,
                    viewPolicy: ko.observable(false),
                    agreed: ko.observable(false)
                };
            }),
            outdated: params.policiesToResolve.outdated.map(function(item) {
                return {
                    id: item.id,
                    version: item.version,
                    policy: item.policy,
                    agreement: item.agreement,
                    viewPolicy: ko.observable(false),
                    agreed: ko.observable(false)
                };
            })
        };

        var canSignin = ko.pureComputed(function() {
            if (policiesToResolve.missing.some(function(item) {
                    return !item.agreed();
                }) || policiesToResolve.outdated.some(function(item) {
                    return !item.agreed();
                })) {
                return false;
            }
            return true;
        });

        function doSigninSubmit() {
            // just get the first, since we only have one now.
            var agreements = getAgreements(policiesToResolve);

            runtime.service('session').getClient().loginPick({
                    identityId: login.id,
                    linkAll: false,
                    agreements: agreements
                })
                .then(function() {
                    doSigninSuccess();
                })
                .catch(function(err) {
                    console.error('Error', err);
                    // showError(err);
                });
            return false;
        }

        function doSigninSuccess() {
            if (nextRequest !== null) {
                runtime.send('app', 'navigate', nextRequest);
            } else {
                runtime.send('app', 'navigate', { path: 'dashboard' });
            }
        }

        var providers = runtime.service('session').getProviders();

        return {
            runtime: runtime,
            choice: choice,
            login: login,
            providers: providers,
            canSignin: canSignin,
            doSigninSubmit: doSigninSubmit,
            doSigninSuccess: doSigninSuccess,
            policiesToResolve: policiesToResolve
        };
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('signin-form', component());

});