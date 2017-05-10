define([
    'bluebird',
    'knockout',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'kb_common_ts/HttpClient',
    'kb_common_ts/Auth2',
    '../lib/utilsKO',
    // loaded for effect
    'bootstrap',
    './signupComponent',
    './signinForm',
    './globusProviders'
], function (
    Promise,
    ko,
    html,
    DomEvents,
    BS,
    Plugin,
    HttpClient,
    Auth2,
    Utils
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        h3 = t('h3'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        b = t('b'),
        p = html.tag('p');



    function buildStep2Inactive() {
        return div({
            class: 'col-sm-10 col-sm-offset-1',
            style: {
                paddingBottom: '10px'
            }
        }, [
            p({
                style: {
                    marginTop: '10px',
                    fontWeight: 'bold'
                }
            }, [
                span({
                    style: {
                        verticalAlign: 'middle'
                    }
                }, [
                    '2. ',
                    span({
                        dataElement: 'title'
                    }, 'Create a new KBase Account')
                ])
            ]),
            p({}, [
                'To be done'
            ])
        ]);
    }

    function buildSigninStep() {
        return div({
            class: 'col-sm-10 col-sm-offset-1',
            // style: {
            //     backgroundColor: 'white',
            //     border: '1px silver solid',
            //     paddingBottom: '10px'
            // }
        }, [
            div({}, [
                div({
                    dataBind: {
                        component: {
                            name: '"signin-form"',
                            params: {
                                choice: 'choice',
                                runtime: 'runtime',
                                source: '"signin"',
                                nextRequest: 'nextRequest',
                                policiesToResolve: 'policiesToResolve'
                                    // to communicate completion of the signup process
                                    // to tweak the ui.
                                    //  signupState: 'signupState'
                            }
                        }
                    }
                })
            ])
        ]);
    }

    function buildOopsLegacyUser() {
        return BS.buildCollapsiblePanel({
            title: 'Already Have a KBase Account?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                p([
                    'Do you already have a KBase account and just want to log into it?'
                ]),
                p([
                    'If you created a KBase account ',
                    b('prior to 5/15/17'),
                    ', we have prepared a ',
                    a({
                        href: '#auth2/login/legacy'
                    }, 'special page for you '),
                    ' to explain the changes and help you sign in for the first time with this new system.'
                ]),
                p([
                    'Or you may simply have chosen the wrong account to sign in with. ',
                    'In this case you should just try ',
                    a({
                        href: '#login'
                    }, 'signing in'),
                    ' again with a different acount.'
                ]),
                p([
                    'If you absolutely cannot remember which account you used to sign in to KBase, ',
                    'please ',
                    a({
                        href: 'http://kbase.us/contact'
                    }, 'contact us'),
                    ' and we will help you regain access to your KBase account.'
                ]),
                div({
                    dataBind: {
                        if: 'choice.provider === "Globus"'
                    }
                }, [
                    p([
                        'Since you have signed in with Globus, we can let you in on a little secret. ',
                        'If you try to sign in with Globus under a different account, you will just return to this page ',
                        'with this same account.'
                    ]),
                    p([
                        'You will need to ',
                        a({
                            href: ''
                        }, 'sign out of Globus'),
                        ' first.'
                    ]),
                    p([
                        ''
                    ])
                ])
            ])
        });
    }

    function buildOopsWrongGoogleAccount() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting?',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                p([
                    'If this is not the account you were expecting, you may need to sign out of the identity provider ',
                    'and start the sign-in process again.'
                ]),
                p([
                    'KBase cannot sign out of an identity provider for you, but the links below will allow you ',
                    'to do so.'
                ]),
                ul({
                    dataBind: {
                        foreach: 'providersList'
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

    function buildOopsWrongGlobusAccount() {
        return BS.buildCollapsiblePanel({
            title: 'Not the account you were expecting??',
            type: 'warning',
            collapsed: true,
            classes: ['kb-panel-help'],
            body: div([
                p([
                    'If this browser is already signed in to Globus, a sign-in attempt from KBase will route you ',
                    'to Globus and back again without any warning.'
                ]),
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
                        with: 'providers.Globus'
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

    function buildSignupStep() {
        return div({
            class: 'col-sm-10 col-sm-offset-1',
            // style: {
            //     backgroundColor: 'white',
            //     border: '1px silver solid',
            //     paddingBottom: '10px'
            // }
        }, [

            div({}, [
                p({
                    style: {
                        marginTop: '10px',
                        fontWeight: 'bold'
                    }
                }, [
                    div({
                        dataBind: {
                            if: 'signupState() === "incomplete"'
                        }
                    }, [
                        h3('Sign up for KBase'),
                        p([
                            'Hi, it looks like this is your first time using KBase using your ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account ',
                            span({
                                dataBind: {
                                    text: 'create.provusername'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            })
                        ]),
                        p([
                            'If you wish to create a new KBase account, simply complete the form below. You will then ',
                            'be signed in using this ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account.'
                        ]),
                        p(['Otherwise']),

                        buildOopsLegacyUser(),
                        div({
                            dataBind: {
                                if: 'choice.provider === "Globus"'
                            }
                        }, buildOopsWrongGlobusAccount()),
                        div({
                            dataBind: {
                                if: 'choice.provider === "Google"'
                            }
                        }, buildOopsWrongGoogleAccount()),

                        // p([
                        //     'If this is a mistake, and you want to sign in to a KBase account you already have, you should probably be ',
                        //     'signing in with a different account. ',
                        //     'If you created a KBase account prior to 5/15/17, we have prepared a special page for you ',
                        //     'to explain the changes and help you sign in for the first time.'
                        // ]),
                        // p([
                        //     'You may create a KBase account below, which will be linked to this ',
                        //     span({
                        //         dataBind: {
                        //             text: 'choice.provider'
                        //         },
                        //         style: {
                        //             fontWeight: 'bold'
                        //         }
                        //     }),
                        //     ' account ',
                        //     span({
                        //         dataBind: {
                        //             text: 'create.provusername'
                        //         },
                        //         style: {
                        //             fontWeight: 'bold'
                        //         }
                        //     }),
                        //     '.'
                        // ]),
                        // div({
                        //     style: {
                        //         marginLeft: '20px',
                        //         borderLeft: '10px silver solid',
                        //         paddingLeft: '10px'
                        //     }
                        // }, [
                        //     p([
                        //         'If this is not what you intended, and rather you have perhaps signed in with the ',
                        //         'wrong account, you may need to sign out of the identity provider.'
                        //     ]),
                        //     p([
                        //         'KBase cannot sign you out of an identity provider, but the links below will allow you ',
                        //         'to do so.'
                        //     ]),
                        //     ul({
                        //         dataBind: {
                        //             foreach: 'providers'
                        //         }
                        //     }, li(a({
                        //         dataBind: {
                        //             attr: {
                        //                 href: 'logoutUrl'
                        //             }
                        //         },
                        //         target: '_blank'
                        //     }, [
                        //         'Log out from ',
                        //         span({
                        //             dataBind: {
                        //                 text: 'label'
                        //             }
                        //         })
                        //     ]))),
                        //     p([
                        //         'After signing out you will need to start the ',
                        //         a({
                        //             href: '#login'
                        //         }, 'signin'),
                        //         ' process again.'
                        //     ]),
                        // ])

                    ]),
                    div({
                        dataBind: {
                            if: 'signupState() === "complete"'
                        }
                    }, [
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, span({
                            dataElement: 'title'
                        }, 'Ready to create a new KBase Account'))
                    ]),
                    div({
                        dataBind: {
                            if: 'signupState() === "success"'
                        }
                    }, [
                        span({
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, span({
                            dataElement: 'title'
                        }, 'KBase Account Successfully Created'))
                    ]),
                ]),
                div({
                    dataBind: {
                        component: {
                            name: '"signup-form"',
                            params: {
                                choice: 'choice',
                                runtime: 'runtime',
                                nextRequest: 'nextRequest',
                                policiesToResolve: 'policiesToResolve',
                                // to communicate completion of the signup process
                                // to tweak the ui.
                                signupState: 'signupState'
                            }
                        }
                    }
                })
            ])
        ]);
    }

    function buildStep2() {
        return div([
            div({
                dataBind: {
                    if: 'uiState.auth() === false'
                }
            }, buildStep2Inactive()),
            div({
                dataBind: {
                    if: 'uiState.signin()'
                }
            }, buildSigninStep()),
            div({
                dataBind: {
                    if: 'uiState.signup()'
                }
            }, buildSignupStep()),
        ]);
    }

    function getProviders() {
        return {
            google: {
                id: 'Google',
                label: 'Google',
                logoImage: Plugin.plugin.fullPath + '/providers/google_logo.png',
                description: div([
                    p([
                        'Any Google account may be used to access KBase, including gmail ',
                        'and organizational services built on the Google Apps platform.'
                    ])
                ])
            },
            globus: {
                id: 'Globus',
                label: 'Globus',
                logoImage: Plugin.plugin.fullPath + '/providers/globus_logo.png',
                description: div([
                    p([
                        'In addition to Globus ID, required for the Globus Transfer service, ',
                        'Globus supports many organizational sign-in providers -- your organization may be supported.'
                    ]),
                    p([
                        'Sign-in providers offered by Globus: ',
                        span({
                            dataBind: {
                                component: {
                                    name: '"globus-providers"'
                                }
                            }
                        })
                    ]),
                    p([
                        'KBase accounts created before 5/15/17 utilized Globus ID exclusively.'
                    ])
                ])
            }

        };
    }

    function template() {
        var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

        return div({
            class: 'container',
            // style: 'margin-top: 4em',
            dataWidget: 'login'
        }, [
            // div({}, [
            //     div({
            //         style: {
            //             position: 'absolute',
            //             backgroundImage: 'url(' + doodlePath + ')',
            //             backgroundRepeat: 'no-repeat',
            //             backgroundSize: '35%',
            //             top: '0',
            //             left: '0',
            //             bottom: '0',
            //             right: '0',
            //             opacity: '0.1',
            //             zIndex: '-1000'
            //         }
            //     })
            // ]),
            div({ class: 'row' }, [
                buildStep2()
                // div({
                //     id: vm.get('step2').id
                // }),
                // div({
                //     id: vm.get('error').id
                // }),
                // div({
                //     id: vm.get('alreadySignedUp').id
                // })
            ])
        ]);
    }
    // function doLogin(providerId, state) {

    //     runtime.service('session').loginStart({
    //         // TODO: this should be either the redirect url passed in 
    //         // or the dashboard.
    //         // We just let the login page do this. When the login page is 
    //         // entered with a valid token, redirect to the nextrequest,
    //         // and if that is empty, the dashboard.
    //         state: state,
    //         provider: providerId,
    //         stayLoggedIn: false
    //     });
    // }
    function component() {
        return {
            viewModel: function (data) {
                var runtime = data.runtime;

                var choice = data.choice;

                var policiesToResolve = data.policiesToResolve;

                var nextRequest = data.nextRequest;

                var staySignedIn = ko.observable(true);

                var login = null;
                var create = null;

                // var providers = runtime.service('session').getProviders();
                var providers = getProviders();
                var providersList = [
                    providers.google,
                    providers.globus
                ];

                // UI state

                // Grok it from what we know so far
                var uiState = {
                    auth: ko.observable(false),
                    signin: ko.observable(false),
                    signup: ko.observable(false),
                    error: ko.observable(false)
                };
                if (choice) {
                    uiState.auth(true);
                    if (choice.login.length === 1) {
                        login = choice.login[0];
                        uiState.signin(true);
                    } else {
                        create = choice.create[0];
                        uiState.signup(true);
                    }
                }
                // function doStaySignedIn() {
                //     var checked = e.target.checked;
                //     var auth2Client = runtime.service('session').getClient();
                //     auth2Client.setSessionPersistent(checked);
                // }

                function doProviderSignin(provider) {
                    runtime.service('session').loginStart({
                        state: {
                            nextrequest: nextRequest,
                            origin: 'signup'
                        },
                        provider: provider.id,
                        stayLoggedIn: false
                    });
                }

                // no assumptions ... this is set by the signup component, if any.
                var signupState = ko.observable();

                return {
                    runtime: runtime,
                    uiState: uiState,
                    providers: providers,
                    providersList: providersList,
                    nextRequest: nextRequest,
                    staySignedIn: staySignedIn,
                    choice: choice,
                    login: login,
                    create: create,
                    policiesToResolve: policiesToResolve,
                    doProviderSignin: doProviderSignin,
                    signupState: signupState
                };
            },
            template: template()
        };
    }
    ko.components.register('signin-view', component());

});