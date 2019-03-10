define([
    'bluebird',
    'knockout',
    'kb_lib/html',
    'kb_knockout/lib/generators',
    'kb_knockout/registry',
    'kb_service/client/userProfile',
    '../../lib/fieldBuilders',
    '../../lib/geoNames',
    '../../lib/dataSource',
    '../../components/typeaheadInput',
    '../../components/fieldDoc',
    'plugins/user-profile/modules/components/profileView'
], function (
    Promise,
    ko,
    html,
    gen,
    reg,
    UserProfileService,
    FieldBuilders,
    GeoNames,
    DataSource,
    TypeaheadInputComponent,
    FieldDocComponent,
    ProfileViewerComponent
) {
    'use strict';

    ko.extenders.docs = function (target, args) {
        target.label = function () {
            return args.label;
        };
        target.description = function () {
            return args.description;
        };
        target.moreDescription = function () {
            return args.moreDescription();
        };
        target.more = ko.observable(false);

        target.exportDisplay = function () {
            if (args.display) {
                return args.display(target);
            } else {
                return target();
            }
        };
        target.exportData = function () {
            if (args.data) {
                return args.data(target);
            } else {
                return target();
            }
        };
    };


    ko.extenders.export = function (target, args) {
        target.exportDisplay = function () {
            if (args.display) {
                return args.display(target);
            } else {
                return target();
            }
        };
        target.exportData = function () {
            if (args.data) {
                return args.data(target);
            } else {
                return target();
            }
        };
        return target;
    };

    ko.validation.registerExtenders();

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a'),
        p = t('p'),
        input = t('input'),
        button = t('button');

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

    function buildAffiliationForm() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row row-edgeless'
            }, gen.with('title', [
                div({
                    class: 'col-sm-2'
                }, FieldBuilders.buildInlineLabel()),
                div({
                    class: 'col-sm-10',
                }, input({
                    class: 'form-control',
                    placeholder: 'Your title',
                    dataBind: {
                        textInput: '$data.field'
                    }
                }))
            ])),
            div({
                class: 'row row-edgeless'
            }, gen.with('organization', [
                div({
                    class: 'col-sm-2'
                }, FieldBuilders.buildInlineLabel()),
                div({
                    class: 'col-sm-10'
                }, div({
                    dataBind: {
                        component: {
                            name: TypeaheadInputComponent.quotedName(),
                            params: {
                                inputValue: 'field',
                                placeholder: '"Search for or Enter Your Organization"',
                                dataSource: 'dataSource'
                            }
                        }
                    }
                }))
            ])),
            div({
                class: 'row row-edgeless'
            }, [
                gen.with('started', [
                    div({
                        class: 'col-sm-2'
                    }, FieldBuilders.buildInlineLabel()),
                    div({
                        class: 'col-sm-4',
                    }, input({
                        class: 'form-control',
                        placeholder: 'Year started',
                        dataBind: {
                            textInput: 'field'
                        }
                    }))
                ]),
                gen.with('ended', [
                    div({
                        class: 'col-sm-2'
                    }, FieldBuilders.buildInlineLabel()),
                    div({
                        class: 'col-sm-4',
                    }, input({
                        class: 'form-control',
                        placeholder: 'Year ended',
                        dataBind: {
                            textInput: 'field'
                        }
                    }))
                ])
            ])
        ]);
    }

    function buildAffiliation() {
        return div({
            class: 'container-fluid',
            style: {
                marginBottom: '10px'
            }
        }, [
            div({
                class: 'row row-padless form-sub-row'
            }, [
                div({
                    class: 'col-md-11'
                }, buildAffiliationForm()),
                div({
                    class: 'col-md-1',
                    style: {
                        textAlign: 'right'
                    }
                }, button({
                    class: 'btn btn-sm btn-default',
                    dataBind: {
                        click: '$component.deleteAffiliation.bind($component)'
                    }
                }, span({
                    class: 'fa fa-trash'
                })))
            ])
        ]);
    }

    function buildAffiliations(vmPath) {
        var id = html.genId();
        return div({
            class: 'form-group form-row',
            dataBind: {
                with: vmPath
            }
        }, [
            div({
                class: 'container-fluid'
            }, [
                FieldBuilders.buildLabelRow(id),
                FieldBuilders.buildFieldRow(div({
                    dataBind: {
                        foreach: 'field'
                    }
                }, buildAffiliation())),
                div({
                    class: 'row row-edgeless'
                }, div({
                    class: 'col-md-12'
                }, button({
                    class: 'btn btn-default',
                    dataBind: {
                        click: '() => {$component.addAffiliation.call($component)}'
                    }
                }, 'Add New Affiliation')))
            ])
        ]);
    }

    // function buildUseMyLocation() {
    //     if (!('geolocation' in navigator)) {
    //         return;
    //     }
    //     return div({
    //         style: {
    //             textAlign: 'center'
    //         }
    //     }, [
    //         button({
    //             type: 'button',
    //             class: 'btn btn-default',
    //             dataBind: {
    //                 click: 'doUseMyLocation',
    //                 disable: 'findingLocation'
    //             }
    //         }, [
    //             span({
    //                 dataBind: {
    //                     visible: '!findingLocation()'
    //                 }
    //             }, 'Use My Location'),
    //             span({
    //                 dataBind: {
    //                     visible: 'findingLocation()'
    //                 }
    //             }, [
    //                 'Finding Location ...',
    //                 span({
    //                     class: 'fa fa-spinner fa-pulse'
    //                 })
    //             ])
    //         ])
    //     ]);
    // }

    function buildForm() {
        var content = div({
            style: {
                marginBottom: '12px'
            },
            dataBind: {
                validationOptions: {
                    insertMessages: 'false'
                }
            }
        }, [
            FieldBuilders.buildInput('realname'),
            div({
                style: {
                    border: '1px #DDD solid',
                    padding: '4px',
                    margin: '2em 0 1em 0',
                }
            }, [
                span({
                    style: {
                        fontWeight: 'bold',
                        color: '#DDD',
                        border: '1px #DDD solid',
                        position: 'relative',
                        top: '-14px',
                        left: '1em',
                        padding: '6px',
                        backgroundColor: '#777'
                    }
                }, 'Position'),
                FieldBuilders.buildTypeahead('organization', {}),
                FieldBuilders.buildInput('department'),
                // FieldBuilders.buildTypeahead('profile.jobTitle', {}),
                FieldBuilders.buildSelect('jobTitle', {
                    optionsCaption: ' - '
                }),
                '<!-- ko if: jobTitleOther.field.isEnabled -->',
                FieldBuilders.buildInput('jobTitleOther'),
                '<!-- /ko -->',
                buildAffiliations('affiliations')
            ]),
            div({
                style: {
                    border: '1px #DDD solid',
                    padding: '4px',
                    margin: '2em 0 1em 0',
                }
            }, [
                span({
                    style: {
                        fontWeight: 'bold',
                        color: '#DDD',
                        border: '1px #DDD solid',
                        position: 'relative',
                        top: '-14px',
                        left: '1em',
                        padding: '6px',
                        backgroundColor: '#777'
                    }
                }, 'Location'),
                // buildUseMyLocation(),
                FieldBuilders.buildSelect('country', {
                    // optionsCaption: fields.country.emptyValueLabel,
                    // defaultValue: fields.country.defaultValue
                }),
                FieldBuilders.buildInput('city'),
                '<!-- ko if: state.field.isEnabled -->',
                FieldBuilders.buildSelect('state'),
                '<!-- /ko -->',
                '<!-- ko if: postalCode.field.isEnabled -->',
                FieldBuilders.buildInput('postalCode'),
                '<!-- /ko -->'
            ]),
            div({
                style: {
                    border: '1px #DDD solid',
                    padding: '4px',
                    margin: '2em 0 1em 0',
                }
            }, [
                span({
                    style: {
                        fontWeight: 'bold',
                        color: '#DDD',
                        border: '1px #DDD solid',
                        position: 'relative',
                        top: '-14px',
                        left: '1em',
                        padding: '6px',
                        backgroundColor: '#777'
                    }
                }, 'Research'),
                FieldBuilders.buildCheckboxes('researchInterests'),
                '<!-- ko if: researchInterestsOther.field.isEnabled -->',
                FieldBuilders.buildInput('researchInterestsOther'),
                '<!-- /ko -->',
                FieldBuilders.buildSelect('fundingSource', {
                    optionsCaption: ' - '
                }),
                FieldBuilders.buildTextarea('researchStatement', {
                    style: {
                        height: '10em'
                    }
                })
            ]),
            div({
                style: {
                    border: '1px #DDD solid',
                    padding: '4px',
                    margin: '2em 0 1em 0',
                }
            }, [
                span({
                    style: {
                        fontWeight: 'bold',
                        color: '#DDD',
                        border: '1px #DDD solid',
                        position: 'relative',
                        top: '-14px',
                        left: '1em',
                        padding: '6px',
                        backgroundColor: '#777'
                    }
                }, 'Appearance'),
                FieldBuilders.buildSelect('avatarOption'),
                FieldBuilders.buildSelect('gravatarDefault', {
                    //condition: 'profile.avatarOption() === "gravatar"'
                }),
            ])
        ]);
        return content;
    }

    function buildSaveButton() {
        return button({
            class: 'btn btn-primary',
            type: 'button',
            dataBind: {
                click: 'doSaveProfile',
                enable: 'formCanSave'
            }
        }, 'Save');
    }

    function buildSaver() {
        return div([
            span({
                style: {
                    marginRight: '10px',
                    display: 'inline-block'
                }
            }, [
                span({
                    dataBind: {
                        visible: 'someDirty() && !someInvalid()'
                    }
                }, [
                    span({
                        class: 'text-info'
                    }, 'You may save the edits made to your profile')
                ]),
                span({
                    dataBind: {
                        visible: 'someInvalid'
                    }
                }, [
                    span({
                        class: 'text-danger'
                    }, [
                        'You may save after completing required ',
                        span({
                            class: 'glyphicon-asterisk text-danger',
                            style: {
                                fontWeight: 'bold'
                            }
                        }),
                        ' or erroneous fields'
                    ])
                ])
            ]),
            buildMessageDisplay(),
            span({
                style: {
                    textAlign: 'center'
                }
            }, buildSaveButton())
        ]);
    }

    function buildTemplate() {
        return div({
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 0px'
            }
        }, [
            div({
                style: {
                    flex: '0 0 auto',
                    // backgroundColor: 'rgba(255,185,2,0.5)',
                    backgroundColor: '#DDD',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'row'
                }
            }, [
                div({
                    style: {
                        flex: '1',
                        // color: 'rgba(0,121,98,1)', // 0, 121, 98
                        fontSize: '130%',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }
                }, 'Edit Your Profile'),
                // div({
                //     style: {
                //         flex: '1',
                //         textAlign: 'center',
                //         display: 'flex',
                //         flexDirection: 'column',
                //         justifyContent: 'center'
                //     },
                //     dataBind: {
                //         text: 'message'
                //     }
                // }),
                div({
                    style: {
                        flex: '1',
                        textAlign: 'right'
                    }
                }, [
                    buildSaver()
                    // buildSaveButton()
                ])
            ]),
            div({
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    flex: '1 1 0px',
                    alignItems: 'stretch',
                    overflowY: 'auto',
                    padding: '5px'
                }
            }, [
                div({
                    style: {
                        // flexDirection: 'column',
                        // justifyContent: 'flex-start',
                        // alignItems: 'stretch',
                        // alignContent: 'stretch',
                        flex: '1 1 0px',
                        overflowY: 'auto',
                        padding: '0 10px 0 5px'
                    }
                }, [

                    div({
                        style: {
                            height: '10px'
                        }
                    }),
                    buildForm(),
                    // buildSaver(),
                    div({
                        style: {
                            height: '10px'
                        }
                    }),
                ]),
                div({
                    style: {
                        flex: '1 1 0px',
                        overflowY: 'auto',
                        padding: '0 10px 0 5px'
                    }
                }, [
                    // buildSaver(),
                    // '<hr>',
                    div({
                        style: {
                            textAlign: 'center'
                        }
                    }, [
                        span({
                            style: {
                                fontWeight: 'bold',
                                fontSize: '120%'
                            }
                        }, 'Preview'),
                        a({
                            class: 'btn btn-link',
                            href: '#people',
                            style: {
                                marginLeft: '10px'
                            }
                        }, 'Open Your Profile Page'),
                    ]),
                    div({
                        id: 'profilePreview',
                        style: {
                            position: 'relative'
                        },
                        dataBind: {
                            component: {
                                name: ProfileViewerComponent.quotedName(),
                                params: {
                                    runtime: 'runtime',
                                    profile: 'exportedProfile()'
                                }
                            }
                        }
                    })
                ])
            ])
        ]);
    }


    class Affiliation {
        constructor({ affiliation: affil, dataSource }) {
            this.title = {
                field: ko.observable((affil && affil.title) || '').extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The title must be at least two characters long';
                            }
                            if (value.length > 50) {
                                return 'The title cannot be longer than 50 characters';
                            }
                        }
                    },
                    dirty: false
                })
            };

            this.organization = {
                field: ko.observable(affil && affil.organization).extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The organization must be at least two characters long';
                            }
                            if (value.length > 100) {
                                return 'The organization cannot be longer than 100 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                dataSource: dataSource.getFilter('organizations')
            };

            this.started = {
                field: ko.observable(affil && affil.started).extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (!/^[0-9][0-9][0-9][0-9]$/.test(value)) {
                                return 'Invalid year format, expecting ####';
                            }
                        }
                    },
                    dirty: false
                })
            };

            this.ended = {
                field: ko.observable(affil && affil.ended).extend({
                    constraint: {
                        required: false,
                        validate: (value) => {
                            if (!/^[0-9][0-9][0-9][0-9]$/.test(value)) {
                                return 'Invalid year format, expecting ####';
                            }
                        }
                    },
                    dirty: false
                })
            };
        }
    }

    class ViewModel {
        constructor({ runtime, profile }) {
            this.runtime = runtime;
            this.profile = profile;

            this.ready = ko.observable(false);

            this.dataSource = DataSource({
                sources: {
                    // Raw data source
                    jobTitles: {
                        file: 'jobTitles.json',
                        type: 'json',
                        translate: (item) => {
                            return {
                                value: item.label,
                                label: item.label
                            };
                        }
                    },
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
                    researchInterests: {
                        file: 'researchInterests.json',
                        type: 'json',
                        translate: (item) => {
                            return {
                                value: item.label,
                                label: item.label
                            };
                        }
                    },
                    fundingSource: {
                        file: 'fundingSources.json',
                        type: 'json',
                        translate: (item) => {
                            return {
                                value: item.label,
                                label: item.label
                            };
                        }
                    },
                    countries: {
                        file: 'countries.json',
                        type: 'json',
                        translate: (item) => {
                            return {
                                value: item.label,
                                label: item.label
                            };
                        }
                    },
                    states: {
                        file: 'states.json',
                        type: 'json',
                        translate: (item) => {
                            return {
                                value: item.name,
                                label: item.name
                            };
                        }
                    },
                    gravatarDefaults: {
                        file: 'gravatarDefaults.json',
                        type: 'json'
                    },
                    avatarOptions: {
                        file: 'avatarOptions.json',
                        type: 'json'
                    },
                    // A computed data source.
                    organizations: {
                        sources: {
                            institutions: {
                                translate: false,
                            },
                            nationalLabs: {
                                translate: (item) => {
                                    return {
                                        value: item.name,
                                        label: item.name + ' (' + item.initials + ')'
                                    };
                                }
                            },
                            otherLabs: {
                                translate: (item) => {
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

            this.realname = {
                ready: true,
                field: ko.observable(profile.user.realname)
                    .extend({
                        constraint: {
                            required: true,
                            validate: (value) => {
                                if (value.length < 2) {
                                    return {
                                        message: 'Must be at least two characters long'
                                    };
                                }
                                if (value.length > 100) {
                                    return {
                                        message: 'Must be less than 100 characters long'
                                    };
                                }
                            }
                        },

                        dirty: false
                    }),
                label: 'Name',
                doc: {
                    description: [
                        'Your name as you wish it to be displayed to other KBase users ',
                        ' as well as KBase staff.'
                    ].join(''),
                    more: div([
                        p([
                            'Your name will be displayed in any context within the KBase in which you are identified. ',
                            'This includes the Dashboard, User Profile, App Catalog, and Narrative Interface.'
                        ])
                    ])
                }
            };

            this.organization = {
                ready: ko.observable(true),
                field: ko.observable(profile.profile.userdata.organization).extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The organization name must be at least two characters long';
                            }
                            if (value.length > 100) {
                                return 'The organization name cannot be longer than 100 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                dataSource: this.dataSource.getFilter('organizations'),
                label: 'Organization',
                doc: {
                    description: 'Your primary association - organization, institution, business',
                    more: div([
                        p([
                            'You may enter any value you wish here. As you type, matching US higher education institutions ',
                            'and National Labs will be displayed below. If you see yours listed you should click on it to ',
                            'use that value.'
                        ]),
                        p([
                            'National Labs derived from: ',
                            a({
                                href: 'https://science.energy.gov/laboratories/',
                                target: '_blank'
                            }, 'DOE Web Site - Laboratories'),
                        ]),
                        p([
                            'US higher education institutions derived from: ',
                            a({
                                href: 'http://carnegieclassifications.iu.edu/index.php',
                                target: '_blank'
                            }, 'Carnegie Classification of Institutions of Higher Education ')
                        ])
                    ])
                }
            };

            this.department = {
                ready: ko.observable(true),
                field: ko.observable(profile.profile.userdata.department).extend({
                    constraint: {
                        required: false,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The department must be at least two characters long';
                            }
                            if (value.length > 50) {
                                return 'The department cannot be longer than 50 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                label: 'Department',
                doc: {
                    description: 'Your department or area of specialization within the organization',
                    more: null
                }
            };

            this.jobTitle = {
                ready: ko.observable(false),
                field: ko.observable(profile.profile.userdata.jobTitle).extend({
                    constraint: {
                        required: false,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The job title must be at least two characters long';
                            }
                            if (value.length > 50) {
                                return 'The job title cannot be longer than 50 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                emptyLabel: ' - ',
                dataSource: this.dataSource.getFilter('jobTitles'),
                label: 'Job Title',
                doc: {
                    description: 'Your job title or position',
                    more: null
                }
            };

            this.jobTitleOther = {
                ready: ko.pureComputed(() => {
                    return true;
                    // return (jobTitle.field() === 'Other');
                }),
                field: ko.observable(profile.profile.userdata.jobTitleOther)
                    .extend({
                        constraint: {
                            required: ko.pureComputed(() => {
                                return (this.jobTitle.field() === 'Other');
                            }),
                            validate: (value) => {
                                if (value.length < 2) {
                                    return 'The field must be at least two characters long';
                                }
                                if (value.length > 50) {
                                    return 'The field cannot be longer than 50 characters';
                                }
                            }
                        },
                        enabled: {
                            observable: this.jobTitle.field,
                            fun: (value) => {
                                return (value === 'Other');
                            }
                        },
                        dirty: false
                    }),
                label: 'Job Title (Other)',
                doc: null
            };

            this.researchInterests = {
                ready: true,
                field: ko.observableArray(profile.profile.userdata.researchInterests || []).extend({
                    // mytest: true,
                    constraint: {
                        description: 'Your research interests',
                        required: true,
                        validate: () => {
                            // ensure in the list...
                        }
                    },
                    // required: true,
                    dirty: false,
                }),
                // required: true,
                dataSource: this.dataSource.getFilter('researchInterests'),
                label: 'Research Interests',
                doc: {
                    description: null, // 'Please indicate one or more areas of research interest',
                    more: null
                }
            };

            this.researchInterestsOther = {
                ready: ko.pureComputed(() => {
                    return true;
                    // return (jobTitle.field() === 'Other');
                }),
                field: ko.observable(profile.profile.userdata.researchInterestsOther)
                    .extend({
                        constraint: {
                            required: ko.pureComputed(() => {
                                return (this.researchInterests.field() === 'Other');
                            }),
                            validate: (value) => {
                                if (value.length < 2) {
                                    return 'The field must be at least two characters long';
                                }
                                if (value.length > 50) {
                                    return 'The field cannot be longer than 50 characters';
                                }
                            }
                        },
                        enabled: {
                            observable: this.researchInterests.field,
                            fun: (value) => {
                                return (value.indexOf('Other') >= 0);
                            }
                        },
                        dirty: false
                    }),
                label: 'Other research interest',
                doc: null
            };

            this.fundingSource = {
                ready: ko.observable(false),
                field: ko.observable(profile.profile.userdata.fundingSource).extend({
                    constraint: {
                        required: false,
                        validate: () => {
                            // TODO
                            // ensure in the data source
                        }
                    },
                    dirty: false
                }),
                dataSource: this.dataSource.getFilter('fundingSource'),
                emptyLabel: ' - ',
                label: 'Primary funding source',
                doc: {
                    description: 'The primary funding source for your work at KBase',
                    more: null
                }
            };

            this.city = {
                ready: ko.observable(true),
                field: ko.observable(profile.profile.userdata.city).extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The city must be at least two characters long';
                            }
                            if (value.length > 100) {
                                return 'The city cannot be longer than 100 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                label: 'City',
                doc: null
            };

            this.country = {
                ready: ko.observable(false),
                field: ko.observable(profile.profile.userdata.country).extend({
                    constraint: {
                        required: true,
                        validate: () => {
                            // todo: ensure in list of countries.
                        }
                    },
                    dirty: false
                }),
                label: 'Country',
                doc: null,
                emptyLabel: ' - ',
                dataSource: this.dataSource.getFilter('countries')
            };

            this.state = {
                ready: ko.observable(true),
                // required: true,
                field: ko.observable(profile.profile.userdata.state).extend({
                    constraint: {
                        required: ko.pureComputed(() => {
                            return (this.country.field() === 'United States');
                        }),
                        messages: {
                            requiredButEmpty: 'The state is required if the country is "United States"'
                        },
                        validate: function () {
                            // todo: ensure in list of countries.
                        }
                    },
                    enabled: {
                        observable: this.country.field,
                        fun: (newCountry) => {
                            return (newCountry === 'United States');
                        }
                    },
                    // required: {
                    //     onlyIf: function () {
                    //         return (country.field() === 'United States');
                    //     }
                    // },
                    // minLength: 2,
                    // maxLength: 100,
                    dirty: false
                }),
                label: 'State, Province, or Region',
                doc: null,
                emptyLabel: ' - ',
                dataSource: this.dataSource.getFilter('states')
            };

            this.postalCode = {
                ready: ko.observable(true),
                // required: {
                //     onlyIf: function () {
                //         return (country.field() === 'United States');
                //     }
                // },
                field: ko.observable(profile.profile.userdata.postalCode).extend({
                    constraint: {
                        required: ko.pureComputed(() => {
                            return (this.country.field() === 'United States');
                        }),
                        messages: {
                            requiredButEmpty: 'The zip code is required if the country is "United States"'
                        },
                        validate: (value) => {
                            if (!/^[0-9]{5}$/.test(value)) {
                                return 'Invalid zip format, expecting #####';
                            }
                        }
                    },
                    enabled: {
                        observable: this.country.field,
                        fun: (newCountry) => {
                            return (newCountry === 'United States');
                        }
                    },
                    // required: true,
                    // pattern: '^[0-9]{5}$',
                    dirty: false
                }),
                label: 'Zip or Postal Code',
                doc: null
            };

            this.avatarOption = {
                field: ko.observable(profile.profile.userdata.avatarOption).extend({
                    constraint: {
                        required: false,
                        validate: () => {
                            // todo ensure in list
                        }
                    },
                    dirty: false
                }),
                emptyLabel: ' - ',
                dataSource: this.dataSource.getFilter('avatarOptions'),
                required: false,
                label: 'Avatar Options',
                doc: {
                    description: 'Choose to use gravatar, or the KBase anonymous silhouette.',
                    more: null
                }
            };
            this.gravatarDefault = {
                ready: ko.observable(true),
                field: ko.observable(profile.profile.userdata.gravatarDefault).extend({
                    constraint: {
                        required: false,
                        validate: () => {
                            // todo ensure in linst
                        }
                    },
                    dirty: false
                }),
                required: false,
                label: 'Gravatar Default Image',
                dataSource: this.dataSource.getFilter('gravatarDefaults'),
                emptyLabel: ' - ',
                doc: {
                    description: 'If you do not have a custom gravatar, this generated or generic image will be used',
                    more: div([
                        p([
                            'Note that if you have a gravatar image set up, this option will have no effect on your gravatar display. '
                        ]),
                        p([
                            'Your gravatar is based on an image you have associated with your email address at ',
                            a({
                                href: 'http://www.gravatar.com',
                                target: '_blank'
                            }, 'Gravatar'),
                            ' a free public profile service from Automattic, the same people who brought us Wordpress. ',
                            'If you have a personal gravatar associated with the email address in this profile, it will be displayed within KBase.'
                        ]),
                        p([
                            'If you don\'t have a personal gravator, you may select one of the ',
                            'default auto-generated gravatars provided below. Note that generated gravatars will ',
                            'use your email address to create a unique gravatar for you, which may be used to ',
                            'identify you in the ui. If you do not wish to have a unique gravatar, you may select ',
                            '"mystery man" or "blank"'
                        ])
                    ]),
                }
            };

            const affils = this.profile.profile.userdata.affiliations || [];

            this.affiliations = {
                field: ko.observableArray(affils.map((affil) => {
                    return new Affiliation({ affiliation: affil, dataSource: this.dataSource });
                }))
                // .sort(function (a, b) {
                //     if (a.started.field() < b.started.field()) {
                //         return -1;
                //     } else if (a.started.field() > b.started.field()) {
                //         return 1;
                //     } else {
                //         return 0;
                //     }
                // })
                    .extend({
                        constraint: {
                            required: false
                        },
                        dirty: false
                    }),
                label: 'Affiliations',
                required: false,
                doc: {
                    description: 'Your history of organizational affiliations ',
                    more: div([
                        p([
                            'Maintaining your history of orgzniational affiliations can help other users identify you.',
                        ])
                    ])
                }
            };

            this.researchStatement = {
                ready: ko.observable(true),
                field: ko.observable(profile.profile.userdata.researchStatement).extend({
                    constraint: {
                        required: true,
                        validate: (value) => {
                            if (value.length < 2) {
                                return 'The research statement must be at least two characters long';
                            }
                            if (value.length > 1000) {
                                return 'The research statement cannot be longer than 1000 characters';
                            }
                        }
                    },
                    dirty: false
                }),
                required: false,
                label: 'Research or Personal Statement',
                doc: {
                    description: null,
                    more: null
                }
            };

            this.researchStatementDisplay = ko.pureComputed(() => {
                var text = this.researchStatement.field();
                if (!text) {
                    return '';
                }
                return text.replace(/\n/g, '<br>');
            });

            this.username = profile.user.username;

            this.gravatarHash = profile.profile.synced.gravatarHash;

            // COMPUTEDS

            const vmFields = [
                this.realname.field, this.city.field, this.state.field, this.postalCode.field, this.country.field, this.organization.field,
                this.department.field, this.avatarOption.field, this.gravatarDefault.field, this.affiliations.field,
                this.researchStatement.field, this.researchInterests.field, this.researchInterestsOther.field, this.fundingSource.field,
                this.jobTitle.field, this.jobTitleOther.field
            ];

            this.someDirty = ko.pureComputed(() => {
                // some are dirty
                return vmFields.some((field) => {
                    return field.isDirty();
                });
            });

            this.someInvalid = ko.pureComputed(() => {
                const oldStyle = vmFields.some((field) => {
                    if (field.isValid) {
                        return !field.isValid();
                    } else {
                        return false;
                    }
                });
                var newStyle = vmFields.some((field) => {
                    if (field.constraint) {
                        return !field.constraint.isValid();
                    }
                    return false;
                });
                    // container
                    // var someContainerFieldInvalid = false;
                var affiliationErrors = ko.unwrap(this.affiliations.field).some((affiliation) => {
                    return [
                        affiliation.title, affiliation.organization,
                        affiliation.started, affiliation.ended
                    ].some((field) => {
                        if (field.field && field.field.constraint) {
                            return !field.field.constraint.isValid();
                        }
                    });
                });
                return (oldStyle || newStyle || affiliationErrors);
            });

            this.formCanSave = ko.pureComputed(() => {
                var d = this.someDirty();
                var iv = this.someInvalid();
                return d && !iv;
            });

            this.exportedProfile = ko.pureComputed(() => {
                return {
                    user: {
                        username: this.username,
                        realname: this.realname.field()
                    },
                    profile: {
                        userdata: {
                            jobTitle: this.jobTitle.field(),
                            jobTitleOther: this.jobTitleOther.field(),
                            organization: this.organization.field(),
                            department: this.department.field(),
                            city: this.city.field(),
                            state: this.state.field(),
                            postalCode: this.postalCode.field(),
                            country: this.country.field(),
                            researchInterests: this.researchInterests.field(),
                            researchInterestsOther: this.researchInterestsOther.field(),
                            fundingSource: this.fundingSource.field(),
                            affiliations: this.affiliations.field().map((af) => {
                                return {
                                    title: af.title.field(),
                                    organization: af.organization.field(),
                                    started: af.started.field(),
                                    ended: af.ended.field()
                                };
                            }),
                            researchStatement: this.researchStatement.field(),
                            avatarOption: this.avatarOption.field(),
                            gravatarDefault: this.gravatarDefault.field(),
                        },
                        synced: {
                            gravatarHash: this.gravatarHash
                        }
                    },

                };
            });

            // MORE FIELDS
            this.message = ko.observable();
            this.messageType = ko.observable();
            this.findingLocation = ko.observable(false);
        }

        saveProfile() {
            var client = new UserProfileService(this.runtime.config('services.user_profile.url'), {
                token: this.runtime.service('session').getAuthToken()
            });

            // get the profile, then update it, then save it.
            // TODO profile service should accept just change set.

            return client.get_user_profile([this.username])
                .then((result) => {
                    const profile = result[0];
                    const account = {};
                    let profileChanges = false;
                    let accountChanges = false;
                    // build the update object.
                    // TODO: detect changed fields - knockout?

                    if (this.realname.field.isDirty()) {
                        profile.user.realname = this.realname.field();
                        this.realname.field.markClean();
                        account.display = this.realname.field();
                        accountChanges = true;
                        profileChanges = true;
                    }

                    if (this.city.field.isDirty()) {
                        profile.profile.userdata.city = this.city.field();
                        this.city.field.markClean();
                        profileChanges = true;
                    }

                    if (this.state.field.isDirty()) {
                        profile.profile.userdata.state = this.state.field();
                        this.state.field.markClean();
                        profileChanges = true;
                    }

                    if (this.postalCode.field.isDirty()) {
                        profile.profile.userdata.postalCode = this.postalCode.field();
                        this.postalCode.field.markClean();
                        profileChanges = true;
                    }

                    if (this.country.field.isDirty()) {
                        profile.profile.userdata.country = this.country.field();
                        this.country.field.markClean();
                        profileChanges = true;
                    }

                    if (this.organization.field.isDirty()) {
                        profile.profile.userdata.organization = this.organization.field();
                        this.organization.field.markClean();
                        profileChanges = true;
                    }

                    if (this.department.field.isDirty()) {
                        profile.profile.userdata.department = this.department.field();
                        this.department.field.markClean();
                        profileChanges = true;
                    }

                    if (this.fundingSource.field.isDirty()) {
                        profile.profile.userdata.fundingSource = this.fundingSource.field();
                        this.fundingSource.field.markClean();
                        profileChanges = true;
                    }

                    if (this.avatarOption.field.isDirty()) {
                        profile.profile.userdata.avatarOption = this.avatarOption.field();
                        this.avatarOption.field.markClean();
                        profileChanges = true;
                    }

                    if (this.gravatarDefault.field.isDirty()) {
                        profile.profile.userdata.gravatarDefault = this.gravatarDefault.field();
                        this.gravatarDefault.field.markClean();
                        profileChanges = true;
                    }

                    if (this.affiliations.field.isDirty()) {
                        // just bundle the whole thing up...
                        var newAffiliations = this.affiliations.field().map((af) => {
                            return {
                                title: af.title.field(),
                                organization: af.organization.field(),
                                started: af.started.field(),
                                ended: af.ended.field()
                            };
                        });
                        profile.profile.userdata.affiliations = newAffiliations;
                        this.affiliations.field.markClean();
                        profileChanges = true;
                    }

                    if (this.researchStatement.field.isDirty()) {
                        profile.profile.userdata.researchStatement = this.researchStatement.field();
                        this.researchStatement.field.markClean();
                        profileChanges = true;
                    }

                    if (this.jobTitle.field.isDirty()) {
                        profile.profile.userdata.jobTitle = this.jobTitle.field();
                        this.jobTitle.field.markClean();
                        profileChanges = true;
                    }

                    if (this.jobTitleOther.field.isDirty()) {
                        profile.profile.userdata.jobTitleOther = this.jobTitleOther.field();
                        this.jobTitleOther.field.markClean();
                        profileChanges = true;
                    }

                    if (this.researchInterests.field.isDirty()) {
                        profile.profile.userdata.researchInterests = this.researchInterests.field();
                        this.researchInterests.field.markClean();
                        profileChanges = true;
                    }
                    if (this.researchInterestsOther.field.isDirty()) {
                        profile.profile.userdata.researchInterestsOther = this.researchInterestsOther.field();
                        this.researchInterestsOther.field.markClean();
                        profileChanges = true;
                    }

                    var changes = [];
                    if (profileChanges) {
                        changes.push(client.set_user_profile({
                            profile: profile
                        }));
                    }
                    if (accountChanges) {
                        changes.push(this.runtime.service('session').getClient().putMe(account));
                    }

                    return Promise.all(changes)
                        .then(() => {
                            if (profileChanges) {
                                this.runtime.send('profile', 'reload');
                            }
                        });
                });
        }

        doSaveProfile() {
            this.saveProfile()
                .then(() => {
                    this.runtime.send('notification', 'notify', {
                        type: 'success',
                        icon: 'thumbs-up',
                        message: 'Successfuly saved your profile',
                        autodismiss: 3000
                    });
                })
                .catch((err) => {
                    console.error('boo', err);
                    this.message('Error saving');
                    this.messageType({
                        'alert-danger': true,
                        hidden: false
                    });
                });
        }

        deleteAffiliation(item) {
            this.affiliations.field.remove(item);
        }

        addAffiliation() {
            this.affiliations.field.push(new Affiliation({ dataSource: this.dataSource }));
        }

        doUseMyLocation() {
            this.findingLocation(true);
            navigator.geolocation.getCurrentPosition((position) => {
                GeoNames.getCountryCode({
                    username: 'eapearson',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
                    .then((response) => {
                        this.country.field(response.countryName);
                    })
                    .catch((err) => {
                        console.error('ERROR', err);
                    })
                    .finally(() => {
                        this.findingLocation(false);
                    });
            });
        }

    }

    function component() {
        return {
            viewModel: ViewModel,
            template: buildTemplate()
        };
    }

    return reg.registerComponent(component);
});