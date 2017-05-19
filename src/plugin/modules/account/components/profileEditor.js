/* global Promise*/
define([
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
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        h2 = t('h2'),
        h3 = t('h3'),
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
                        with: 'institution'
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
                        textInput: 'start_year.field'
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
                        textInput: 'end_year.field'
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
                FieldBuilders.buildSelect('profile.jobTitle', {
                    optionsCaption: ' - '
                }),
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
                FieldBuilders.buildInput('profile.city'),
                FieldBuilders.buildInput('profile.state'),
                FieldBuilders.buildInput('profile.postalCode'),
                FieldBuilders.buildSelect('profile.country', {
                    // optionsCaption: fields.country.emptyValueLabel,
                    // defaultValue: fields.country.defaultValue
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
                }, 'Research'),
                FieldBuilders.buildCheckboxes('profile.researchInterests'),
                FieldBuilders.buildSelect('profile.fundingSource', {
                    optionsCaption: ' - '
                }),
                FieldBuilders.buildTextarea('profile.personalStatement', {
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
            div([
                div({
                    dataBind: {
                        visible: 'someDirty'
                    }
                }, [
                    div({
                        class: 'alert alert-warning'
                    }, 'You have made changes to your profile.')
                ]),
                div({
                    dataBind: {
                        visible: 'someInvalid'
                    }
                }, [
                    div({
                        class: 'alert alert-danger'
                    }, 'You have empty required or invalid fields -- you must fix them before you can save any changes.')
                ])
            ]),
            buildMessageDisplay(),
            div({
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
                    backgroundColor: 'rgba(255,185,2,0.5)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'row'
                }
            }, [
                div({
                    style: {
                        flex: '2',
                        color: 'rgba(0,121,98,1)', // 0, 121, 98
                        fontSize: '130%',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }
                }, 'Edit Your Profile'),
                div({
                    style: {
                        flex: '1',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    },
                    dataBind: {
                        text: 'message'
                    }
                }),
                div({
                    style: {
                        flex: '1',
                        textAlign: 'right'
                    }
                }, [
                    a({
                        class: 'btn btn-link',
                        href: '#people'
                    }, 'Open Your Profile Page'),
                    buildSaveButton()
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
                        }, 'Preview')
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

    };

    function viewModel(params) {
        var runtime = params.runtime;
        var profile = params.profile;
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
                        }
                    }
                }
            }
        });

        var realname = {
            ready: true,
            field: ko.observable(profile.user.realname)
                .extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
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
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            dataSource: dataSource.getFilter('organizations'),
            required: true,
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
                required: false,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            required: false,
            label: 'Department',
            doc: {
                description: 'Your department or area of specialization within the organization',
                more: div([
                    p([
                        'additional details here...'
                    ])
                ]),
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
            required: true,
            field: ko.observable(profile.profile.userdata.jobTitle).extend({
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            emptyLabel: ' - ',
            dataSource: dataSource.getFilter('jobTitles'),
            label: 'Job Title',
            doc: {
                description: 'Your job title or position',
                more: 'this is more stuff',
                showMore: ko.observable(false),
                toggleShowMore: function () {
                    this.showMore(!this.showMore());
                }
            }
        };

        var researchInterests = {
            ready: true,
            field: ko.observableArray(profile.profile.userdata.researchInterests || []).extend({
                required: true,
                dirty: false,
            }),
            required: true,
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

        var fundingSource = {
            ready: ko.observable(false),
            field: ko.observable(profile.profile.userdata.fundingSource).extend({
                required: false,
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
            required: true,
            field: ko.observable(profile.profile.userdata.city).extend({
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            label: 'City',
            doc: null
        };

        var state = {
            ready: ko.observable(true),
            required: true,
            field: ko.observable(profile.profile.userdata.state).extend({
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            label: 'State, Province, or Region',
            doc: null
        };
        var postalCode = {
            ready: ko.observable(true),
            required: true,
            field: ko.observable(profile.profile.userdata.postalCode).extend({
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            label: 'Zip or Postal Code',
            doc: null
        };

        var country = {
            ready: ko.observable(false),
            required: true,
            field: ko.observable(profile.profile.userdata.country).extend({
                required: true,
                minLength: 2,
                maxLength: 100,
                dirty: false
            }),
            label: 'Country',
            doc: null,
            emptyLabel: ' - ',
            dataSource: dataSource.getFilter('countries')
        };

        var avatarOption = {
            field: ko.observable(profile.profile.userdata.avatarOption).extend({
                required: false,
                minLength: 2,
                maxLength: 100,
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
            field: ko.observable(profile.profile.userdata.gravatarDefault || 'monsterid').extend({
                required: false,
                minLength: 2,
                maxLength: 100,
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

        var affils = profile.profile.userdata.affiliations || [];

        function affiliationVm(affil) {
            var title = {
                field: ko.observable(affil && affil.title).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                })
            };

            var institution = {
                field: ko.observable(affil && affil.institution).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                }),
                dataSource: dataSource.getFilter('organizations')
            };
            var start_year = {
                field: ko.observable(affil && affil.start_year).extend({
                    required: true,
                    year: true,
                    dirty: false
                })
            };

            var end_year = {
                field: ko.observable(affil && affil.end_year).extend({
                    required: false,
                    year: true,
                    dirty: false
                })
            };

            return {
                title: title,
                institution: institution,
                start_year: start_year,
                end_year: end_year
            };
        }

        var affiliations = {
            field: ko.observableArray(affils.map(function (affil) {
                return affiliationVm(affil);
            })).extend({
                required: false,
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

        var personalStatement = {
            ready: ko.observable(true),
            field: ko.observable(profile.profile.userdata.personalStatement).extend({
                required: false,
                minLength: 2,
                maxLength: 400,
                dirty: false
            }),
            required: false,
            label: 'Research or Personal Statement',
            doc: {
                description: span([
                    'Describe yourself to fellow Narrators'
                ]),
                more: null
            }
        };
        var personalStatementDisplay = ko.pureComputed(function () {
            var text = personalStatement.field();
            if (!text) {
                return '';
            }
            return text.replace(/\n/g, '<br>');
        });

        var username = profile.user.username;

        var gravatarHash = profile.profile.synced.gravatarHash;
        var gravatarUrl = ko.pureComputed(function () {
            try {
                switch (avatarOption.field()) {
                case 'gravatar':
                    return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=200&amp;r=pg&d=' + gravatarDefault.field();
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
            personalStatement.field, researchInterests.field, fundingSource.field,
            jobTitle.field
        ];

        var someDirty = ko.pureComputed(function () {
            // some are dirty
            return vmFields.some(function (field, index) {
                return field.isDirty();
            });
        });
        var someInvalid = ko.pureComputed(function () {
            return vmFields.some(function (field) {
                if (field.isValid) {
                    return !field.isValid();
                } else {
                    return false;
                }
            });
        });

        var formCanSave = ko.pureComputed(function () {
            return someDirty() && !someInvalid();
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
                        organization: organization.field(),
                        department: department.field(),
                        city: city.field(),
                        state: state.field(),
                        postalCode: postalCode.field(),
                        country: country.field(),
                        researchInterests: researchInterests.field(),
                        fudingSource: fundingSource.field(),
                        affiliations: affiliations.field().map(function (af) {
                            return {
                                title: af.title.field(),
                                institution: af.institution.field(),
                                start_year: af.start_year.field(),
                                end_year: af.end_year.field()
                            };
                        }),
                        personalStatement: personalStatement.field(),
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
                                institution: af.institution.field(),
                                start_year: af.start_year.field(),
                                end_year: af.end_year.field()
                            };
                        });
                        profile.profile.userdata.affiliations = newAffiliations;
                        affiliations.field.markClean();
                        profileChanges = true;
                    }

                    if (personalStatement.field.isDirty()) {
                        profile.profile.userdata.personalStatement = personalStatement.field();
                        personalStatement.field.markClean();
                        profileChanges = true;
                    }

                    if (jobTitle.field.isDirty()) {
                        profile.profile.userdata.jobTitle = jobTitle.field();
                        jobTitle.field.markClean();
                        profileChanges = true;
                    }

                    if (researchInterests.field.isDirty()) {
                        profile.profile.userdata.researchInterests = researchInterests.field();
                        researchInterests.field.markClean();
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
                    message('Successfully Saved');
                    messageType({
                        'alert-success': true,
                        hidden: false
                    });
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
                personalStatement: personalStatement,
                personalStatementDisplay: personalStatementDisplay,
                jobTitle: jobTitle,
                researchInterests: researchInterests,
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