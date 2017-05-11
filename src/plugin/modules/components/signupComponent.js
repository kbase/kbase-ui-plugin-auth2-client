define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/domEvent2',
    'kb_common_ts/Auth2Error',
    'kb_service/client/userProfile',
    '../lib/format',
    './policyComponent',
    './errorView',
    './typeaheadInput'
], function (
    ko,
    html,
    BS,
    DomEvent,
    Auth2Error,
    UserProfileService,
    format
) {
    var t = html.tag,
        h1 = t('h1'),
        div = t('div'),
        a = t('a'),
        span = t('span'),
        p = t('p'),
        label = t('label'),
        button = t('button'),
        form = t('form'),
        input = t('input');

    function requiredIcon(fieldName) {
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-asterisk text-danger": ' + fieldName + '.isValid() === false, "glyphicon-ok text-success":' + fieldName + '.isValid()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    function buildRealnameField() {
        return {
            field: div({
                class: 'form-group'
            }, [
                label({
                    for: 'signup_realname'
                }, ['Your Name', requiredIcon('realname')]),
                input({
                    type: 'text',
                    class: 'form-control',
                    id: 'signup_realname',
                    name: 'realname',
                    autocomplete: 'off',
                    dataBind: {
                        value: 'realname',
                        valueUpdate: '"input"'
                    }
                }),
                div({
                    class: 'alert alert-danger',
                    dataBind: {
                        validationMessage: 'realname'
                    }
                })
            ]),
            info: div({}, [
                div([
                    p([
                        'This field contains your name as you wish it to be displayed to other KBase users ',
                        ' as well as KBase staff.'
                    ])
                ]),
                div({
                    class: 'hidden'
                }, [
                    p([
                        'This name will be displayed to other KBase users until you create your profile. ',
                        'When you create your profile, a new display name will be created which contains ',
                        'additional information, including title, suffix, first and last name. '
                    ]),
                    p([
                        'After you create your profile, that name information will be used for display to ',
                        'other users (when they are logged in), and in Narratives and related data you may publish. ',
                        'When you have a profile, the name shown here ',
                        'on your account will the only be available to KBase staff.'
                    ])
                ])
            ])
        };
    }

    function buildUsernameField() {
        return {
            field: div({
                class: 'form-group'
            }, [
                label({
                    for: 'signup_username'
                }, ['KBase Username', requiredIcon('username')]),
                input({
                    type: 'text',
                    class: 'form-control',
                    id: 'signup_username',
                    name: 'username',
                    dataBind: {
                        value: 'username',
                        valueUpdate: '"input"'
                    }
                }),
                div({
                    class: 'alert alert-danger',
                    dataBind: {
                        validationMessage: 'username'
                    }
                })
            ]),
            info: div(
                [
                    div({}, [
                        p([
                            'Your KBase username is the primary identifier carried with all of your work and assets within ',
                            ' KBase.'
                        ]),
                        p({
                            style: {
                                fontWeight: 'bold'
                            }
                        }, [
                            'Your username is permanent and may not be changed later, so please choose wisely.'
                        ])
                    ]),
                    div({
                        class: 'hidden'
                    }, [
                        p([
                            'Is there anything else to say?',
                        ])
                    ])
                ]
            )
        };
    }

    function buildEmailField() {
        return {
            field: div({
                class: 'form-group'
            }, [
                label({
                    for: 'signup_email'
                }, ['E-Mail', requiredIcon('email')]),
                input({
                    type: 'text',
                    class: 'form-control',
                    id: 'signup_email',
                    name: 'email',
                    dataBind: {
                        value: 'email',
                        valueUpdate: '"input"'
                    }
                }),
                div({
                    class: 'alert alert-danger',
                    dataBind: {
                        validationMessage: 'email'
                    }
                })
            ]),
            info: div(
                [
                    div({}, [
                        p([
                            'KBase may use this email address to communicate important information about KBase or your account.'
                        ])
                    ]),
                    div({
                        class: 'hidden'
                    }, [
                        p([
                            'Is there anything else to say?',
                        ])
                    ])
                ]
            )
        };
    }

    function buildSignupForm() {
        return div({
            dataBind: {
                if: 'signupState() === "incomplete" || signupState() === "complete"'
            }
        }, BS.buildPanel({
            type: 'default',
            title: 'Sign up for KBase',
            body: div({
                // id: vm.form.id
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        p([
                            'Some field values have been pre-populated from your ',
                            span({ dataBind: 'text: choice.provider' }),
                            ' account.'
                        ])
                    ])
                ]),
                // div({
                //     class: 'row'
                // }, [
                //     div({
                //         class: 'col-md-5'
                //     }, div({
                //         class: 'form-group'
                //     }, [
                //         label(['Title / Role', requiredIcon('role')]),

                //         div({
                //             dataBind: {
                //                 component: {
                //                     name: '"typeahead-input"',
                //                     params: {
                //                         inputValue: 'role',
                //                         availableValues: 'roles'
                //                     }
                //                 }
                //             }
                //         }),
                //         // input({
                //         //     class: 'form-control',
                //         //     name: 'role',
                //         //     dataBind: {
                //         //         value: 'role',
                //         //         valueUpdate: '"input"'
                //         //     }
                //         // }),
                //         div({
                //             class: 'alert alert-danger',
                //             dataBind: {
                //                 validationMessage: 'role'
                //             }
                //         })
                //     ])),
                //     div({
                //         class: 'col-md-7',
                //         style: {
                //             paddingTop: '20px'
                //         }
                //     })
                // ]),
                form({
                    dataElement: 'form',
                    autocomplete: 'off'
                }, [
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-5'
                        }, buildRealnameField().field),
                        div({
                            class: 'col-md-7',
                            style: {
                                paddingTop: '20px'
                            }
                        }, buildRealnameField().info)
                    ]),
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-5'
                        }, buildEmailField().field),
                        div({
                            class: 'col-md-7',
                            style: {
                                paddingTop: '20px'
                            }
                        }, buildEmailField().info)
                    ]),
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-5'
                        }, buildUsernameField().field),
                        div({
                            class: 'col-md-7',
                            style: {
                                paddingTop: '20px'
                            }
                        }, buildUsernameField().info)
                    ]),


                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-5'
                        }, div({
                            class: 'form-group'
                        }, [
                            label(['Organization', requiredIcon('organization')]),
                            input({
                                class: 'form-control',
                                name: 'organization',
                                dataBind: {
                                    value: 'organization',
                                    valueUpdate: '"input"'
                                }
                            }),
                            div({
                                class: 'alert alert-danger',
                                dataBind: {
                                    validationMessage: 'organization'
                                }
                            })
                        ])),
                        div({
                            class: 'col-md-7',
                            style: {
                                paddingTop: '20px'
                            }
                        })
                    ]),

                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-5'
                        }, div({
                            class: 'form-group'
                        }, [
                            label(['Department', requiredIcon('department')]),
                            input({
                                class: 'form-control',
                                name: 'department',
                                dataBind: {
                                    value: 'department',
                                    valueUpdate: '"input"'
                                }
                            }),
                            div({
                                class: 'alert alert-danger',
                                dataBind: {
                                    validationMessage: 'department'
                                }
                            })
                        ])),
                        div({
                            class: 'col-md-7',
                            style: {
                                paddingTop: '20px'
                            }
                        })
                    ]),
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-12'
                        }, [
                            div({
                                dataBind: {
                                    component: {
                                        name: '"policy-resolver"',
                                        params: {
                                            policiesToResolve: 'policiesToResolve'
                                        }
                                    }
                                }
                            })
                        ])
                    ]),
                    div({
                        class: 'row',
                        style: {
                            marginTop: '20px'
                        }
                    }, [
                        div({
                            class: 'col-md-5'
                        }, [
                            button({
                                class: 'btn btn-primary',
                                type: 'submit',
                                dataElement: 'submit-button',
                                dataBind: {
                                    click: 'doSubmitSignup',
                                    disable: '!canSubmit()'
                                }
                            }, 'Create KBase Account'),
                            button({
                                class: 'btn btn-danger btn-sm',
                                style: {
                                    marginLeft: '10px'
                                },
                                dataBind: {
                                    click: 'doCancelChoiceSession'
                                }
                            }, 'Cancel Sign-Up')
                        ]),
                        div({
                            class: 'col-md-7'
                        })
                    ])
                ])
            ])
        }));
    }

    function buildSuccessResponse() {
        return div({
            class: 'row',
            dataBind: {
                if: 'signupState() === "success"'
            },
        }, div({
            style: {
                marginTop: '20px'
            }
        }, BS.buildPanel({
            type: 'success',
            title: 'KBase Account Successfuly Created',
            body: div([
                p('Your new KBase account has been created and is ready to be used.'),
                div([
                    button({
                        class: 'btn btn-primary',
                        dataBind: {
                            click: 'doSignupSuccess'
                        }
                    }, 'Continue')
                ])
            ])
        })));
    }

    function buildErrorResponse() {
        return div({
            class: 'row',
            dataBind: {
                if: 'signupState() === "error"'
            }
        }, div({
            style: {
                marginTop: '20px'
            }
        }, BS.buildPanel({
            type: 'error',
            title: 'Auth Error',
            body: div({
                dataBind: {
                    component: {
                        name: '"error-view"',
                        params: {
                            code: 'error.code',
                            message: 'error.message',
                            detail: 'error.detail',
                            data: 'error.data'
                        }
                    }
                }
            })
        })));
    }

    function buildExpired() {
        return div({
            dataBind: {
                if: 'expired'
            }
        }, [
            h1([
                'Expired'
            ]),
            p([
                'Your sign-up session has expired.'
            ]),
            p([
                'Once you start the sign-in or sign-up process, you have 30 minutes to complete it.'
            ]),
            p([
                'You should visit the ',
                a({
                    href: '#login'
                }, 'sign-in page'),
                ' make another attempt to sign-in or sign-up.'
            ])
        ]);
    }

    function buildClock() {
        return div({
            dataBind: {
                if: 'signupState() === "incomplete" || signupState() === "complete"'
            }
        }, div({
            dataBind: {
                if: 'expiresIn() > 0'
            },
            style: {
                marginBottom: '12px',
                textAlign: 'right'
            }

        }, p({
            style: {
                display: 'inline-block',
                padding: '6px',
                backgroundColor: '#999',
                color: '#FFF'
            }
        }, [
            'This sign-up session will expire in ',
            span({
                style: {
                    fontFamily: 'monospace'
                },
                dataBind: {
                    text: 'expiresMessage()'
                }
            })
            // button({
            //     class: 'btn btn-danger btn-sm',
            //     style: {
            //         marginLeft: '10px'
            //     },
            //     dataBind: {
            //         click: 'doCancelChoiceSession'
            //     }
            // }, '&times;')
        ])));
    }

    function template() {
        return div({
            dataBind: {
                validationOptions: {
                    insertMessages: 'false'
                }
            }
        }, [
            div({
                name: 'error'
            }),
            buildSuccessResponse(),
            buildErrorResponse(),
            buildClock(),
            buildExpired(),
            buildSignupForm()
        ]);
    }

    function component() {
        return {
            viewModel: function (params) {
                var choice = params.choice;
                var create = choice.create[0];
                var runtime = params.runtime;
                var nextRequest = params.nextRequest;

                // SIGNUP FORM

                var realname = ko.observable(create.provfullname).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100
                });
                ko.validation.rules['usernameStartsWithLetter'] = {
                    validator: function (val) {
                        if (!/^[a-zA-Z]/.test(val)) {
                            return false;
                        }
                        return true;
                    },
                    message: 'A username must start with an alphabetic letter'
                };
                ko.validation.rules['usernameNoSpaces'] = {
                    validator: function (val) {
                        if (/\s/.test(val)) {
                            return false;
                        }
                        return true;
                    },
                    message: 'A username must not contain spaces'
                };
                ko.validation.rules['usernameValidChars'] = {
                    validator: function (val) {
                        if (!/^[a-z0-9_]+$/.test(val)) {
                            return false;
                        }
                        return true;
                    },
                    message: 'A username may only contain the characters a-z, 0-0, and _.'
                };
                ko.validation.rules['usernameMustBeUnique'] = {
                    async: true,
                    validator: function (val, params, callback) {
                        runtime.service('session').getClient().loginUsernameSuggest(username())
                            .then(function (results) {
                                if (results.availablename !== username()) {
                                    callback({
                                        isValid: results.available,
                                        message: 'This username is not available: a suggested available username is ' + results.availablename
                                    });
                                } else {
                                    callback({
                                        isValid: true
                                    });
                                }
                            })
                            .catch(function (err) {
                                console.error('err', err);
                                callback({
                                    isValid: false,
                                    message: 'Error checking for username: ' + err.message
                                });
                            });
                    },
                    message: 'This username is already taken'
                };
                ko.validation.registerExtenders();

                var username = ko.observable().extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    usernameStartsWithLetter: true,
                    usernameNoSpaces: true,
                    usernameValidChars: true,
                    usernameMustBeUnique: true
                });
                var email = ko.observable(create.provemail).extend({
                    required: true,
                    email: true
                });

                // var role = ko.observable().extend({
                //     required: true
                // });
                var organization = ko.observable().extend({
                    required: true
                });
                var department = ko.observable().extend({
                    required: true
                });

                var allValid = ko.pureComputed(function () {
                    var valid = (realname.isValid() &&
                        email.isValid() &&
                        username.isValid() &&
                        // role.isValid() &&
                        organization.isValid() &&
                        department.isValid());
                    return valid;
                });

                var error = {
                    code: ko.observable(),
                    message: ko.observable(),
                    detail: ko.observable(),
                    data: ko.observable()
                };


                var canSubmit = ko.pureComputed(function () {
                    if (!allValid()) {
                        return false;
                    }

                    if (policiesToResolve.missing.some(function (item) {
                            return !item.agreed();
                        }) || policiesToResolve.outdated.some(function (item) {
                            return !item.agreed();
                        })) {
                        return false;
                    }
                    return true;
                });

                canSubmit.subscribe(function (newCanSubmit) {
                    if (newCanSubmit) {
                        signupState('complete');
                    } else {
                        signupState('incomplete');
                    }
                });

                var signupState = params.signupState;
                signupState('incomplete');


                function createProfile(response) {
                    return runtime.service('session').getClient().getClient().getMe(response.token.token)
                        .then(function (accountInfo) {
                            var userProfileClient = new UserProfileService(runtime.config('services.user_profile.url'), {
                                token: response.token.token
                            });
                            // first just recreate the stub profile experience.
                            // var newProfile = profile.makeProfile({
                            //     username: accountInfo.user,
                            //     realname: accountInfo.fullname,
                            //     account: {},
                            //     createdBy: 'userprofile_ui_service'
                            // });
                            var newProfile = {
                                user: {
                                    username: accountInfo.user,
                                    realname: realname()
                                },
                                profile: {
                                    metadata: {
                                        createdBy: 'userprofile_ui_service',
                                        created: new Date().toISOString()
                                    },
                                    // was globus info, no longer used
                                    account: {},
                                    preferences: {},
                                    // when auto-creating a profile, there is nothing to put here het.
                                    userdata: {
                                        // title: role(),
                                        organization: organization(),
                                        department: department()
                                    }
                                }
                            };
                            return userProfileClient.set_user_profile({
                                profile: newProfile
                            });
                        });
                }

                function submitSignup() {
                    var agreementsToSubmit = [];
                    // missing policies
                    policiesToResolve.missing.forEach(function (policy) {
                        if (!policy.agreed()) {
                            throw new Error('Cannot submit with missing policies not agreed to');
                        }
                        agreementsToSubmit.push({
                            id: policy.id,
                            version: policy.version
                        });
                    });
                    // outdated policies.
                    policiesToResolve.outdated.forEach(function (policy) {
                        if (!policy.agreed()) {
                            throw new Error('Cannot submit with missing policies not agreed to');
                        }
                        // agreementsToSubmit.push([policy.id, policy.version].join('.'));
                        agreementsToSubmit.push({
                            id: policy.id,
                            version: policy.version
                        });
                    });

                    var data = {
                        id: create.id,
                        user: username(),
                        display: realname(),
                        email: email(),
                        linkall: false,
                        policyids: agreementsToSubmit.map(function (a) {
                            return [a.id, a.version].join('.');
                        })
                    };

                    return runtime.service('session').getClient().loginCreate(data)
                        .then(function (result) {
                            return createProfile(result)
                                .then(function () {
                                    return runtime.service('session').getClient().initializeSession(result.token);
                                });
                        })
                        .then(function () {
                            signupState('success');
                        });
                }

                function doSubmitSignup() {
                    // validateAll();
                    submitSignup()
                        .catch(Auth2Error.AuthError, function (err) {
                            error.code(err.code);
                            error.message(err.message);
                            error.detail(err.detail);
                            error.data(err.data);
                            signupState('error');
                        })
                        .catch(function (err) {
                            signupState('error');
                            error.code(err.name);
                            error.message(err.message);
                        });
                }

                function doSignupSuccess() {
                    if (nextRequest) {
                        runtime.send('app', 'navigate', nextRequest);
                    } else {
                        runtime.send('app', 'navigate', {
                            path: 'dashboard',
                            params: {
                                tab: 'profile'
                            }
                        });
                    }
                }

                // var validationStatus = ko.computed(function(fieldName) {
                //     var fields = {
                //         username: username,
                //         realname: realname,
                //         role: role
                //     };
                //     var field = fields[fieldName];
                //     if (!field) {
                //         return;
                //     }
                //     if (field.isValid()) {
                //         return 'fa-check';
                //     } else {
                //         return 'fa-asterisk';
                //     }
                // }, { writable: true });

                // POLICY AGREMENTS
                // The interface to the policy agreement component is ...
                // Well, let's see.

                // make policy resolution structure.

                var policiesToResolve = {
                    missing: params.policiesToResolve.missing.map(function (item) {
                        return {
                            id: item.id,
                            version: item.version,
                            policy: item.policy,
                            viewPolicy: ko.observable(false),
                            agreed: ko.observable(false)
                        };
                    }),
                    outdated: params.policiesToResolve.outdated.map(function (item) {
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


                // EXPIRATION

                var timeOffset = runtime.service('session').getClient().serverTimeOffset();

                var now = ko.observable(new Date().getTime());

                // var servertime = choice.servertime;
                var expiresIn = ko.pureComputed(function () {
                    if (!choice.expires) {
                        return '';
                    }
                    // for testing: return choice.expires - now() - timeOffset - (27 * 60 * 1000);
                    return choice.expires - now() - timeOffset;
                });
                var expiresMessage = ko.pureComputed(function () {
                    return format.niceDuration(expiresIn());
                });
                var expired = ko.pureComputed(function () {
                    return (expiresIn() <= 0);
                });

                expired.subscribe(function (newExpired) {
                    if (newExpired) {
                        signupState('expired');
                    }
                });

                // start clock... improve
                var timer = window.setInterval(function () {
                    now(new Date().getTime());
                }, 500);

                function doCancelChoiceSession() {
                    runtime.service('session').getClient().loginCancel()
                        .then(function () {
                            runtime.send('app', 'navigate', {
                                path: 'login'
                            });
                        })
                        .catch(Auth2Error.AuthError, function (err) {
                            console.error('ERROR1', err);
                            // Setting the error triggers the error component to be 
                            // displayed and populated.
                            // TODO: I think the error object needs to be fully observable and 
                            // updated here in order to propogate the values into the component....
                            // Otherwise those properties will be stuck at the original value.
                            error({
                                code: err.code,
                                message: err.message,
                                detail: err.detail,
                                data: err.data
                            });
                        })
                        .catch(function (err) {
                            console.error('ERROR2', err);
                            error({
                                code: err.name,
                                message: err.message,
                                detail: '',
                                data: ko.observable({})
                            });
                        });
                }

                // var roles = [{
                //     id: 'mr',
                //     label: 'Mr'
                // }, {
                //     id: 'ms',
                //     label: 'Ms'
                // }, {
                //     id: 'miss',
                //     label: 'Miss'
                // }, {
                //     id: 'mrs',
                //     label: 'Mrs'
                // }, {
                //     id: 'dr',
                //     label: 'Dr'
                // }, {
                //     id: 'sr',
                //     label: 'Sr'
                // }, {
                //     id: 'director',
                //     label: 'Director'
                // }];


                return {
                    choice: choice,
                    create: create,
                    username: username,
                    realname: realname,
                    email: email,
                    // role: role,
                    // roles: roles,
                    organization: organization,
                    department: department,
                    policiesToResolve: policiesToResolve,
                    error: error,

                    signupState: params.signupState,

                    canSubmit: canSubmit,
                    doSubmitSignup: doSubmitSignup,
                    doSignupSuccess: doSignupSuccess,
                    doCancelChoiceSession: doCancelChoiceSession,
                    // validationStatus: validationStatus
                    //expiration, clock, etc.
                    expired: expired,
                    expiresIn: expiresIn,
                    expiresMessage: expiresMessage
                };
            },
            template: template()
        };
    }
    ko.components.register('signup-form', component());
});