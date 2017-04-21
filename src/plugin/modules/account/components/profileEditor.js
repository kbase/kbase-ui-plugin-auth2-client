define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    'kb_service/userProfile',
    '../../components/typeaheadInput'
], function (
    ko,
    html,
    BS,
    Format,
    UserProfile,
    TypeaheadInput
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        a = t('a'),
        p = t('p'),
        input = t('input'),
        textarea = t('textarea'),
        button = t('button'),
        select = t('select'),
        option = t('option'),
        img = t('img');

    var fields = {
        title: {
            name: 'title',
            label: 'Title',
            required: true,
            description: 'Your title or honorific',
            more: div([
                p([
                    'additional details here...'
                ])
            ]),
            availableValues: [{
                id: 'mr',
                label: 'Mr.'
            }, {
                id: 'ms',
                label: 'Ms.'
            }, {
                id: 'miss',
                label: 'Miss'
            }, {
                id: 'mrs',
                label: 'Mrs.'
            }, {
                id: 'dr',
                label: 'Dr.'
            }, {
                id: 'prof',
                label: 'Prof.'
            }]
        },
        suffix: {
            name: 'suffix',
            required: false,
            label: 'Suffix',
            description: 'A suffix to your name',
            more: div([
                p([
                    'additional details here...'
                ])
            ])
        },

        organization: {
            name: 'organization',
            required: true,
            label: 'Organization',
            description: 'Your primary association - organization, institution, business',
            more: div([
                p([
                    'additional details here...'
                ])
            ])
        },
        department: {
            name: 'department',
            required: true,
            label: 'Department',
            description: 'Your department or area of specialization within the organization',
            more: div([
                p([
                    'additional details here...'
                ])
            ])
        },
        location: {
            name: 'location',
            required: true,
            label: 'Location',
            description: 'Your geographic location',
            more: div([
                p([
                    'additional details here...'
                ])
            ])
        },
        gravatarDefault: {
            name: 'gravatarDefault',
            label: 'Gravatar',
            description: 'A generated or custom avatar displayed throughout the KBase interface to identify you',
            more: div([
                p([
                    'Your gravatar is based on an image you have associated with your email address at ',
                    a({
                        href: 'http://www.gravatar.com',
                        target: '_blank'
                    }, 'Gravatar'),
                    ' a free public profile service from Automattic, the same people who brought us Wordpress. ',
                    'If you have a persona gravatar associated with the email address in this profile, we will display it within KBase.'
                ]),
                p([
                    'If you don\'t have a personal gravator, you may select one of the ',
                    'default auto-generated gravatars provided below. Note that generated gravatars will ',
                    'use your email address to create a unique gravatar for you, which may be used to ',
                    'identify you in the ui. If you do not wish to have a unique gravatar, you may selecte ',
                    '"mystery man" or "blank"'
                ])
            ]),
            availableValues: [{
                id: 'mm',
                label: 'Mystery Man - simple, cartoon-style silhouetted outline'
            }, {
                id: 'identicon',
                label: 'Identicon - a geometric pattern based on an email hash'
            }, {
                id: 'monsterid',
                label: 'MonsterID - generated "monster" with different colors, faces, etc'
            }, {
                id: 'wavatar',
                label: 'Wavatar - generated faces with differing features and backgrounds'
            }, {
                id: 'retro',
                label: 'Retro - 8-bit arcade-style pixelated faces'
            }, {
                id: 'blank',
                label: 'Blank - A Blank Space'
            }]
        },

        affiliations: {
            name: 'affiliations',
            vmId: 'affiliations',
            label: 'Affiliations',
            description: 'Your affiliations',
            more: 'more here...'
        },


        realname: {
            name: 'realname',
            label: 'Name',
            type: 'text',
            placeholder: 'Your Name',
            description: span([
                'Your name as you wish it to be displayed to other KBase users ',
                ' as well as KBase staff.'
            ]),
            more: div([
                p([
                    'Your name will be displayed in any context within the KBase in which you are identified. ',
                    'This includes the Dashboard, User Profile, App Catalog, and Narrative Interface.'
                ]),
                p([
                    'You may edit this field in the "Personal" tab.'
                ]),
            ])
        },

        personalStatement: {
            name: 'personalStatement',
            required: false,
            label: 'Personal Statement',
            type: 'textarea',
            placeholder: 'Personal Statement',
            description: span([
                'Describe yourself to fellow Narrators'
            ]),
            more: 'more here...'
        }
    };

    function requiredIcon(field) {
        if (!field.required) {
            return;
        }
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-asterisk text-danger": ' + field.name + '.isValid() === false, "glyphicon-ok text-success":' + field.name + '.isValid()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    function fieldDoc(description, content, name) {
        return div({
            dataElement: 'more'
        }, [
            div([
                span({
                    // type: 'button',
                    // class: 'btn btn-link',
                    style: {
                        padding: '2px',
                        cursor: 'pointer'
                            // lineHeight: '1'
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
                }, [field.label, requiredIcon(field)]))
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

    function buildTextarea(field) {
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
                }, [field.label, requiredIcon(field)]))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    textarea({
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

    function buildTypeahead(field) {
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
                }, [field.label, requiredIcon(field)]))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    div({
                        dataBind: {
                            component: {
                                name: '"typeahead-input"',
                                params: {
                                    inputValue: field.vmId || field.name,
                                    availableValues: field.name + 's'
                                }
                            }
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

    function buildSelect(field) {
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
                }, [field.label, requiredIcon(field)]))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    select({
                            class: 'form-control',
                            id: id,
                            dataBind: {
                                value: field.vmId || field.name
                            }
                        }, field.availableValues.map(function (value) {
                            return option({
                                value: value.id
                            }, value.label);
                        }),
                        div({
                            class: 'alert alert-danger',
                            dataBind: {
                                validationMessage: field.vmId || field.name
                            }
                        })),
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

    function buildContent(content) {
        return div({
            class: 'form-group'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, content)
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

    function buildAffiliation() {
        return div({
            style: {
                border: '1px orange blue'
            }
        }, [
            div({
                class: 'row',
                style: {
                    border: '1px orange dashed'
                }
            }, [
                div({
                    class: 'col-sm-3'
                }, 'Title'),
                div({
                        class: 'col-sm-9',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            value: 'title'
                        }
                    }))
            ]),
            div({
                class: 'row',
                style: {
                    border: '1px orange dashed'
                }
            }, [
                div({
                    class: 'col-sm-3'
                }, 'Institution'),
                div({
                        class: 'col-sm-9',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            value: 'institution'
                        }
                    }))
            ]),
            div({
                class: 'row',
                style: {
                    border: '1px orange dashed'
                }
            }, [
                div({
                    class: 'col-sm-3'
                }, 'Starting in'),
                div({
                        class: 'col-sm-9',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            value: 'start_year'
                        }
                    }))
            ]),
            div({
                class: 'row',
                style: {
                    border: '1px orange dashed'
                }
            }, [
                div({
                    class: 'col-sm-3'
                }, 'Ending in'),
                div({
                        class: 'col-sm-9',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            value: 'end_year'
                        }
                    }))
            ]),
            div({
                class: 'row',
                style: {
                    border: '1px orange dashed'
                }
            }, [
                div({
                    class: 'col-sm-3'
                }),
                div({
                        class: 'col-sm-9',
                    },
                    button({
                        class: 'btn btn-danger',
                        dataBind: {
                            click: '$parent.deleteAffiliation'
                        }
                    }, 'Delete'))
            ])
        ]);
    }

    function buildAffiliations(field) {
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
                        dataBind: {
                            foreach: 'affiliations'
                        }
                    }, buildAffiliation())),


                div({
                    class: 'col-md-6'
                }, [
                    fieldDoc(field.description, field.more, field.name)
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, button({
                    class: 'btn btn-default',
                    dataBind: {
                        click: 'addAffiliation'
                    }
                }, 'Add New Affiliation'))
            ])
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
            buildTypeahead(fields.title),
            buildDisplay(fields.realname),
            buildInput(fields.suffix),
            buildInput(fields.organization),
            buildInput(fields.department),
            buildInput(fields.location),
            buildSelect(fields.gravatarDefault),
            buildContent(div({}, [
                p([
                    'Your current gravatar based on your email address ',
                    span({
                        dataBind: {
                            text: 'email'
                        }
                    })
                ]),
                div({
                    style: {
                        textAlign: 'center'
                    }
                }, img({
                    dataBind: {
                        attr: {
                            src: 'gravatarUrl'
                        }
                    }
                }))
            ])),
            buildAffiliations(fields.affiliations),
            buildTextarea(fields.personalStatement),

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
            viewModel: function (params) {
                var doSave = params.doSave;

                var email = ko.observable(params.email)
                    .extend({
                        required: true,
                        email: true
                    });

                var realname = ko.observable(params.realname)
                    .extend({
                        required: true,
                        minLength: 2,
                        maxLength: 100
                    });

                var title = ko.observable(params.title).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100
                });

                var titles = fields.title.availableValues;

                var suffix = ko.observable(params.suffix).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100
                });


                var organization = ko.observable(params.organization).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100
                });

                var department = ko.observable(params.department).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100
                });

                var location = ko.observable(params.location).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100
                });

                var gravatarDefault = ko.observable(params.gravatarDefault).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100
                });

                ko.validation.rules['year'] = {
                    validator: function (val) {
                        if (!/^[0-9][0-9][0-9][0-9]$/.test(val)) {
                            return false;
                        }
                        return true;
                    },
                    message: 'A username may only contain the characters a-z, 0-0, and _.'
                };
                ko.validation.registerExtenders();
                var affils = params.affiliations || [];
                var affiliations = ko.observableArray(affils.map(function (affil) {
                    return {
                        title: ko.observable(affil.title).extend({
                            required: true,
                            minLength: 2,
                            maxLength: 100
                        }),
                        institution: ko.observable(affil.institution).extend({
                            required: true,
                            minLength: 2,
                            maxLength: 100
                        }),
                        start_year: ko.observable(affil.start_year).extend({
                            required: true,
                            year: true
                        }),
                        end_year: ko.observable(affil.end_year).extend({
                            required: false,
                            year: true
                        })
                    };
                }));

                var personalStatement = ko.observable(params.personalStatement).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 400
                });


                var username = ko.observable(params.username);
                var created = ko.observable(params.created);
                var lastLogin = ko.observable(params.lastLogin);

                var createdAt = ko.pureComputed(function () {
                    return Format.niceTime(created());
                });
                var lastLoginAt = ko.pureComputed(function () {
                    return Format.niceElapsedTime(lastLogin()) +
                        ' (' +
                        Format.niceTime(lastLogin()) +
                        ')';
                });

                var gravatarUrl = ko.pureComputed(function () {
                    return UserProfile.makeGravatarURL(email(), 200, 'pg', gravatarDefault());
                });

                // var realnameMore = ko.observable(true);
                // var emailMore = ko.observable(true);

                var more = {};
                Object.keys(fields).forEach(function (key) {
                    more[key] = ko.observable(true);
                });

                function showMore(name) {
                    if (more[name]()) {
                        more[name](false);
                    } else {
                        more[name](true);
                    }
                }

                function save() {
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

                function deleteAffiliation(item) {
                    affiliations.remove(item);
                }

                function addAffiliation() {
                    affiliations.unshift({
                        title: ko.observable(),
                        institution: ko.observable(),
                        start_year: ko.observable(),
                        end_year: ko.observable()
                    });
                }

                return {
                    // fields being edited or displayed
                    title: title,
                    titles: titles,
                    realname: realname,
                    suffix: suffix,
                    organization: organization,
                    department: department,
                    location: location,
                    gravatarDefault: gravatarDefault,
                    affiliations: affiliations,
                    personalStatement: personalStatement,

                    email: email,
                    username: username,
                    created: created,
                    lastLogin: lastLogin,
                    createdAt: createdAt,
                    lastLoginAt: lastLoginAt,

                    // computed
                    gravatarUrl: gravatarUrl,

                    showMore: showMore,
                    more: more,
                    save: save,
                    message: message,
                    messageType: messageType,

                    deleteAffiliation: deleteAffiliation,
                    addAffiliation: addAffiliation
                };
            },
            template: buildForm()
        };
    }
    ko.components.register('profile-editor', component());
});