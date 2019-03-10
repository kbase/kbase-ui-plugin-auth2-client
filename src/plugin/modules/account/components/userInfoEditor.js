define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html',
    'kb_common/format'
], function (
    ko,
    reg,
    html,
    Format
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        p = t('p'),
        input = t('input'),
        button = t('button');

    const fields = {
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
        constructor({ doSave, email, username, created, lastLogin }) {
            this.doSave = doSave;

            this.email = ko.observable(email)
                .extend({
                    required: true,
                    email: true
                });

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
                email: this.email()
            })
                .then(() => {
                    this.message('Successfully Saved');
                    this.messageType({
                        'alert-success': true,
                        hidden: false
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
            buildDisplay(fields.username),
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
            viewModel: UserInfoEditor,
            template: buildForm()
        };
    }
    // return ko.kb.registerComponent(component);

    return reg.registerComponent(component);
});