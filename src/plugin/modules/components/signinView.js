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
    './signinComponent',
    './globusProviders'
], function(
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
        input = t('input'),
        label = t('label'),
        h3 = t('h3'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
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
                        h3('Account not found'),
                        p([
                            'You have attempted to sign in to KBase, but are using a ',
                            span({
                                dataBind: {
                                    text: 'choice.provider'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            ' account which is not linked to any KBase account.'
                        ]),
                        p([
                            'You may create a KBase account below, which will be linked to this ',
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
                                    text: 'create.prov_username'
                                },
                                style: {
                                    fontWeight: 'bold'
                                }
                            }),
                            '.'
                        ]),
                        div({
                            style: {
                                marginLeft: '20px',
                                borderLeft: '10px silver solid',
                                paddingLeft: '10px'
                            }
                        }, [
                            p([
                                'If this is not what you intended, and rather you have perhaps signed in with the ',
                                'wrong account, you may need to sign out of the identity provider.'
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
                                    href: '#auth2/login'
                                }, 'signin'),
                                ' process again.'
                            ]),
                        ])

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
            viewModel: function(data) {
                var runtime = data.runtime;

                // var step = data.step;

                var choice = data.choice;

                var policiesToResolve = data.policiesToResolve;

                // var providers = getProviders();

                var nextRequest = data.nextRequst; // JSON.stringify(nextRequest);

                var staySignedIn = ko.observable(true);

                var login = null;
                var create = null;

                var providers = runtime.service('session').getProviders();

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
                // console.log('login', login, create);

                // function doStaySignedIn() {
                //     var checked = e.target.checked;
                //     var auth2Client = runtime.service('session').getClient();
                //     auth2Client.setSessionPersistent(checked);
                // }

                function doProviderSignin(provider) {
                    runtime.service('session').loginStart({
                        state: {
                            nextrequest: JSON.stringify(nextRequest),
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