define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    'kb_common/format'
], function (
    ko,
    reg,
    gen,
    html,
    Format
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        h3 = t('h3'),
        span = t('span'),
        label = t('label'),
        p = t('p'),
        input = t('input'),
        button = t('button');

    const fields = {
        realname: {
            name: 'realname',
            label: 'Name',
            type: 'text',
            placeholder: 'Your Real Name',
            description: 'Your real name, displayed to other KBase users',
            more: div([
                p([
                    'Your "real" name is free text and may be changed at any time. ',
                    'It will be displayed in most contexts in which your username is displayed.'
                ])
            ])
        },
        username: {
            name: 'username',
            label: 'Username',
            description: 'Your username may not be changed',
            more: div([
                p([
                    'You many not change your username after your account is created.'
                ]),
                p([
                    'The username associates your account with the Narratives, data, ',
                    'and applications you create within KBase. It is also recorded with internal log files ',
                    'and other records to assist in providing services, metrics and support.'
                ])
            ])
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

        email: {
            name: 'email',
            label: 'E-Mail',
            type: 'text',
            placeholder: 'Your E-Mail Address',
            description: span([
                'Your email address may be used by KBase staff to contact you. '
            ]),
            more: div([
                p([
                    'The email address will not be displayed to other users. ',
                    'It will only be used to contact you in case of issues relating to your account, ',
                    'data, applications, or jobs. '
                ]),
                p([
                    'At a future time it may be used to provide account recovery in case of loss of access to your account.'
                ])
            ])
        }
    };

    class UserInfoEditor {
        constructor({ doSave, email, realname, username, created, lastLogin }) {
            this.doSave = doSave;

            this.email = ko.observable(email)
                .extend({
                    // required: true,
                    // email: true,
                    dirty: false,
                    constraint: {
                        required: true,
                        autoTrim: true,
                        validate: (value) => {
                            // regex from: https://www.regular-expressions.info
                            const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                            if (!regex.test(value)) {
                                return 'Please enter a valid email address'
                            }
                        }
                    }
                });

            this.realname = ko.observable(realname)
                .extend({
                    // required: true,
                    dirty: false,
                    constraint: {
                        required: true,
                        autoTrim: true,
                        validate: (value) => {
                            // if (value.length < 1) {
                            //     return 'Your name must be at least one characters long';
                            // }
                            if (value.length > 50) {
                                return 'Your name cannot be longer than 50 characters';
                            }
                        }
                    }
                });

            this.editorFields = [this.email, this.realname];

            this.username = ko.observable(username);
            this.created = ko.observable(created);
            this.lastLogin = ko.observable(lastLogin);

            this.createdAt = ko.pureComputed(() => {
                return Format.niceTime(this.created());
            });
            this.lastLoginAt = ko.pureComputed(() => {
                return Format.niceElapsedTime(this.lastLogin()) +
                    ' (' +
                    Format.niceTime(this.lastLogin()) +
                    ')';
            });

            this.more = {};
            Object.keys(fields).forEach((key) => {
                this.more[key] = ko.observable(true);
            });

            this.message = ko.observable();
            this.messageType = ko.observable();

            this.canSave = ko.observable(false);

            this.someDirty = ko.pureComputed(() => {
                // some are dirty
                return this.editorFields.some((field) => {
                    return field.isDirty();
                });
            });

            this.someInvalid = ko.pureComputed(() => {
                return this.editorFields.some((field) => {
                    if (field.constraint) {
                        return !field.constraint.isValid();
                    }
                    return false;
                });
            });

            this.canSave = ko.pureComputed(() => {
                const d = this.someDirty();
                const iv = this.someInvalid();
                return d && !iv;
            });
        }

        showMore(name) {
            if (this.more[name]()) {
                this.more[name](false);
            } else {
                this.more[name](true);
            }
        }

        save() {
            this.doSave({
                realname: this.realname(),
                email: this.email()
            })
                .then(() => {
                    this.message('Successfully Saved');
                    this.messageType({
                        'alert-success': true,
                        hidden: false
                    });
                    this.editorFields.forEach((field) => {
                        field.markClean();
                    });
                })
                .catch((err) => {
                    console.error('boo', err);
                    this.message('Error Saving! ' + err.message);
                    this.messageType({
                        'alert-danger': true,
                        hidden: false
                    });
                });
        }
    }

    function fieldDoc(description, content, name) {
        return div({
            dataElement: 'more'
        }, [
            div([
                span({
                    style: {
                        padding: '2px',
                        cursor: 'pointer'
                    },
                    dataElement: 'button',
                    dataBind: {
                        click: 'showMore.bind($data, "' + name + '")'
                    }
                }, span({
                    dataElement: 'label'
                }, [
                    description,
                    span({
                        class: 'fa ',
                        style: {
                            marginLeft: '5px',
                        },
                        dataBind: {
                            css: {
                                '"fa-caret-right"': 'more.' + name + '()',
                                '"fa-caret-down"': '!more.' + name + '()'
                            }
                        }
                    })
                ]))
            ]),
            div({
                dataBind: 'css: {hidden: more.' + name + '()}',
                dataElement: 'content',
                style: {
                    border: '1px silver dashed',
                    padding: '6px'
                }
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
                    }),
                    gen.if(field.name + '.constraint.isValid() === false',
                        div({
                            class: 'alert alert-danger',
                            dataBind: {
                                html: field.name + '.constraint.message'
                            }
                        }))
                    // gen.if(field.name + '.constraint.state() === "invalid"',
                    //     div({
                    //         class: 'alert alert-danger',
                    //         dataBind: {
                    //             html: field.name + '.constraint.message'
                    //         }
                    //     }))
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    fieldDoc(field.description, field.more, field.name)
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
                }, [
                    div({
                        dataBind: 'text: ' + (field.vmId || field.name)
                    })
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    fieldDoc(field.description, field.more, field.name)
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
            },
            class: 'container-fluid'
        }, [
            h3('Edit Account'),
            buildInput(fields.realname),
            buildInput(fields.email),
            button({
                class: 'btn btn-primary',
                type: 'button',
                dataBind: {
                    click: 'save',
                    enable: 'canSave'
                }
            }, 'Save'),
            buildMessageDisplay(),
            h3('Account Info'),
            buildDisplay(fields.username),
            buildDisplay(fields.created),
            buildDisplay(fields.lastLogin)
        ]);
        return content;
    }

    function component() {
        return {
            viewModel: UserInfoEditor,
            template: buildForm()
        };
    }
    // return ko.kb.registerComponent(component);

    return reg.registerComponent(component);
});