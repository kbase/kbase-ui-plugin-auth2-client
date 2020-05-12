define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/subscriptionManager',
    'kb_lib/html',
    'kb_lib/htmlBootstrapBuilders',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Session',
    'kb_service/client/userProfile',
    '../lib/format',
    '../lib/dataSource',
    './policyResolver',
    './typeaheadInput',
    './errorView'
], function (
    ko,
    reg,
    SubscriptionManager,
    html,
    BS,
    Auth2Error,
    auth2,
    MAuth2Session,
    UserProfileService,
    format,
    DataSource,
    PolicyResolverComponent,
    TypeaheadInputComponent,
    ErrorViewComponent
) {
    'use strict';

    var t = html.tag,
        h1 = t('h1'),
        div = t('div'),
        a = t('a'),
        span = t('span'),
        p = t('p'),
        ul = t('ul'),
        li = t('li'),
        label = t('label'),
        button = t('button'),
        form = t('form'),
        input = t('input');

    function memoize(fun) {
        var run = false;
        var value;
        return function () {
            if (run) {
                return value;
            }
            value = fun.apply(null, arguments);
            run = true;
            return value;
        };
    }

    function viewModel(params) {
        var subscriptions = new SubscriptionManager();
        var choice = params.choice;
        var done = params.done;
        var create = choice.create[0];
        var runtime = params.runtime;
        var nextRequest = params.nextRequest;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        // TODO: extra cookies!
        const extraCookies = [];
        const sessionConfig = runtime.config('ui.services.session');
        if (sessionConfig.cookie.backup.enabled) {
            this.extraCookies.push({
                name: sessionConfig.cookie.backup.name,
                domain: sessionConfig.cookie.backup.domain
            });
        }

        var auth2Session = new MAuth2Session.Auth2Session({
            cookieName: sessionConfig.cookie.name,
            extraCookies: extraCookies,
            baseUrl: runtime.config('services.auth2.url'),
            providers: runtime.config('services.auth2.providers')
        });

        var dataSource = DataSource({
            path: runtime.pluginResourcePath + '/dataSources/',
            sources: {
                // Raw data source
                institutions: {
                    file: 'institutions.json',
                    type: 'json'
                },
                nationalLabs: {
                    file: 'nationalLabs.yaml',
                    type: 'yaml'
                },
                otherLabs: {
                    file: 'otherLabs.yaml',
                    type: 'yaml'
                },

                // A computed data source.
                organizations: {
                    sources: {
                        institutions: {
                            translate: false
                        },
                        nationalLabs: {
                            translate: function (item) {
                                return {
                                    value: item.name,
                                    label: item.name + ' (' + item.initials + ')'
                                };
                            }
                        },
                        otherLabs: {
                            translate: function (item) {
                                return {
                                    value: item.name,
                                    label: item.name + ' (' + item.initials + ')'
                                };
                            }
                        }
                    }
                }
            }
        });

        // knockout SETUP
        // TODO: move to knockout-plus?

        ko.validation.rules['realnameCannotStartWithSpace'] = {
            validator: function (val) {
                if (/^\s+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'Your name may not begin with a space'
        };

        ko.validation.rules['usernameValidChars'] = {
            validator: function (val) {
                if (!/^[a-z0-9_]+$/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may only contain the letters a-z (lower case), the digits 0-9, and _ (underscore).'
        };
        // ko.validation.rules['usernameStartsWithLetter'] = {
        //     validator: function (val) {
        //         if (!/^[a-zA-Z]/.test(val)) {
        //             return false;
        //         }
        //         return true;
        //     },
        //     // message: ''
        //     message: 'A username must start with an alphabetic letter'
        // };
        ko.validation.rules['usernameCannotStartWithNumber'] = {
            validator: function (val) {
                if (/^[0-9]+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may not begin with a number'
        };
        ko.validation.rules['usernameCannotStartWithUnderscore'] = {
            validator: function (val) {
                if (/^_+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may not start with the underscore character _'
        };
        ko.validation.rules['usernameNoSpaces'] = {
            validator: function (val) {
                if (/\s/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may not contain spaces'
        };

        ko.validation.rules['usernameMustBeUnique'] = {
            async: true,
            validator: function (val, params, callback) {
                auth2Client
                    .loginUsernameSuggest(username())
                    .then(function (results) {
                        if (results.availablename !== username()) {
                            callback({
                                isValid: results.available,
                                message:
                                    'This username is not available: a suggested available username is ' +
                                    results.availablename
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

        ko.extenders.validationFieldBorder = function (target, config) {
            if (!config) {
                return;
            }
            var fieldBorder = ko.pureComputed(function () {
                if (target.isValidating()) {
                    // return '1px solid yellow';
                    return 'bs-border-warning';
                }
                if (target.isModified()) {
                    if (target.isValid()) {
                        // return '1px solid transparent';
                        return 'bs-border-invisible';
                    } else {
                        // return '1px solid red';
                        return 'bs-border-danger';
                    }
                } else {
                    // return '1px solid transparent';
                    return 'bs-border-invisible';
                }
            });
            target.validationFieldBorder = fieldBorder;
        };

        // SIGNUP FORM

        var realname = ko.observable(create.provfullname).extend({
            required: true,
            minLength: 2,
            maxLength: 100,
            realnameCannotStartWithSpace: true,
            validationFieldBorder: true
        });

        var username = ko.observable().extend({
            required: true,
            minLength: 2,
            maxLength: 100,
            usernameCannotStartWithNumber: true,
            usernameCannotStartWithUnderscore: true,
            usernameValidChars: true,
            usernameMustBeUnique: true,
            validationFieldBorder: true
        });

        // function ordinalEnglish(n) {
        //     var ordinals = [
        //         'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
        //         'ninth', 'tenth'
        //     ];
        //     var word = ordinals[n];
        //     if (word) {
        //         return word;
        //     }
        //     return n + 'th';
        // }

        var fixedUsername = ko.pureComputed(function () {
            var un = username();

            if (!un) {
                return null;
            }

            var upperRe = /[A-Z]/;
            var spaceRe = /[ ]/;
            var digitRe = /\d/;
            var validCharsRe = /[a-z0-9_]/;
            var underscoreRe = /_/;

            var isCorrected = false;

            var initialSkipped = 0;

            var fixed = un.split('').map(function (char, index) {
                // initial character is a number, remove it
                const position = index + 1;
                if (index - initialSkipped === 0 && digitRe.test(char)) {
                    isCorrected = true;
                    initialSkipped += 1;
                    return {
                        position: position,
                        original: char,
                        // there really is not valid replacement, this has the effect of removing the character
                        // this is weird in the case of just two character input, because accepting the correction
                        // will produce an invalid (too-short) username!
                        replacement: '',
                        reason: 'initialdigit',
                        message: 'a number is not allowed as the initial character'
                        // message: 'The ' + ordinalEnglish(index) +  ' character must be a letter a-z, it is: ' + char + ', and has been removed'
                    };
                }
                // initial character is an underscore, remove it
                if (index - initialSkipped === 0 && underscoreRe.test(char)) {
                    isCorrected = true;
                    initialSkipped += 1;
                    return {
                        position: position,
                        original: char,
                        // no useful replacement for an initial underscore, so just remove it for the correction.
                        replacement: '',
                        reason: 'initialunderscore',
                        message: 'the underscore is not allowed as the initial character'
                    };
                }
                // character is uppper case, convert to lower case
                if (upperRe.test(char)) {
                    isCorrected = true;
                    return {
                        position: position,
                        original: char,
                        replacement: char.toLowerCase(),
                        reason: 'uppercase',
                        message: 'letters must be lower case'
                    };
                }
                // character is space, convert to underscore
                if (spaceRe.test(char)) {
                    isCorrected = true;
                    return {
                        position: position,
                        original: char,
                        replacement: '_',
                        reason: 'space',
                        message: 'spaces are not allowed'
                    };
                }

                // catch-all for invalid characters
                if (!validCharsRe.test(char)) {
                    const charCode = char.charCodeAt(0);
                    if (charCode < 32) {
                        isCorrected = true;
                        return {
                            position: position,
                            original: char,
                            replacement: '_',
                            reason: 'control',
                            message: 'control characters are not allowed'
                        };
                    } else if (char.charCodeAt(0) > 127) {
                        isCorrected = true;
                        return {
                            position: position,
                            original: char,
                            replacement: '_',
                            reason: 'noncompliant',
                            message: 'non-ascii characters are not allowed'
                        };
                    } else {
                        isCorrected = true;
                        return {
                            position: position,
                            original: char,
                            replacement: '_',
                            reason: 'symbol',
                            message: 'symbols other than hyphen and underscore are not allowed'
                        };
                    }
                }
                return {
                    position: position,
                    original: char,
                    replacement: char,
                    reason: false,
                    message: false
                };
            });

            if (isCorrected) {
                return {
                    fixed: fixed,
                    replacement: fixed
                        .map(function (fix) {
                            return fix.replacement;
                        })
                        .join('')
                };
            }

            return null;
        });

        function doUseFixedUsername() {
            if (!fixedUsername()) {
                username(null);
            }
            var fixed = fixedUsername()
                .fixed.map(function (corrected) {
                    return corrected.replacement;
                })
                .join('');
            username(fixed);
        }

        var email = ko.observable(create.provemail).extend({
            required: true,
            email: true,
            validationFieldBorder: true
        });

        var organization = ko.observable().extend({
            required: true,
            dirty: false,
            validationFieldBorder: true
        });
        var organizationDataSource = dataSource.getFilter('organizations');
        var department = ko.observable().extend({
            required: true,
            validationFieldBorder: true
        });

        var allValid = ko.pureComputed(function () {
            var valid =
                realname.isValid() &&
                email.isValid() &&
                username.isValid() &&
                // role.isValid() &&
                organization.isValid() &&
                department.isValid();
            return valid;
        });

        var error = {
            code: ko.observable(),
            message: ko.observable(),
            detail: ko.observable(),
            data: ko.observable()
        };

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

        var canSubmit = ko.pureComputed(function () {
            if (!allValid()) {
                return false;
            }

            if (
                policiesToResolve.missing.some(function (item) {
                    return !item.agreed();
                }) ||
                policiesToResolve.outdated.some(function (item) {
                    return !item.agreed();
                })
            ) {
                return false;
            }
            return true;
        });

        subscriptions.add(
            canSubmit.subscribe(function (newCanSubmit) {
                if (newCanSubmit) {
                    signupState('complete');
                } else {
                    signupState('incomplete');
                }
            })
        );

        var signupState = params.signupState;
        signupState('incomplete');

        function createProfile(response) {
            return auth2Client.getMe(response.token.token)
                .then(function (accountInfo) {
                    var userProfileClient = new UserProfileService(runtime.config('services.user_profile.url'), {
                        token: response.token.token
                    });
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
                    return userProfileClient
                        .set_user_profile({
                            profile: newProfile
                        })
                        .catch(function (err) {
                            if (err.status === 500) {
                            // TODO: return fancy error.
                                throw new Error('Profile creation failed: ' + err.error.message);
                            } else {
                                throw err;
                            }
                        });
                });
        }

        function submitSignup() {
            var agreementsToSubmit = [];
            // missing policies
            policiesToResolve.missing.forEach(function (policy) {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with some policies not agreed to');
                }
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
            // outdated policies.
            policiesToResolve.outdated.forEach(function (policy) {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with some policies not agreed to');
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

            return auth2Client
                .loginCreate(data)
                .then(function (result) {
                    return createProfile(result).then(function () {
                        return auth2Session.initializeSession(result.token);
                    });
                })
                .then(function () {
                    signupState('success');
                });
        }

        function doHandleSubmit() {
            alert('please use the submit button below');
        }

        function doSubmitSignup() {
            // validateAll();
            submitSignup()
                .catch(Auth2Error.AuthError, function (err) {
                    console.error('auth error signing up', err);
                    error.code(err.code);
                    error.message(err.message);
                    error.detail(err.detail);
                    error.data(err.data);
                    signupState('error');
                })
                .catch(function (err) {
                    console.error('error signing up', err);
                    signupState('error');
                    if (err.status === 500) {
                        // TODO: switch to generic client for better error handling
                        error.code(String(err.error.name));
                        error.message(err.error.message);
                        error.detail(err.error.error);
                        error.data(err);
                    } else {
                        error.code(err.name);
                        error.message(err.message);
                    }
                })
                .finally(function () {
                    done(true);
                });
        }

        function doSignupSuccess() {
            if (nextRequest) {
                runtime.send('app', 'navigate', nextRequest);
            } else {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }
        }

        // EXPIRATION

        var timeOffset = runtime.service('session').serverTimeOffset();

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
            return expiresIn() <= 0;
        });

        subscriptions.add(
            expired.subscribe(function (newExpired) {
                if (newExpired) {
                    signupState('expired');
                }
            })
        );

        function doCancelChoiceSession() {
            auth2Client
                .loginCancel()
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
                })
                .finally(function () {
                    done(true);
                });
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            choice: choice,
            create: create,
            username: username,
            // usernameFieldBorder: usernameFieldBorder,
            fixedUsername: fixedUsername,
            realname: realname,
            email: email,
            // role: role,
            // roles: roles,
            organization: organization,
            organizationDataSource: organizationDataSource,
            department: department,
            policiesToResolve: policiesToResolve,
            error: error,

            signupState: params.signupState,

            canSubmit: canSubmit,
            doHandleSubmit: doHandleSubmit,
            doSubmitSignup: doSubmitSignup,
            doSignupSuccess: doSignupSuccess,
            doCancelChoiceSession: doCancelChoiceSession,
            //expiration, clock, etc.
            expired: expired,
            expiresIn: expiresIn,
            expiresMessage: expiresMessage,

            // ACTIONS
            doUseFixedUsername: doUseFixedUsername,
            // fieldBorder: fieldBorder

            dispose: dispose
        };
    }

    function requiredIcon(fieldName) {
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css:
                    '{"glyphicon-asterisk text-danger": ' +
                    fieldName +
                    '.isValid() === false, "glyphicon-ok text-success":' +
                    fieldName +
                    '.isValid()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    var buildRealnameField = memoize(function () {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px'
                    },
                    dataBind: {
                        class: 'realname.validationFieldBorder'
                    }
                },
                [
                    label(
                        {
                            for: 'signup_realname'
                        },
                        ['Your Name', requiredIcon('realname')]
                    ),
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
                        class: 'text-danger',
                        style: {
                            padding: '4px'
                        },
                        dataBind: {
                            validationMessage: 'realname'
                        }
                    })
                ]
            ),
            info: div({}, [
                div([p(['This field contains your name as you wish it to be displayed to other KBase users '])]),
                div(
                    {
                        class: 'hidden'
                    },
                    [
                        p([
                            'This name will be displayed to other KBase users until you create your profile. ',
                            'When you create your profile, a new display name will be created which contains ',
                            'additional information, including title, suffix, first and last name. '
                        ]),
                        p([
                            'After you create your profile, that name information will be used for display to ',
                            'other users (when they are logged in), and in Narratives and related data you may publish. ',
                            'When you have a profile, the name shown here ',
                            'on your account will only be visible to KBase staff.'
                        ])
                    ]
                )
            ])
        };
    });

    var buildUsernameField = memoize(function () {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px'
                    },
                    dataBind: {
                        class: 'username.validationFieldBorder'
                    }
                },
                [
                    label(
                        {
                            for: 'signup_username'
                        },
                        ['KBase Username', requiredIcon('username')]
                    ),
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
                    '<!-- ko if: fixedUsername() && fixedUsername().replacement.length > 0-->',
                    div(
                        {
                            class: 'alert alert-warning',
                            style: {
                                margin: '4px'
                            }
                        },
                        [
                            div([
                                'Sorry, KBase isn\'t able to use that string as a username, as detailed below. ',
                                'You may use the suggestion below or type something else that you prefer.'
                            ]),

                            div(
                                {
                                    class: 'form'
                                },
                                [
                                    div(
                                        {
                                            class: 'input-group'
                                        },
                                        [
                                            div(
                                                {
                                                    style: {
                                                        fontFamily: 'monospace'
                                                    },
                                                    type: 'text',
                                                    class: 'form-control',
                                                    // disabled: true,
                                                    readonly: true,
                                                    dataBind: {
                                                        foreach: 'fixedUsername().fixed'
                                                    },
                                                    title: [
                                                        'This is a "corrected" version of your username. ',
                                                        'You may use it by clicking the button to the right, ',
                                                        'or correct the username input above yourself'
                                                    ].join('')
                                                },
                                                span({
                                                    dataBind: {
                                                        text: 'replacement'
                                                    }
                                                })
                                            ),
                                            div(
                                                {
                                                    class: 'input-group-addon',
                                                    style: {
                                                        padding: '0'
                                                    }
                                                },
                                                div(
                                                    {
                                                        class: 'btn btn-success btn-xs btn-kb-flat',
                                                        dataBind: {
                                                            click: '$component.doUseFixedUsername'
                                                        },
                                                        title: 'Click me to use the "corrected" username'
                                                    },
                                                    span({
                                                        class: 'fa fa-check'
                                                    })
                                                )
                                            )
                                        ]
                                    )
                                ]
                            ),
                            ul(
                                {
                                    style: {
                                        listStyleType: '"@ "'
                                    },
                                    dataBind: {
                                        foreach: 'fixedUsername().fixed'
                                    }
                                },
                                [
                                    '<!-- ko if: message -->',
                                    li([
                                        'character ',
                                        span({
                                            dataBind: {
                                                text: 'position'
                                            }
                                        }),
                                        ': ',
                                        span({
                                            dataBind: {
                                                text: 'message'
                                            }
                                        })
                                    ]),
                                    '<!-- /ko -->'
                                ]
                            )
                        ]
                    ),
                    '<!-- /ko -->',
                    div({
                        // class: 'alert alert-danger',
                        class: 'text-danger',
                        style: {
                            padding: '4px'
                        },
                        dataBind: {
                            validationMessage: 'username'
                        }
                    })
                ]
            ),
            info: div([
                div({}, [
                    p([
                        'Your KBase username is the primary identifier associated with all of your work and assets within ',
                        ' KBase.'
                    ]),
                    p(
                        {
                            style: {
                                fontWeight: 'bold'
                            }
                        },
                        ['Your username is permanent and may not be changed later, so please choose wisely.']
                    )
                ]),
                div(
                    {
                        class: 'hidden'
                    },
                    [p(['Is there anything else to say?'])]
                )
            ])
        };
    });

    var buildEmailField = memoize(function () {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px'
                    },
                    dataBind: {
                        class: 'email.validationFieldBorder'
                    }
                },
                [
                    label(
                        {
                            for: 'signup_email'
                        },
                        ['Email', requiredIcon('email')]
                    ),
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
                        class: 'text-danger',
                        style: {
                            padding: '4px'
                        },
                        dataBind: {
                            validationMessage: 'email'
                        }
                    })
                ]
            ),
            info: div([
                div({}, [
                    p([
                        'KBase may occasionally use this email address to communicate important information about KBase or your account.'
                    ]),
                    p([
                        'KBase will not share your email address with anyone, and other KBase users will not be able to see it.'
                    ])
                ]),
                div(
                    {
                        class: 'hidden'
                    },
                    [p(['Is there anything else to say?'])]
                )
            ])
        };
    });

    var buildOrganizationField = memoize(function () {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px'
                    },
                    dataBind: {
                        class: 'organization.validationFieldBorder'
                    }
                },
                [
                    label(['Organization', requiredIcon('organization')]),
                    div({
                        dataBind: {
                            component: {
                                name: TypeaheadInputComponent.quotedName(),
                                params: {
                                    inputValue: 'organization',
                                    dataSource: 'organizationDataSource'
                                }
                            }
                        }
                    }),
                    div({
                        class: 'text-danger',
                        style: {
                            padding: '4px'
                        },
                        dataBind: {
                            validationMessage: 'organization'
                        }
                    })
                ]
            ),
            info: ''
        };
    });

    var buildDepartmentField = memoize(function () {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px'
                    },
                    dataBind: {
                        class: 'department.validationFieldBorder'
                    }
                },
                [
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
                        class: 'text-danger',
                        style: {
                            padding: '4px'
                        },
                        dataBind: {
                            validationMessage: 'department'
                        }
                    })
                ]
            ),
            info: ''
        };
    });

    function buildSignupForm() {
        return div(
            {
                dataBind: {
                    if: 'signupState() === "incomplete" || signupState() === "complete"'
                }
            },
            BS.buildPanel({
                type: 'default',
                title: 'Sign up for KBase',
                body: div(
                    {
                        // id: vm.form.id
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
                                        p([
                                            'Some field values have been pre-populated from your ',
                                            span({ dataBind: 'text: choice.provider' }),
                                            ' account.'
                                        ])
                                    ]
                                )
                            ]
                        ),
                        form(
                            {
                                dataElement: 'form',
                                autocomplete: 'off'
                            },
                            [
                                div(
                                    {
                                        class: 'row'
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            buildRealnameField().field
                                        ),
                                        div(
                                            {
                                                class: 'col-md-7',
                                                style: {
                                                    paddingTop: '20px'
                                                }
                                            },
                                            buildRealnameField().info
                                        )
                                    ]
                                ),

                                div(
                                    {
                                        class: 'row'
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            buildEmailField().field
                                        ),
                                        div(
                                            {
                                                class: 'col-md-7',
                                                style: {
                                                    paddingTop: '20px'
                                                }
                                            },
                                            buildEmailField().info
                                        )
                                    ]
                                ),

                                div(
                                    {
                                        class: 'row'
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            buildUsernameField().field
                                        ),
                                        div(
                                            {
                                                class: 'col-md-7',
                                                style: {
                                                    paddingTop: '20px'
                                                }
                                            },
                                            buildUsernameField().info
                                        )
                                    ]
                                ),

                                div(
                                    {
                                        class: 'row'
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            buildOrganizationField().field
                                        ),
                                        div(
                                            {
                                                class: 'col-md-7',
                                                style: {
                                                    paddingTop: '20px'
                                                }
                                            },
                                            buildOrganizationField().info
                                        )
                                    ]
                                ),

                                div(
                                    {
                                        class: 'row'
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            buildDepartmentField().field
                                        ),
                                        div({
                                            class: 'col-md-7',
                                            style: {
                                                paddingTop: '20px'
                                            }
                                        })
                                    ]
                                ),
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
                                                    dataBind: {
                                                        component: {
                                                            name: PolicyResolverComponent.quotedName(),
                                                            params: {
                                                                policiesToResolve: 'policiesToResolve'
                                                            }
                                                        }
                                                    }
                                                })
                                            ]
                                        )
                                    ]
                                ),
                                div(
                                    {
                                        class: 'row',
                                        style: {
                                            marginTop: '20px'
                                        }
                                    },
                                    [
                                        div(
                                            {
                                                class: 'col-md-5'
                                            },
                                            [
                                                button(
                                                    {
                                                        class: 'btn btn-primary',
                                                        type: 'button',
                                                        dataElement: 'submit-button',
                                                        dataBind: {
                                                            click: 'doSubmitSignup',
                                                            disable: '!canSubmit()'
                                                        }
                                                    },
                                                    'Create KBase Account'
                                                ),
                                                button(
                                                    {
                                                        type: 'button',
                                                        class: 'btn btn-danger btn-sm',
                                                        style: {
                                                            marginLeft: '10px'
                                                        },
                                                        dataBind: {
                                                            click: 'doCancelChoiceSession'
                                                        }
                                                    },
                                                    'Cancel Sign-Up'
                                                )
                                            ]
                                        ),
                                        div({
                                            class: 'col-md-7'
                                        })
                                    ]
                                )
                            ]
                        )
                    ]
                )
            })
        );
    }

    function buildSuccessResponse() {
        return div(
            {
                class: 'row',
                dataBind: {
                    if: 'signupState() === "success"'
                }
            },
            div(
                {
                    style: {
                        marginTop: '20px'
                    }
                },
                BS.buildPanel({
                    type: 'success',
                    title: 'KBase Account Successfully Created',
                    body: div([
                        p('Your new KBase account has been created and is ready to be used.'),
                        div([
                            button(
                                {
                                    class: 'btn btn-primary',
                                    dataBind: {
                                        click: 'doSignupSuccess'
                                    }
                                },
                                'Continue'
                            )
                        ])
                    ])
                })
            )
        );
    }

    function buildErrorResponse() {
        return div(
            {
                class: 'row',
                dataBind: {
                    if: 'signupState() === "error"'
                }
            },
            div(
                {
                    style: {
                        marginTop: '20px'
                    }
                },
                BS.buildPanel({
                    type: 'error',
                    title: 'Auth Error',
                    body: div({
                        dataBind: {
                            component: {
                                name: ErrorViewComponent.quotedName(),
                                params: {
                                    code: 'error.code',
                                    message: 'error.message',
                                    detail: 'error.detail',
                                    data: 'error.data'
                                }
                            }
                        }
                    })
                })
            )
        );
    }

    function buildExpired() {
        return div(
            {
                dataBind: {
                    if: 'expired'
                }
            },
            [
                h1(['Expired']),
                p(['Your sign-up session has expired.']),
                p(['Once you start the sign-in or sign-up process, you have 30 minutes to complete it.']),
                p([
                    'You should visit the ',
                    a(
                        {
                            href: '/#login'
                        },
                        'sign-in page'
                    ),
                    ' make another attempt to sign in or sign up.'
                ])
            ]
        );
    }

    function template() {
        return div(
            {
                dataBind: {
                    validationOptions: {
                        insertMessages: 'false'
                    }
                }
            },
            [
                div({
                    name: 'error'
                }),
                buildSuccessResponse(),
                buildErrorResponse(),
                buildExpired(),
                buildSignupForm()
            ]
        );
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    return reg.registerComponent(component);
});
