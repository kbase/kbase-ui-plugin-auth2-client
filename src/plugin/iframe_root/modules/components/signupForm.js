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
    './errorView',
    'yaml!../../resources/data/referralSources.yaml',
], (
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
    ErrorViewComponent,
    referralSourceData
) => {
    const t = html.tag,
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
        small = t('small'),
        input = t('input');

    function memoize(fun) {
        let run = false;
        let value;
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
        const subscriptions = new SubscriptionManager();
        const choice = params.choice;
        const done = params.done;
        const create = choice.create[0];
        const runtime = params.runtime;
        const nextRequest = params.nextRequest;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        const auth2Session = new MAuth2Session.Auth2Session({
            cookieName: runtime.config('ui.services.session.cookie.name'),
            extraCookies: [],
            baseUrl: runtime.config('services.auth2.url'),
            providers: runtime.config('services.auth2.providers')
        });

        const dataSource = DataSource({
            path: `${runtime.pluginResourcePath  }/dataSources/`,
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
                            translate(item) {
                                return {
                                    value: item.name,
                                    label: `${item.name  } (${  item.initials  })`
                                };
                            }
                        },
                        otherLabs: {
                            translate(item) {
                                return {
                                    value: item.name,
                                    label: `${item.name  } (${  item.initials  })`
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
            validator(val) {
                if (/^\s+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'Your name may not begin with a space'
        };

        ko.validation.rules['usernameValidChars'] = {
            validator(val) {
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
            validator(val) {
                if (/^[0-9]+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may not begin with a number'
        };
        ko.validation.rules['usernameCannotStartWithUnderscore'] = {
            validator(val) {
                if (/^_+/.test(val)) {
                    return false;
                }
                return true;
            },
            // message: ''
            message: 'A username may not start with the underscore character _'
        };
        ko.validation.rules['usernameNoSpaces'] = {
            validator(val) {
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
            validator(val, params, callback) {
                auth2Client
                    .loginUsernameSuggest(username())
                    .then((results) => {
                        if (results.availablename !== username()) {
                            callback({
                                isValid: results.available,
                                message:
                                    `This username is not available: a suggested available username is ${
                                        results.availablename}`
                            });
                        } else {
                            callback({
                                isValid: true
                            });
                        }
                    })
                    .catch((err) => {
                        console.error('err', err);
                        callback({
                            isValid: false,
                            message: `Error checking for username: ${  err.message}`
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
            const fieldBorder = ko.pureComputed(() => {
                if (target.isValidating()) {
                    // return '1px solid yellow';
                    return 'bs-border-warning';
                }
                if (target.isModified()) {
                    if (target.isValid()) {
                        // return '1px solid transparent';
                        return 'bs-border-invisible';
                    }
                    // return '1px solid red';
                    return 'bs-border-danger';

                }
                // return '1px solid transparent';
                return 'bs-border-invisible';

            });
            target.validationFieldBorder = fieldBorder;
        };

        // SIGNUP FORM

        const realname = ko.observable(create.provfullname).extend({
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

        const fixedUsername = ko.pureComputed(() => {
            const un = username();

            if (!un) {
                return null;
            }

            const upperRe = /[A-Z]/;
            const spaceRe = /[ ]/;
            const digitRe = /\d/;
            const validCharsRe = /[a-z0-9_]/;
            const underscoreRe = /_/;

            let isCorrected = false;

            let initialSkipped = 0;

            const fixed = un.split('').map((char, index) => {
                // initial character is a number, remove it
                const position = index + 1;
                if (index - initialSkipped === 0 && digitRe.test(char)) {
                    isCorrected = true;
                    initialSkipped += 1;
                    return {
                        position,
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
                        position,
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
                        position,
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
                        position,
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
                            position,
                            original: char,
                            replacement: '_',
                            reason: 'control',
                            message: 'control characters are not allowed'
                        };
                    } else if (char.charCodeAt(0) > 127) {
                        isCorrected = true;
                        return {
                            position,
                            original: char,
                            replacement: '_',
                            reason: 'noncompliant',
                            message: 'non-ascii characters are not allowed'
                        };
                    }
                    isCorrected = true;
                    return {
                        position,
                        original: char,
                        replacement: '_',
                        reason: 'symbol',
                        message: 'symbols other than hyphen and underscore are not allowed'
                    };

                }
                return {
                    position,
                    original: char,
                    replacement: char,
                    reason: false,
                    message: false
                };
            });

            if (isCorrected) {
                return {
                    fixed,
                    replacement: fixed
                        .map((fix) => {
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
            const fixed = fixedUsername()
                .fixed.map((corrected) => {
                    return corrected.replacement;
                })
                .join('');
            username(fixed);
        }

        const email = ko.observable(create.provemail).extend({
            required: true,
            email: true,
            validationFieldBorder: true
        });

        const organization = ko.observable().extend({
            required: true,
            dirty: false,
            validationFieldBorder: true
        });
        const organizationDataSource = dataSource.getFilter('organizations');
        const department = ko.observable().extend({
            required: true,
            validationFieldBorder: true
        });

        const referralSourceCopy = 'How did you hear about us?';
        const selectedReferralSources = ko.observableArray().extend({
            required: true,
        });
        const referralSources = ko.observableArray(
            referralSourceData
                .filter((sourceData) => sourceData.active)
                .map((sourceData) => {
                    const source = {
                        name: sourceData.name,
                        id: sourceData.id,
                        textinput: sourceData.textinput,
                        selected: ko.computed(() => selectedReferralSources.indexOf(sourceData.id) != -1),
                    };
                    if (source.textinput) {
                        source.value = ko.observable().extend({
                            required: {
                                onlyIf: source.selected,
                                message: 'This field is required when checked.',
                            },
                        });
                    }
                    return source;
                })
        );

        const allValid = ko.pureComputed(() => {
            const valid =
                realname.isValid() &&
                email.isValid() &&
                username.isValid() &&
                // role.isValid() &&
                organization.isValid() &&
                department.isValid();
            return valid;
        });

        const error = {
            code: ko.observable(),
            message: ko.observable(),
            detail: ko.observable(),
            data: ko.observable()
        };

        const policiesToResolve = {
            missing: params.policiesToResolve.missing.map((item) => {
                return {
                    id: item.id,
                    version: item.version,
                    policy: item.policy,
                    viewPolicy: ko.observable(false),
                    agreed: ko.observable(false)
                };
            }),
            outdated: params.policiesToResolve.outdated.map((item) => {
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

        const canSubmit = ko.pureComputed(() => {
            if (!allValid()) {
                return false;
            }

            if (
                policiesToResolve.missing.some((item) => {
                    return !item.agreed();
                }) ||
                policiesToResolve.outdated.some((item) => {
                    return !item.agreed();
                })
            ) {
                return false;
            }
            return true;
        });

        subscriptions.add(
            canSubmit.subscribe((newCanSubmit) => {
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
                .then((accountInfo) => {
                    const userProfileClient = new UserProfileService(runtime.config('services.user_profile.url'), {
                        token: response.token.token
                    });
                    const newProfile = {
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
                                department: department(),
                            },
                            surveydata: {
                                referralSources: {
                                    question: referralSourceCopy,
                                    response: referralSources().reduce((responses, source) => {
                                        if (source.selected() && source.textinput) {
                                            responses[source.id] = source.value() || '';
                                        } else {
                                            responses[source.id] = source.selected();
                                        }
                                        return responses;
                                    }, {}),
                                },
                            },
                        },
                    };
                    return userProfileClient
                        .set_user_profile({
                            profile: newProfile
                        })
                        .catch((err) => {
                            if (err.status === 500) {
                            // TODO: return fancy error.
                                throw new Error(`Profile creation failed: ${  err.error.message}`);
                            } else {
                                throw err;
                            }
                        });
                });
        }

        function submitSignup() {
            const agreementsToSubmit = [];
            // missing policies
            policiesToResolve.missing.forEach((policy) => {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with some policies not agreed to');
                }
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });
            // outdated policies.
            policiesToResolve.outdated.forEach((policy) => {
                if (!policy.agreed()) {
                    throw new Error('Cannot submit with some policies not agreed to');
                }
                // agreementsToSubmit.push([policy.id, policy.version].join('.'));
                agreementsToSubmit.push({
                    id: policy.id,
                    version: policy.version
                });
            });

            const data = {
                id: create.id,
                user: username(),
                display: realname(),
                email: email(),
                linkall: false,
                policyids: agreementsToSubmit.map((a) => {
                    return [a.id, a.version].join('.');
                })
            };

            return auth2Client
                .loginCreate(data)
                .then((result) => {
                    return createProfile(result).then(() => {
                        return auth2Session.initializeSession(result.token);
                    });
                })
                .then(() => {
                    signupState('success');
                });
        }

        function doHandleSubmit() {
            alert('please use the submit button below');
        }

        function doSubmitSignup() {
            // validateAll();
            submitSignup()
                .catch(Auth2Error.AuthError, (err) => {
                    console.error('auth error signing up', err);
                    error.code(err.code);
                    error.message(err.message);
                    error.detail(err.detail);
                    error.data(err.data);
                    signupState('error');
                })
                .catch((err) => {
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
                .finally(() => {
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

        const timeOffset = runtime.service('session').serverTimeOffset();

        const now = ko.observable(new Date().getTime());

        // var servertime = choice.servertime;
        const expiresIn = ko.pureComputed(() => {
            if (!choice.expires) {
                return '';
            }
            // for testing: return choice.expires - now() - timeOffset - (27 * 60 * 1000);
            return choice.expires - now() - timeOffset;
        });
        const expiresMessage = ko.pureComputed(() => {
            return format.niceDuration(expiresIn());
        });
        const expired = ko.pureComputed(() => {
            return expiresIn() <= 0;
        });

        subscriptions.add(
            expired.subscribe((newExpired) => {
                if (newExpired) {
                    signupState('expired');
                }
            })
        );

        function doCancelChoiceSession() {
            auth2Client
                .loginCancel()
                .then(() => {
                    runtime.send('app', 'navigate', {
                        path: 'login'
                    });
                })
                .catch(Auth2Error.AuthError, (err) => {
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
                .catch((err) => {
                    console.error('[doCancelChoiceSession]', err);
                    error({
                        code: err.name,
                        message: err.message,
                        detail: '',
                        data: ko.observable({})
                    });
                })
                .finally(() => {
                    done(true);
                });
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            choice,
            create,
            username,
            // usernameFieldBorder: usernameFieldBorder,
            fixedUsername,
            realname,
            email,
            // role: role,
            // roles: roles,
            organization,
            organizationDataSource,
            department,
            referralSources,
            referralSourceCopy,
            selectedReferralSources,
            policiesToResolve,
            error,

            signupState: params.signupState,

            canSubmit,
            doHandleSubmit,
            doSubmitSignup,
            doSignupSuccess,
            doCancelChoiceSession,
            //expiration, clock, etc.
            expired,
            expiresIn,
            expiresMessage,

            // ACTIONS
            doUseFixedUsername,
            // fieldBorder: fieldBorder

            dispose
        };
    }

    function requiredIcon(fieldName) {
        const result = span({
            class: 'glyphicon',
            dataBind: {
                css:
                    `{"glyphicon-asterisk text-danger": ${
                        fieldName
                    }.isValid() === false, "glyphicon-ok text-success":${
                        fieldName
                    }.isValid()}`
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    const buildRealnameField = memoize(() => {
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

    const buildUsernameField = memoize(() => {
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

    const buildEmailField = memoize(() => {
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

    const buildOrganizationField = memoize(() => {
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

    const buildDepartmentField = memoize(() => {
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

    const buildReferralField = memoize(() => {
        return {
            field: div(
                {
                    class: 'form-group',
                    style: {
                        padding: '2px',
                    },
                    dataBind: {
                        class: 'selectedReferralSources.validationFieldBorder'
                    }
                },
                [
                    label([
                        span({dataBind: {text: 'referralSourceCopy'}}),
                        requiredIcon('selectedReferralSources'),
                    ]),
                    p([small(['(select all that apply)'])]),
                    div({
                        class: 'text-danger',
                        style: {
                            padding: '4px',
                        },
                        dataBind: {
                            validationMessage: 'selectedReferralSources',
                        },
                    }),
                    '<!-- ko foreach: referralSources -->',
                    div({class: 'checkbox'}, [
                        label([
                            input({
                                type: 'checkbox',
                                dataBind: {
                                    checkedValue: '$data.id',
                                    checked: '$component.selectedReferralSources',
                                },
                            }),
                            span({dataBind: {text: '$data.name'}}),
                            '<!-- ko if: $data.textinput -->',
                            ' ',
                            div({
                                class: 'text-danger',
                                style: {
                                    padding: '4px',
                                },
                                dataBind: {
                                    validationMessage: '$data.value',
                                },
                            }),
                            div({class: 'form-inline'}, [
                                input({
                                    class: 'form-control',
                                    placeholder: 'Please specify',
                                    dataBind: {
                                        class: '$data.value.validationFieldBorder',
                                        visible: '$data.selected',
                                        textInput: '$data.value',
                                    },
                                }),
                                span({dataBind: {visible: '$data.selected'}}, [requiredIcon('$data.value')]),
                            ]),
                            '<!-- /ko -->',
                        ]),
                    ]),
                    '<!-- /ko -->',
                ]
            ),
            info: '',
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
                                            span({dataBind: 'text: choice.provider'}),
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
                                                class: 'col-md-5'
                                            },
                                            buildReferralField().field
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
            viewModel,
            template: template()
        };
    }
    return reg.registerComponent(component);
});
