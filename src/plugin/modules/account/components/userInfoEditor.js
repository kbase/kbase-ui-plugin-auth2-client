define([
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    'knockout',
    'knockout-validation',
], function (
    html,
    BS,
    Format,
    ko
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        p = t('p'),
        input = t('input'),
        button = t('button');

    var fields = {        
        username: {
            name: 'username',
            label: 'Username',
            description: 'Your username may not be changed',
            more: 'You many not change this information, it is for display only'
        },
        created: {
            name: 'created',
            vmId: 'createdAt',
            label: 'Account Created',
            description: 'The date and time at which you signed up for KBase',
            more: 'You many not change this information, it is for display only'
        },
        lastLogin: {
            name: 'lastLogin',
            vmId: 'lastLoginAt',
            label: 'Last Signin Time',
            description: 'The date and time you last signed in to KBase',
            more: 'You many not change this information, it is for display only'
        },
        realname: {
            name: 'realname',
            label: 'Name',
            type: 'text',
            placeholder: 'Your Name',
            description: div([
                p([
                    'This field contains your name as you wish it to be displayed to other KBase users ',
                    ' as well as KBase staff.'
                ])
            ]),
            more: div([
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
        },
        email: {
            name: 'email',
            label: 'E-Mail',
            type: 'text',
            placeholder: 'Your E-Mail Address',
            description: div([
                p([
                    'Your email address may be used by KBase staff to contact you. ',
                    'It will not be displayed to other users.'
                ])
            ]),
            more: div([
                p([
                    'This email address is'
                ])
            ])
        }
    };

    function more(content, name) {
        return div({
            dataElement: 'more'
        }, [
            div([
                button({
                    type: 'button',
                    class: 'btn btn-link',
                    style: {
                        padding: '2px',
                        lineHeight: '1'
                    },
                    dataElement: 'button',
                    dataBind: {
                        click: 'showMore.bind($data, "' + name +'")'
                    }
                }, span({
                    dataElement: 'label'
                }, span({
                    class: 'fa ',
                    dataBind: {
                        css: {
                            '"fa-caret-right"': 'more.' + name + '()' ,
                            '"fa-caret-down"': '!more.' + name + '()'
                        }
                    }
                })))
            ]),
            div({
                dataBind: 'css: {hidden: more.' + name + '()}',
                dataElement: 'content'
            }, content)
        ]);
    }

    function wrapString(s) {
        return '"' + s + '"';
    }

    function buildInput(field) {
        var id = html.genId();
        return div({
            class: 'form-group'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, label({
                    for: id
                }, field.label))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    input({
                        type: 'text',
                        class: 'form-control',
                        id: id,
                        placeholder: field.placeholder,
                        dataBind: {
                            value: field.vmId || field.name,
                            valueUpdate: wrapString('afterkeydown')
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId || field.name
                        }
                    })
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    field.description,
                    more(field.more, field.name)
                ])
            ])
        ]);
    }

    function buildDisplay(field) {
        var id = html.genId();
        return div({
            class: 'form-group'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, label({
                    for: id
                }, field.label))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                },
                div({
                    dataBind: 'text: ' + (field.vmId || field.name)
                })
                ),
                div({
                    class: 'col-md-6'
                }, [
                    field.description,
                    more(field.more, field.name)
                ])
            ])
        ]);
    }

    function buildMessageDisplay() {
        return div({
            class: 'hidden alert',
            style: {
                marginTop: '10px'
            },
            dataBind: 'css: messageType'
        }, [
            button({
                type: 'button',
                class: 'close',
                dataDismiss: 'alert',
                ariaLabel: 'Close'
            }, span({
                ariaHidden: 'true'
            }, '&times;')),
            div({
                dataBind: 'text: message'
            })
        ]);
    }

    function buildForm() {
        var content = div({
            dataBind: {
                validationOptions: {
                    insertMessages: 'false'
                }
            }            
        }, [
            buildDisplay(fields.username),
            buildInput(fields.realname),
            buildInput(fields.email),
            buildDisplay(fields.created),
            buildDisplay(fields.lastLogin),
            button({
                class: 'btn btn-primary',
                type: 'button',
                dataBind: {
                    click: 'save'
                }
            }, 'Save'),
            buildMessageDisplay()
        ]);
        return content;
    }

    function component() {
        return {
            viewModel: function (data) {
                var doSave = data.doSave;

                var email = ko.observable(data.email)
                    .extend({
                        required: true,
                        email: true
                    });

                var realname = ko.observable(data.realname)
                    .extend({
                        required: true,
                        minLength: 2,
                        maxLength: 100
                    });

                var username = ko.observable(data.username);
                var created = ko.observable(data.created);
                var lastLogin = ko.observable(data.lastLogin);

                var createdAt = ko.pureComputed(function () {
                    return Format.niceTime(created());
                });
                var lastLoginAt = ko.pureComputed(function () {
                    return Format.niceElapsedTime(lastLogin()) + 
                           ' (' + 
                           Format.niceTime(lastLogin()) +
                           ')';
                });

                // var realnameMore = ko.observable(true);
                // var emailMore = ko.observable(true);

                var more = {};
                Object.keys(fields).forEach(function (key) {
                    more[key] = ko.observable(true);
                });

                function showMore (name) {
                    if (more[name]()) {
                        more[name](false);
                    } else {
                        more[name](true);
                    }
                }

                function save () {
                    doSave({
                        display: realname(),
                        email: email()
                    })
                    .then(function () {
                        message('Successfully Saved');
                        messageType({
                            'alert-success': true,
                            hidden: false
                        });
                    })
                    .catch(function (err) {
                        console.error('boo', err);
                    });
                }

                var message = ko.observable();
                var messageType = ko.observable();

                return {
                    realname: realname,
                    email: email,
                    username: username,
                    created: created,
                    lastLogin: lastLogin,
                    createdAt: createdAt,
                    lastLoginAt: lastLoginAt,
                    showMore: showMore,
                    more: more,
                    save: save,
                    message: message,
                    messageType: messageType
                };
            },
            template: buildForm()
        };
    }
    ko.components.register('user-info-editor', component());
});