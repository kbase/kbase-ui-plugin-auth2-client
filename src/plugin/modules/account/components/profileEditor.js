define([
    'bluebird',
    'knockout-plus',
    'md5',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    'kb_service/userProfile',
    'kb_service/client/userProfile',
    '../../lib/fieldBuilders',
    'kb_plugin_auth2-client',
    '../../lib/geoNames',
    '../../lib/dataSource'
], function (
    Promise,
    ko,
    md5,
    html,
    BS,
    Format,
    UserProfile,
    UserProfileService,
    FieldBuilders,
    Plugin,
    GeoNames,
    DataSource
) {
    'use strict';

    var t = html.tag,
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
    // FieldBuilders.buildTypeahead('profile.organization', {}),
    function buildAffiliationForm() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row row-edgeless'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Title'),
                div({
                    class: 'col-sm-10',
                }, input({
                    class: 'form-control',
                    dataBind: {
                        textInput: 'title.field'
                    }
                }))
            ]),
            div({
                class: 'row row-edgeless'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Organization'),
                div({
                    class: 'col-sm-10',
                    dataBind: {
                        with: 'organization'
                    }
                }, div({
                    dataBind: {
                        component: {
                            name: '"typeahead-input"',
                            params: {
                                inputValue: 'field',
                                dataSource: 'dataSource'
                                    // availableValues: field.name + 'Values'
                            }
                        }
                    }
                }))
            ]),
            div({
                class: 'row row-edgeless'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Started in'),
                div({
                    class: 'col-sm-4',
                }, input({
                    class: 'form-control',
                    dataBind: {
                        textInput: 'started.field'
                    }
                })),
                div({
                    class: 'col-sm-2'
                }, 'Ended in'),
                div({
                    class: 'col-sm-4',
                }, input({
                    class: 'form-control',
                    dataBind: {
                        textInput: 'ended.field'
                    }
                }))
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
                        textAlign: 'left'
                    }
                }, button({
                    class: 'btn btn-sm btn-default',
                    dataBind: {
                        click: '$component.deleteAffiliation'
                    }
                }, 'X'))
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
                        click: '$component.addAffiliation'
                    }
                }, 'Add New Affiliation')))
            ])
        ]);
    }

    function buildUseMyLocation() {
        if (!('geolocation' in navigator)) {
            return;
        }
        return div({
            style: {
                textAlign: 'center'
            }
        }, [
            button({
                type: 'button',
                class: 'btn btn-default',
                dataBind: {
                    click: 'doUseMyLocation',
                    disable: 'findingLocation'
                }
            }, [
                span({
                    dataBind: {
                        visible: '!findingLocation()'
                    }
                }, 'Use My Location'),
                span({
                    dataBind: {
                        visible: 'findingLocation()'
                    }
                }, [
                    'Finding Location ...',
                    span({
                        class: 'fa fa-spinner fa-pulse'
                    })
                ])
            ])
        ]);
    }

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
            FieldBuilders.buildInput('profile.realname'),
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
                FieldBuilders.buildTypeahead('profile.organization', {}),
                FieldBuilders.buildInput('profile.department'),
                // FieldBuilders.buildTypeahead('profile.jobTitle', {}),
                FieldBuilders.buildSelect('profile.jobTitle', {
                    optionsCaption: ' - '
                }),
                '<!-- ko if: profile.jobTitleOther.field.isEnabled -->',
                FieldBuilders.buildInput('profile.jobTitleOther'),
                '<!-- /ko -->',
                buildAffiliations('profile.affiliations')
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
                FieldBuilders.buildSelect('profile.country', {
                    // optionsCaption: fields.country.emptyValueLabel,
                    // defaultValue: fields.country.defaultValue
                }),
                FieldBuilders.buildInput('profile.city'),
                '<!-- ko if: profile.state.field.isEnabled -->',
                FieldBuilders.buildSelect('profile.state'),
                '<!-- /ko -->',
                '<!-- ko if: profile.postalCode.field.isEnabled -->',
                FieldBuilders.buildInput('profile.postalCode'),
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
                FieldBuilders.buildCheckboxes('profile.researchInterests'),
                '<!-- ko if: profile.researchInterestsOther.field.isEnabled -->',
                FieldBuilders.buildInput('profile.researchInterestsOther'),
                '<!-- /ko -->',
                FieldBuilders.buildSelect('profile.fundingSource', {
                    optionsCaption: ' - '
                }),
                FieldBuilders.buildTextarea('profile.researchStatement', {
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
                FieldBuilders.buildSelect('profile.avatarOption'),
                FieldBuilders.buildSelect('profile.gravatarDefault', {
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
                    }, 'You may save after completing required or erroneous fields')
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
                                name: '"profile-view"',
                                params: {
                                    profile: 'exportedProfile()'
                                }
                            }
                        }
                    })
                ])
            ])
        ]);
    }

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


    function buildAvatarUrl(profile) {
        switch (profile.profile.userdata.avatarOption || 'silhouette') {
        case 'gravatar':
            var gravatarDefault = profile.profile.userdata.gravatarDefault || 'identicon';
            var gravatarHash = profile.profile.synced.gravatarHash;
            if (gravatarHash) {
                return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=32&amp;r=pg&d=' + gravatarDefault;
            } else {
                return Plugin.plugin.fullPath + '/images/nouserpic.png';
            }
        case 'silhouette':
        case 'mysteryman':
        default:
            return Plugin.plugin.fullPath + '/images/nouserpic.png';
        }
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var profile = params.profile;
        var ready = ko.observable(false);
        var dataSource = DataSource({
            sources: {
                // Raw data source
                jobTitles: {
                    file: 'jobTitles.json',
                    type: 'json',
                    translate: function (item) {
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
                    translate: function (item) {
                        return {
                            value: item.label,
                            label: item.label
                        };
                    }
                },
                fundingSource: {
                    file: 'fundingSources.json',
                    type: 'json',
                    translate: function (item) {
                        return {
                            value: item.label,
                            label: item.label
                        };
                    }
                },
                countries: {
                    file: 'countries.json',
                    type: 'json',
                    translate: function (item) {
                        return {
                            value: item.label,
                            label: item.label
                        };
                    }
                },
                states: {
                    file: 'states.json',
                    type: 'json',
                    translate: function (item) {
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

        var realname = {
            ready: true,
            field: ko.observable(profile.user.realname)
                .extend({
                    constraint: {
                        required: true,
                        validate: function (value) {
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
                description: span([
                    'Your name as you wish it to be displayed to other KBase users ',
                    ' as well as KBase staff.'
                ]),
                more: div([
                    p([
                        'Your name will be displayed in any context within the KBase in which you are identified. ',
                        'This includes the Dashboard, User Profile, App Catalog, and Narrative Interface.'
                    ])
                ]),
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var organization = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.organization).extend({
                constraint: {
                    required: true,
                    validate: function (value) {
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
            dataSource: dataSource.getFilter('organizations'),
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
                        'US highter education instutitions dervied from: ',
                        a({
                            href: 'http://carnegieclassifications.iu.edu/index.php',
                            target: '_blank'
                        }, 'Carnegie Classification of Institutions of Higher Education ')
                    ])
                ]),
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var department = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.department).extend({
                constraint: {
                    required: false,
                    validate: function (value) {
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
                more: null,
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

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

        var jobTitle = {
            ready: ko.observable(false),
            field: ko.observable(profile.profile.userdata.jobTitle).extend({
                constraint: {
                    required: false,
                    validate: function (value) {
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
            dataSource: dataSource.getFilter('jobTitles'),
            label: 'Job Title',
            doc: {
                description: 'Your job title or position',
                more: null,
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var jobTitleOther = {
            ready: ko.pureComputed(function () {
                return true;
                // return (jobTitle.field() === 'Other');
            }),
            field: ko.observable(profile.profile.userdata.jobTitleOther)
                .extend({
                    constraint: {
                        required: ko.pureComputed(function () {
                            return (jobTitle.field() === 'Other');
                        }),
                        validate: function (value) {
                            if (value.length < 2) {
                                return 'The field must be at least two characters long';
                            }
                            if (value.length > 50) {
                                return 'The field cannot be longer than 50 characters';
                            }
                        }
                    },
                    enabled: {
                        observable: jobTitle.field,
                        fun: function (value) {
                            return (value === 'Other');
                        }
                    },
                    dirty: false
                }),
            label: 'Job Title (Other)',
            doc: null
        };

        var researchInterests = {
            ready: true,
            field: ko.observableArray(profile.profile.userdata.researchInterests || []).extend({
                // mytest: true,
                constraint: {
                    description: 'Your research interests',
                    required: true,
                    validate: function (value) {
                        // ensure in the list...
                    }
                },
                // required: true,
                dirty: false,
            }),
            // required: true,
            dataSource: dataSource.getFilter('researchInterests'),
            label: 'Research Interests',
            doc: {
                description: null, // 'Please indicate one or more areas of research interest',
                more: null,
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };
        var researchInterestsOther = {
            ready: ko.pureComputed(function () {
                return true;
                // return (jobTitle.field() === 'Other');
            }),
            field: ko.observable(profile.profile.userdata.researchInterestsOther)
                .extend({
                    constraint: {
                        required: ko.pureComputed(function () {
                            return (researchInterests.field() === 'Other');
                        }),
                        validate: function (value) {
                            if (value.length < 2) {
                                return 'The field must be at least two characters long';
                            }
                            if (value.length > 50) {
                                return 'The field cannot be longer than 50 characters';
                            }
                        }
                    },
                    enabled: {
                        observable: researchInterests.field,
                        fun: function (value) {
                            return (value.indexOf('Other') >= 0);
                        }
                    },
                    dirty: false
                }),
            label: 'Other research interest',
            doc: null
        };

        var fundingSource = {
            ready: ko.observable(false),
            field: ko.observable(profile.profile.userdata.fundingSource).extend({
                constraint: {
                    required: false,
                    validate: function (value) {
                        // TODO
                        // ensure in the data source
                    }
                },
                dirty: false
            }),
            dataSource: dataSource.getFilter('fundingSource'),
            emptyLabel: ' - ',
            label: 'Primary funding source',
            doc: {
                description: 'The primary funding source for your work at KBase',
                more: null,
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var city = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.city).extend({
                constraint: {
                    required: true,
                    validate: function (value) {
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

        var country = {
            ready: ko.observable(false),
            field: ko.observable(profile.profile.userdata.country).extend({
                constraint: {
                    required: true,
                    validate: function (value) {
                        // todo: ensure in list of countries.
                    }
                },
                dirty: false
            }),
            label: 'Country',
            doc: null,
            emptyLabel: ' - ',
            dataSource: dataSource.getFilter('countries')
        };

        var state = {
            ready: ko.observable(true),
            // required: true,
            field: ko.observable(profile.profile.userdata.state).extend({
                constraint: {
                    required: ko.pureComputed(function () {
                        return (country.field() === 'United States');
                    }),
                    messages: {
                        requiredButEmpty: 'The state is required if the country is "United States"'
                    },
                    validate: function (value) {
                        // todo: ensure in list of countries.
                    }
                },
                enabled: {
                    observable: country.field,
                    fun: function (newCountry) {
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
            dataSource: dataSource.getFilter('states')
        };

        var postalCode = {
            ready: ko.observable(true),
            // required: {
            //     onlyIf: function () {
            //         return (country.field() === 'United States');
            //     }
            // },
            field: ko.observable(profile.profile.userdata.postalCode).extend({
                constraint: {
                    required: ko.pureComputed(function () {
                        return (country.field() === 'United States');
                    }),
                    messages: {
                        requiredButEmpty: 'The zip code is required if the country is "United States"'
                    },
                    validate: function (value) {
                        if (!/^[0-9]{5}$/.test(value)) {
                            return 'Invalid zip format, expecting #####';
                        }
                    }
                },
                enabled: {
                    observable: country.field,
                    fun: function (newCountry) {
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

        var avatarOption = {
            field: ko.observable(profile.profile.userdata.avatarOption).extend({
                constraint: {
                    required: false,
                    validate: function (value) {
                        // todo ensure in list
                    }
                },
                dirty: false
            }),
            emptyLabel: ' - ',
            dataSource: dataSource.getFilter('avatarOptions'),
            required: false,
            label: 'Avatar Options',
            doc: {
                description: 'Choose to use gravatar, or the KBase anonymous silhouette.',
                more: [],
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };
        var gravatarDefault = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.gravatarDefault).extend({
                constraint: {
                    required: false,
                    validate: function (value) {
                        // todo ensure in linst
                    }
                },
                dirty: false
            }),
            required: false,
            label: 'Gravatar Default Image',
            dataSource: dataSource.getFilter('gravatarDefaults'),
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
                        'identify you in the ui. If you do not wish to have a unique gravatar, you may selecte ',
                        '"mystery man" or "blank"'
                    ])
                ]),
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        // ko.validation.rules['year'] = {
        //     validator: function (val) {
        //         if (!/^[0-9][0-9][0-9][0-9]$/.test(val)) {
        //             return false;
        //         }
        //         return true;
        //     },
        //     message: 'A username may only contain the characters a-z, 0-0, and _.'
        // };
        ko.validation.registerExtenders();

        var affils = profile.profile.userdata.affiliations || [];

        function affiliationVm(affil) {
            var title = {
                field: ko.observable(affil && affil.title).extend({
                    constraint: {
                        required: true,
                        validate: function (value) {
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

            var organization = {
                field: ko.observable(affil && affil.organization).extend({
                    constraint: {
                        required: false,
                        validate: function (value) {
                            // todo ensure in list
                        }
                    },
                    dirty: false
                }),
                dataSource: dataSource.getFilter('organizations')
            };
            var started = {
                field: ko.observable(affil && affil.started).extend({
                    constraint: {
                        required: true,
                        validate: function (value) {
                            if (!/^[0-9][0-9][0-9][0-9]$/.test(value)) {
                                return 'Invalid year format, expecting ####';
                            }
                        }
                    },
                    dirty: false
                })
            };

            var ended = {
                field: ko.observable(affil && affil.ended).extend({
                    constraint: {
                        required: false,
                        validate: function (value) {
                            if (!/^[0-9][0-9][0-9][0-9]$/.test(value)) {
                                return 'Invalid year format, expecting ####';
                            }
                        }
                    },
                    dirty: false
                })
            };

            return {
                title: title,
                organization: organization,
                started: started,
                ended: ended
            };
        }

        var affiliations = {
            field: ko.observableArray(affils.map(function (affil) {
                    return affiliationVm(affil);
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
                ]),
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var researchStatement = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.researchStatement).extend({
                constraint: {
                    required: true,
                    validate: function (value) {
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
        var researchStatementDisplay = ko.pureComputed(function () {
            var text = researchStatement.field();
            if (!text) {
                return '';
            }
            return text.replace(/\n/g, '<br>');
        });

        var username = profile.user.username;

        var gravatarHash = profile.profile.synced.gravatarHash;
        var gravatarUrl = ko.pureComputed(function () {
            try {
                switch (avatarOption.field() || 'silhoutte') {
                case 'gravatar':
                    return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=200&amp;r=pg&d=' + gravatarDefault.field() || 'identicon';
                case 'silhouette':
                case 'mysteryman':
                    return Plugin.plugin.fullPath + '/images/nouserpic.png';
                }
            } catch (ex) {
                console.error('ERROR computing gravatar url', ex);
            }
        });

        var vmFields = [
            realname.field, city.field, state.field, postalCode.field, country.field, organization.field,
            department.field, avatarOption.field, gravatarDefault.field, affiliations.field,
            researchStatement.field, researchInterests.field, researchInterestsOther.field, fundingSource.field,
            jobTitle.field, jobTitleOther.field
        ];

        var someDirty = ko.pureComputed(function () {
            // some are dirty
            return vmFields.some(function (field, index) {
                return field.isDirty();
            });
        });
        var someInvalid = ko.pureComputed(function () {
            var oldStyle = vmFields.some(function (field) {
                if (field.isValid) {
                    // console.log('is valid?', field.label, field.isValid());
                    return !field.isValid();
                } else {
                    return false;
                }
            });
            var newStyle = vmFields.some(function (field) {
                if (field.constraint) {
                    return !field.constraint.isValid();
                }
                return false;
            });
            return (oldStyle || newStyle);
        });

        var formCanSave = ko.pureComputed(function () {
            var d = someDirty();
            var iv = someInvalid();
            // console.log(d, iv);
            return d && !iv;
        });

        var exportedProfile = ko.pureComputed(function () {
            return {
                user: {
                    username: username,
                    realname: realname.field()
                },
                profile: {
                    userdata: {
                        jobTitle: jobTitle.field(),
                        jobTitleOther: jobTitleOther.field(),
                        organization: organization.field(),
                        department: department.field(),
                        city: city.field(),
                        state: state.field(),
                        postalCode: postalCode.field(),
                        country: country.field(),
                        researchInterests: researchInterests.field(),
                        researchInterestsOther: researchInterestsOther.field(),
                        fundingSource: fundingSource.field(),
                        affiliations: affiliations.field().map(function (af) {
                            return {
                                title: af.title.field(),
                                organization: af.organization.field(),
                                started: af.started.field(),
                                ended: af.ended.field()
                            };
                        }),
                        researchStatement: researchStatement.field(),
                        avatarOption: avatarOption.field(),
                        gravatarDefault: gravatarDefault.field(),
                    },
                    synced: {
                        gravatarHash: gravatarHash
                    }
                },

            };
        });

        function saveProfile() {
            var client = new UserProfileService(runtime.config('services.user_profile.url'), {
                token: runtime.service('session').getAuthToken()
            });

            // get the profile, then update it, then save it.
            // TODO profile service should accept just change set.

            return client.get_user_profile([username])
                .then(function (result) {
                    var profile = result[0];
                    var account = {};
                    var profileChanges = false;
                    var accountChanges = false;
                    // build the update object.
                    // TODO: detect changed fields - knockout?

                    if (realname.field.isDirty()) {
                        profile.user.realname = realname.field();
                        realname.field.markClean();
                        account.display = realname.field();
                        accountChanges = true;
                        profileChanges = true;
                    }

                    if (city.field.isDirty()) {
                        profile.profile.userdata.city = city.field();
                        city.field.markClean();
                        profileChanges = true;
                    }

                    if (state.field.isDirty()) {
                        profile.profile.userdata.state = state.field();
                        state.field.markClean();
                        profileChanges = true;
                    }

                    if (postalCode.field.isDirty()) {
                        profile.profile.userdata.postalCode = postalCode.field();
                        postalCode.field.markClean();
                        profileChanges = true;
                    }

                    if (country.field.isDirty()) {
                        profile.profile.userdata.country = country.field();
                        country.field.markClean();
                        profileChanges = true;
                    }

                    if (organization.field.isDirty()) {
                        profile.profile.userdata.organization = organization.field();
                        organization.field.markClean();
                        profileChanges = true;
                    }

                    if (department.field.isDirty()) {
                        profile.profile.userdata.department = department.field();
                        department.field.markClean();
                        profileChanges = true;
                    }

                    if (fundingSource.field.isDirty()) {
                        profile.profile.userdata.fundingSource = fundingSource.field();
                        fundingSource.field.markClean();
                        profileChanges = true;
                    }

                    if (avatarOption.field.isDirty()) {
                        profile.profile.userdata.avatarOption = avatarOption.field();
                        avatarOption.field.markClean();
                        profileChanges = true;
                    }

                    if (gravatarDefault.field.isDirty()) {
                        profile.profile.userdata.gravatarDefault = gravatarDefault.field();
                        gravatarDefault.field.markClean();
                        profileChanges = true;
                    }

                    if (affiliations.field.isDirty()) {
                        // just bundle the whole thing up...
                        var newAffiliations = affiliations.field().map(function (af) {
                            return {
                                title: af.title.field(),
                                organization: af.organization.field(),
                                started: af.started.field(),
                                ended: af.ended.field()
                            };
                        });
                        profile.profile.userdata.affiliations = newAffiliations;
                        affiliations.field.markClean();
                        profileChanges = true;
                    }

                    if (researchStatement.field.isDirty()) {
                        profile.profile.userdata.researchStatement = researchStatement.field();
                        researchStatement.field.markClean();
                        profileChanges = true;
                    }

                    if (jobTitle.field.isDirty()) {
                        profile.profile.userdata.jobTitle = jobTitle.field();
                        jobTitle.field.markClean();
                        profileChanges = true;
                    }

                    if (jobTitleOther.field.isDirty()) {
                        profile.profile.userdata.jobTitleOther = jobTitleOther.field();
                        jobTitleOther.field.markClean();
                        profileChanges = true;
                    }

                    if (researchInterests.field.isDirty()) {
                        profile.profile.userdata.researchInterests = researchInterests.field();
                        researchInterests.field.markClean();
                        profileChanges = true;
                    }
                    if (researchInterestsOther.field.isDirty()) {
                        profile.profile.userdata.researchInterestsOther = researchInterestsOther.field();
                        researchInterestsOther.field.markClean();
                        profileChanges = true;
                    }


                    var changes = [];
                    if (profileChanges) {
                        changes.push(client.set_user_profile({
                            profile: profile
                        }));
                    }
                    if (accountChanges) {
                        changes.push(runtime.service('session').getClient().putMe(account));
                    }

                    return Promise.all(changes)
                        .then(function () {
                            if (profileChanges) {
                                runtime.send('profile', 'reload');
                            }
                        });
                });
        }

        // ACTIONS

        function doSaveProfile() {
            saveProfile()
                .then(function () {
                    runtime.send('notification', 'notify', {
                        type: 'success',
                        icon: 'thumbs-up',
                        message: 'Successfuly saved your profile',
                        autodismiss: 3000
                    });
                    // message('Successfully Saved');
                    // messageType({
                    //     'alert-success': true,
                    //     hidden: false
                    // });
                })
                .catch(function (err) {
                    console.error('boo', err);
                    message('Error saving');
                    messageType({
                        'alert-danger': true,
                        hidden: false
                    });
                });
        }

        var message = ko.observable();
        var messageType = ko.observable();

        function deleteAffiliation(item) {
            affiliations.field.remove(item);
        }

        function addAffiliation() {
            affiliations.field.push(affiliationVm());
        }

        var findingLocation = ko.observable(false);

        function doUseMyLocation() {
            findingLocation(true);
            navigator.geolocation.getCurrentPosition(function (position) {
                GeoNames.getCountryCode({
                        username: 'eapearson',
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    .then(function (response) {
                        country.field(response.countryName);
                    })
                    .catch(function (err) {
                        console.error('ERROR', err);
                    })
                    .finally(function () {
                        findingLocation(false);
                    });
            });
        }

        return {
            // fields being edited or displayed
            profile: {
                ready: ready,
                username: username,
                realname: realname,
                organization: organization,
                department: department,
                city: city,
                state: state,
                postalCode: postalCode,
                country: country,
                avatarOption: avatarOption,
                gravatarDefault: gravatarDefault,
                affiliations: affiliations,
                researchStatement: researchStatement,
                researchStatementDisplay: researchStatementDisplay,
                jobTitle: jobTitle,
                jobTitleOther: jobTitleOther,
                researchInterests: researchInterests,
                researchInterestsOther: researchInterestsOther,
                fundingSource: fundingSource,

                // computed
                gravatarUrl: gravatarUrl
            },

            // UI
            findingLocation: findingLocation,
            message: message,
            messageType: messageType,

            // Editing state
            someDirty: someDirty,
            someInvalid: someInvalid,
            formCanSave: formCanSave,

            // ACTIONS

            doSaveProfile: doSaveProfile,
            deleteAffiliation: deleteAffiliation,
            addAffiliation: addAffiliation,
            exportedProfile: exportedProfile,
            doUseMyLocation: doUseMyLocation
        };
    }


    function component() {
        return {
            viewModel: viewModel,
            template: buildTemplate()
        };
    }
    ko.components.register('profile-editor', component());
});