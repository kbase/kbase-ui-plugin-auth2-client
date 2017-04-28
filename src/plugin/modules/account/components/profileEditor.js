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
    // 'csv!../../../resources/data/institutions.csv'
    'json!../../../resources/data/institutions.json',
    'yaml!../../../resources/data/nationalLabs.yaml'
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
    Institutions,
    NationalLabs
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        a = t('a'),
        p = t('p'),
        input = t('input'),
        button = t('button'),
        img = t('img'),
        h3 = t('h3'),
        ul = t('ul'),
        li = t('li');

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
                value: 'mr',
                label: 'Mr.'
            }, {
                value: 'ms',
                label: 'Ms.'
            }, {
                value: 'miss',
                label: 'Miss'
            }, {
                value: 'mrs',
                label: 'Mrs.'
            }, {
                value: 'dr',
                label: 'Dr.'
            }, {
                value: 'prof',
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
        organizationOther: {
            name: 'organizationOther',
            required: false,
            label: 'Organization Other',
            description: 'Your organization not in the list? Enter it here'
                // more: div([
                //     p([
                //         'more stuff here.'
                //     ])
                // ])
        },
        department: {
            name: 'department',
            required: false,
            label: 'Department',
            description: 'Your department or area of specialization within the organization',
            more: div([
                p([
                    'additional details here...'
                ])
            ])
        },
        jobTitle: {
            name: 'jobTitle',
            required: true,
            label: 'Job Title',
            description: 'Your job title',
            more: div([
                p([
                    'What you do where you are'
                ])
            ])
        },
        researchInterests: {
            name: 'researchInterests',
            required: true,
            label: 'Research Interests',
            description: 'Please indicate one or more areas of research interest',
            more: div([
                p([
                    'Blah blah'
                ])
            ]),
            availableValues: [{
                    value: 'annotation',
                    label: 'Genome Annotation'
                },
                {
                    value: 'assembly',
                    label: 'Genome Assembly'
                },
                {
                    value: 'communities',
                    label: 'Microbial Communities'
                },
                {
                    value: 'comparative_genomics',
                    label: 'Comparative Genomics'
                },
                {
                    value: 'expression',
                    label: 'Expression'
                },
                {
                    value: 'metabolic_modeling',
                    label: 'Metabolic Modeling'
                },
                {
                    value: 'reads',
                    label: 'Read Processing'
                },
                {
                    value: 'sequence',
                    label: 'Sequence Analysis'
                },
                {
                    value: 'util',
                    label: 'Utilities'
                }
            ]
        },
        fundingSource: {
            name: 'fundingSource',
            required: false,
            label: 'Primary funding source',
            description: 'The primary funding source for your work at KBase',
            availableValues: [
                { value: 'DOE Office of Energy Efficiency and Renewable Energy (EERE)', label: 'DOE Office of Energy Efficiency and Renewable Energy (EERE)' },
                { value: 'DOE Office of Environmental Management (EM)', label: 'DOE Office of Environmental Management (EM)' },
                { value: 'DOE Office of Fossil Energy (FE)', label: 'DOE Office of Fossil Energy (FE)' },
                { value: 'DOE Office Nuclear Energy (NE)', label: 'DOE Office Nuclear Energy (NE)' },
                { value: 'DOE National Nuclear Security Administration (NNSA)', label: 'DOE National Nuclear Security Administration (NNSA)' },
                { value: 'DOE Small Business Innovation Research/Small Business Technology Transfer (SBIR/STTR)', label: 'DOE Small Business Innovation Research/Small Business Technology Transfer (SBIR/STTR)' },
                { value: 'DOE Office of Science Advenced Scientific Computing Research (ASCR)', label: 'DOE Office of Science Advenced Scientific Computing Research (ASCR)' },
                { value: 'DOE Office of Science Basic Energy Sciences (BES)', label: 'DOE Office of Science Basic Energy Sciences (BES)' },
                { value: 'DOE Office of Science BES Energy Frontier Science Center (EFRC)', label: 'DOE Office of Science BES Energy Frontier Science Center (EFRC)' },
                { value: 'DOE Office of Science Biological and Environmental Research (BER)', label: 'DOE Office of Science Biological and Environmental Research (BER)' },
                { value: 'DOE Office of Science Fusion Energy Sciences (FES)', label: 'DOE Office of Science Fusion Energy Sciences (FES)' },
                { value: 'DOE Office of Science High Energy Physics (HEP)', label: 'DOE Office of Science High Energy Physics (HEP)' },
                { value: 'DOE Office of Science Nuclear Physics (NP)', label: 'DOE Office of Science Nuclear Physics (NP)' },
                { value: 'DOE Office of Science Workforce Development for Teachers and Students (WDTS)', label: 'DOE Office of Science Workforce Development for Teachers and Students (WDTS)' },
                { value: 'DOE Laboratory Directed Research and Development (LDRD)', label: 'DOE Laboratory Directed Research and Development (LDRD)' },
                { value: 'USDA - Agricultural Research Service (ARS)', label: 'USDA - Agricultural Research Service (ARS)' },
                { value: 'USDA - Forest Service (FS)', label: 'USDA - Forest Service (FS)' },
                { value: 'DOC - National Institute of Standards and Technology (NIST)', label: 'DOC - National Institute of Standards and Technology (NIST)' },
                { value: 'DOC - National Oceanic and Atmospheric Administration (NOAA)', label: 'DOC - National Oceanic and Atmospheric Administration (NOAA)' },
                { value: 'DOD - Defense Advanced Research Projects Agency (DARPA)', label: 'DOD - Defense Advanced Research Projects Agency (DARPA)' },
                { value: 'U.S. Department of Education (DOEd)', label: 'U.S. Department of Education (DOEd)' },
                { value: 'U.S. Department of Health and Human Services (HHS) - Other (excl. NCI and NIH)', label: 'U.S. Department of Health and Human Services (HHS) - Other (excl. NCI and NIH)' },
                { value: 'HHS - Centers for Disease Control (CDC)', label: 'HHS - Centers for Disease Control (CDC)' },
                { value: 'HHS - National Institutes of Health (NIH)', label: 'HHS - National Institutes of Health (NIH)' },
                { value: 'HHS - NIH - National Cancer Institute (NCI)', label: 'HHS - NIH - National Cancer Institute (NCI)' },
                { value: 'HHS - U.S. United States Food and Drug Administration (FDA)', label: 'HHS - U.S. United States Food and Drug Administration (FDA)' },
                { value: 'U.S. Department of Homeland Security (DHS)', label: 'U.S. Department of Homeland Security (DHS)' },
                { value: 'DOI - U.S. Geological Survey (USGS)', label: 'DOI - U.S. Geological Survey (USGS)' },
                { value: 'DOI - U.S. Fish and Wildlife Service (FWS)', label: 'DOI - U.S. Fish and Wildlife Service (FWS)' },
                { value: 'U.S. Department of Transportation (DOT)', label: 'U.S. Department of Transportation (DOT)' },
                { value: 'Environmental Protection Agency (EPA)', label: 'Environmental Protection Agency (EPA)' },
                { value: 'National Aeronautics and Space Administration (NASA)', label: 'National Aeronautics and Space Administration (NASA)' },
                { value: 'National Science Foundation (NSF)', label: 'National Science Foundation (NSF)' },
                { value: 'Nuclear Regulatory Commission (NRC)', label: 'Nuclear Regulatory Commission (NRC)' },
                { value: 'Small Business Administration (SBA)', label: 'Small Business Administration (SBA)' },
                { value: 'U.S. Other Federal Agency', label: 'U.S. Other Federal Agency' },
                { value: 'Federally Funded Research and Development Center (FFRDC) - (Specify)', label: 'Federally Funded Research and Development Center (FFRDC) - (Specify)' },
                { value: 'other', label: 'Other' }
            ]
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
            description: 'A generated or custom avatar displayed throughout the KBase interface to identify you.',
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
            availableValues: [{
                value: 'mm',
                label: 'Mystery Man - simple, cartoon-style silhouetted outline'
            }, {
                value: 'identicon',
                label: 'Identicon - a geometric pattern based on an email hash'
            }, {
                value: 'monsterid',
                label: 'MonsterID - generated "monster" with different colors, faces, etc'
            }, {
                value: 'wavatar',
                label: 'Wavatar - generated faces with differing features and backgrounds'
            }, {
                value: 'retro',
                label: 'Retro - 8-bit arcade-style pixelated faces'
            }, {
                value: 'blank',
                label: 'Blank - A Blank Space'
            }]
        },

        avatarOption: {
            name: 'avatarOption',
            label: 'Avatar Option',
            description: 'Choose to use gravatar, or one of the KBase default avatars',
            more: div([
                p([
                    'More stuff here...'
                ])
            ]),
            availableValues: [{
                value: 'gravatar',
                label: 'Gravatar - Use your Gravatar image otherwise random generator selected below'
            }, {
                value: 'mysteryman',
                label: 'Mystery Man - simple, anonymous, cartoon-style silhouetted outline'
            }]
        },

        affiliations: {
            name: 'affiliations',
            label: 'Affiliations',
            description: 'Your history of organizational affiliations ',
            more: div([
                p([
                    'Maintaining your history of orgzniational affiliations can help other users identify you.',
                ])
            ])
        },


        realname: {
            name: 'realname',
            required: true,
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
                ])
            ])
        },

        personalStatement: {
            name: 'personalStatement',
            required: false,
            label: 'Research or Personal Statement',
            type: 'textarea',
            style: {
                height: '10em'
            },
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

    function dirtyIcon(field) {
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-flash text-muted": ' + field.name + '.isDirty() !== true, "glyphicon-flash text-warning":' + field.name + '.isDirty()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    function fieldDoc(description, content, name) {
        return div({
            dataElement: 'more',
            class: 'field-doc'
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
        return [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Title'),
                div({
                        class: 'col-sm-10',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            textInput: 'title'
                        }
                    }))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Institution'),
                div({
                        class: 'col-sm-10',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            textInput: 'institution'
                        }
                    }))
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-sm-2'
                }, 'Starting in'),
                div({
                        class: 'col-sm-4',
                    },
                    input({
                        class: 'form-control',
                        dataBind: {
                            textInput: 'start_year'
                        }
                    })),
                div({
                    class: 'col-sm-2'
                }, 'Ending in'),
                div({
                        class: 'col-sm-4',
                    },
                    input({
                        class: 'form-control',
                        textInput: {
                            textInput: 'end_year'
                        }
                    }))
            ])
        ];
    }

    function buildAffiliation() {
        return div({
            class: 'container-fluid',
            style: {
                marginBottom: '10px'
            }
        }, [
            div({
                class: 'row form-sub-row'
            }, [
                div({
                    class: 'col-md-11'
                }, buildAffiliationForm()),
                div({
                    class: 'col-md-1'
                }, button({
                    class: 'btn btn-default',
                    dataBind: {
                        click: '$parent.deleteAffiliation'
                    }
                }, 'X'))
            ])
        ]);
    }

    function buildAffiliations(field) {
        var id = html.genId();
        return div({
            class: 'form-group form-row'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    label({
                        for: id
                    }, [field.label, requiredIcon(field), dirtyIcon(field)]),
                    fieldDoc(field.description, field.more, field.name)
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                        class: 'col-md-12'
                    },
                    div({
                        dataBind: {
                            foreach: 'affiliations'
                        }
                    }, buildAffiliation()))
            ]),
            div({
                class: 'row',
                border: '1px orange blue'
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
            style: {
                marginBottom: '12px'
            },
            dataBind: {
                validationOptions: {
                    insertMessages: 'false'
                }
            }
        }, [
            // buildTypeahead(fields.title),
            FieldBuilders.buildInput(fields.realname),
            FieldBuilders.buildInput(fields.jobTitle),
            // buildInput(fields.suffix),
            FieldBuilders.buildSelect(fields.organization, {
                optionsCaption: '- select an organization or "other" to enter your own -'
            }),
            div({
                    dataBind: {
                        if: 'organization() === "other"'
                    }
                },
                FieldBuilders.buildInput(fields.organizationOther)
            ),
            FieldBuilders.buildInput(fields.department),
            FieldBuilders.buildInput(fields.location),
            FieldBuilders.buildCheckboxes(fields.researchInterests),
            FieldBuilders.buildSelect(fields.fundingSource, {
                optionsCaption: '- optionally select a funding source or "other" -'
            }),
            buildAffiliations(fields.affiliations),
            FieldBuilders.buildTextarea(fields.personalStatement),

            FieldBuilders.buildSelect(fields.avatarOption),
            FieldBuilders.buildSelect(fields.gravatarDefault, {
                condition: 'avatarOption() === "gravatar"'
            }),
            // div([
            //     p({
            //         dataBind: {
            //             visible: 'someDirty'
            //         },
            //         class: 'text-warning'
            //     }, 'You have changed fields, you should save the form to preserve your changes.'),
            //     p({
            //         dataBind: {
            //             visible: 'someInvalid'
            //         },
            //         class: 'text-danger'
            //     }, 'You have incomplete required or invalid fields, please fix them and then save your profile.')
            // ]),
            // buildMessageDisplay(),
            // button({
            //     class: 'btn btn-primary',
            //     type: 'button',
            //     dataBind: {
            //         click: 'doSaveProfile',
            //         enable: 'formCanSave'
            //     }
            // }, 'Save')
        ]);
        return content;
    }

    function buildSaver() {
        return div([
            div([
                p({
                    dataBind: {
                        visible: 'someDirty'
                    },
                    class: 'text-warning'
                }, [
                    span({
                        class: 'fa fa-exclamation',
                        style: {
                            marginRight: '1em'
                        }
                    }),
                    'You have made changes to your profile -- you should save them if you wish to preserve them.'
                ]),
                p({
                    dataBind: {
                        visible: 'someInvalid'
                    },
                    class: 'text-danger'
                }, [
                    span({
                        class: 'fa fa-exclamation-triangle',
                        style: {
                            marginRight: '1em'
                        }
                    }),
                    'You have empty required or invalid fields -- please fix them and then save your profile.'
                ])
            ]),
            buildMessageDisplay(),
            button({
                class: 'btn btn-primary',
                type: 'button',
                dataBind: {
                    click: 'doSaveProfile',
                    enable: 'formCanSave'
                }
            }, 'Save')
        ]);
    }

    function buildPreview() {

        return div([
            h3('Your Profile - Preview'),
            p({}, a({
                href: '#people'
            }, 'Visit your profile page')),
            BS.buildPanel({
                type: 'default',
                title: span([
                    span({
                        dataBind: {
                            text: 'realname'
                        }
                    }),
                    ' (',
                    span({
                        dataBind: {
                            text: 'username'
                        }
                    }),
                    ')'
                ]),
                body: div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-3'
                    }, img({
                        style: {
                            width: '100%'
                        },
                        dataBind: {
                            attr: {
                                src: 'gravatarUrl'
                            }
                        }
                    })),
                    div({
                        class: 'col-md-9'
                    }, [
                        div({
                            style: {
                                fontWeight: 'bold',
                                fontSize: '120%'
                            },
                            dataBind: {
                                text: 'realname'
                            }
                        }),

                        div({
                            style: {
                                fontStyle: 'italic',
                                marginBottom: '1em'
                            },
                            dataBind: {
                                text: 'jobTitle'
                            }
                        }),
                        div({
                            dataBind: {
                                visible: 'organization() !== "other"',
                                text: 'organization'
                            }
                        }),
                        div({
                            dataBind: {
                                visible: 'organization() === "other"',
                                text: 'organizationOther'
                            }
                        }),
                        div({
                            dataBind: {
                                text: 'department'
                            }
                        }),
                        div({
                            dataBind: {
                                text: 'location'
                            }
                        }),
                        h3('Research Interests'),
                        div({
                            dataBind: {
                                visible: 'researchInterests.exportDisplay().length === 0'
                            },
                            style: {
                                fontStyle: 'italic'
                            }
                        }, 'No research interests selected'),
                        ul({
                            dataBind: {
                                foreach: 'researchInterests.exportDisplay()'
                            }
                        }, li({
                            dataBind: {
                                text: '$data'
                            }
                        })),
                        div({
                            dataBind: {
                                if: 'fundingSource'
                            }
                        }, [
                            h3('Primary Funding Source'),
                            div({
                                dataBind: {
                                    text: 'fundingSource'
                                }
                            })
                        ]),
                        h3('Affiliations'),
                        div({
                            dataBind: {
                                visible: 'affiliations().length === 0'
                            },
                            style: {
                                fontStyle: 'italic'
                            }
                        }, 'No affiliations provided'),
                        div({
                            dataBind: {
                                foreach: 'affiliations'
                            }
                        }, div([
                            p({
                                style: {
                                    fontWeight: 'bold'
                                }
                            }, [
                                span({
                                    dataBind: {
                                        text: 'title'
                                    }
                                }),
                                ' (',
                                span({
                                    dataBind: {
                                        text: 'start_year'
                                    }
                                }),
                                ' - ',
                                span({
                                    dataBind: {
                                        text: 'end_year_display'
                                    }
                                }),
                                ') ',
                                ' @ ',
                                span({
                                    dataBind: {
                                        text: 'institution'
                                    }
                                })
                            ])
                        ])),
                        h3('Research or Personal Statement'),
                        div({
                            dataBind: {
                                visible: 'personalStatementDisplay().length === 0'
                            },
                            style: {
                                fontStyle: 'italic'
                            }
                        }, 'No research statement provided'),
                        div({
                            class: 'well',
                            dataBind: {
                                visible: 'personalStatementDisplay().length > 0',
                                html: 'personalStatementDisplay'
                            }
                        })
                    ])
                ])
            })
        ]);
    }

    function buildTemplate() {
        return div({
            class: 'row'
        }, [
            div({
                class: 'col-md-6'
            }, buildForm()),
            div({
                class: 'col-md-6'
            }, [
                buildPreview(),
                buildSaver()
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

    function component() {
        return {
            viewModel: function (params) {
                var runtime = params.runtime;
                var profile = params.profile;

                var realname = ko.observable(profile.user.realname)
                    .extend({
                        required: true,
                        minLength: 2,
                        maxLength: 100,
                        dirty: false
                    });

                // var title = ko.observable(profile.profile.userdata.title).extend({
                //     required: true,
                //     minLength: 2,
                //     maxLength: 100,
                //     dirty: false
                // });

                // var titles = fields.title.availableValues;

                // var suffix = ko.observable(profile.profile.userdata.suffix).extend({
                //     required: false,
                //     minLength: 2,
                //     maxLength: 100,
                //     dirty: false
                // });


                var organization = ko.observable(profile.profile.userdata.organization).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });
                var organizationalValues = NationalLabs.map(function (lab) {
                    return {
                        value: lab.name,
                        label: lab.name + ' (' + lab.initials + ')'
                    };
                });
                var organizationValues = organizationalValues.concat(Institutions);
                organizationValues.push({
                    value: 'other',
                    label: 'Other'
                });
                var organizationOther = ko.observable(profile.profile.userdata.organizationOther).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });
                // var organizations = Institutions.map(function (item) {
                //     return {
                //         value: item[0],
                //         label: item[1] + ' > ' + item[2] + ', ' + item[3]
                //     };
                // });

                var department = ko.observable(profile.profile.userdata.department).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });

                var jobTitle = ko.observable(profile.profile.userdata.jobTitle).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });

                var researchInterests = ko.observableArray(fields.researchInterests.availableValues.map(function (item) {
                    var checked = false;
                    if (profile.profile.userdata.researchInterests &&
                        profile.profile.userdata.researchInterests instanceof Array &&
                        profile.profile.userdata.researchInterests.indexOf(item.value) >= 0) {
                        checked = true;
                    }
                    return {
                        value: item.value,
                        label: item.label,
                        checked: ko.observable(checked)
                    };
                })).extend({
                    required: true,
                    dirty: false,
                    export: {
                        display: function (target) {
                            return target().filter(function (item) {
                                return item.checked();
                            }).map(function (item) {
                                return item.label;
                            });
                        },
                        data: function (target) {
                            return target().filter(function (item) {
                                return item.checked();
                            }).map(function (item) {
                                return item.value;
                            });
                        }
                    }
                });

                var fundingSource = ko.observable(profile.profile.userdata.fundingSource).extend({
                    required: false,
                    dirty: false
                });
                var fundingSourceValues = fields.fundingSource.availableValues;

                var location = ko.observable(profile.profile.userdata.location).extend({
                    required: true,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });

                var avatarOption = ko.observable(profile.profile.userdata.avatarOption).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });
                var avatarOptionValues = fields.avatarOption.availableValues;

                var gravatarDefault = ko.observable(profile.profile.userdata.gravatarDefault || 'monsterid').extend({
                    required: false,
                    minLength: 2,
                    maxLength: 100,
                    dirty: false
                });
                var gravatarDefaultValues = [{
                    value: 'mm',
                    label: 'Mystery Man - simple, cartoon-style silhouetted outline'
                }, {
                    value: 'identicon',
                    label: 'Identicon - a geometric pattern based on an email hash'
                }, {
                    value: 'monsterid',
                    label: 'MonsterID - generated "monster" with different colors, faces, etc'
                }, {
                    value: 'wavatar',
                    label: 'Wavatar - generated faces with differing features and backgrounds'
                }, {
                    value: 'retro',
                    label: 'Retro - 8-bit arcade-style pixelated faces'
                }, {
                    value: 'blank',
                    label: 'Blank - A Blank Space'
                }];

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
                    var title = ko.observable(affil && affil.title).extend({
                        required: true,
                        minLength: 2,
                        maxLength: 100,
                        dirty: false
                    });
                    var institution = ko.observable(affil && affil.institution).extend({
                        required: true,
                        minLength: 2,
                        maxLength: 100,
                        dirty: false
                    });
                    var start_year = ko.observable(affil && affil.start_year).extend({
                        required: true,
                        year: true,
                        dirty: false
                    });

                    var end_year = ko.observable(affil && affil.end_year).extend({
                        required: false,
                        year: true,
                        dirty: false
                    });

                    var end_year_display = ko.pureComputed(function () {
                        if (end_year()) {
                            return end_year();
                        }
                        return 'present';
                    });
                    return {
                        title: title,
                        institution: institution,
                        start_year: start_year,
                        end_year: end_year,
                        end_year_display: end_year_display
                    };
                }
                var affiliations = ko.observableArray(affils.map(function (affil) {
                    return affiliationVm(affil);
                })).extend({
                    dirty: false
                });

                var personalStatement = ko.observable(profile.profile.userdata.personalStatement).extend({
                    required: false,
                    minLength: 2,
                    maxLength: 400,
                    dirty: false
                });
                var personalStatementDisplay = ko.pureComputed(function () {
                    var text = personalStatement();
                    if (!text) {
                        return '';
                    }
                    return text.replace(/\n/g, '<br>');
                });

                var username = profile.user.username;

                var gravatarHash = profile.profile.synced.gravatarHash;
                var gravatarUrl = ko.pureComputed(function () {
                    switch (avatarOption()) {
                    case 'gravatar':
                        return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=200&amp;r=pg&d=' + gravatarDefault();
                    case 'mysteryman':
                        return Plugin.plugin.fullPath + '/images/nouserpic.png';
                    }

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

                var vmFields = [
                    realname, location, organization, organizationOther,
                    department, avatarOption, gravatarDefault, affiliations,
                    personalStatement, jobTitle, researchInterests, fundingSource
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

                            // if (title.isDirty()) {
                            //     profile.profile.userdata.title = title();
                            //     title.markClean();
                            //     profileChanges = true;
                            // }
                            if (realname.isDirty()) {
                                profile.user.realname = realname();
                                realname.markClean();
                                account.display = realname();
                                accountChanges = true;
                                profileChanges = true;
                            }
                            // if (suffix.isDirty()) {
                            //     profile.profile.userdata.suffix = suffix();
                            //     suffix.markClean();
                            //     accountChanges = true;
                            // }
                            if (location.isDirty()) {
                                profile.profile.userdata.location = location();
                                location.markClean();
                                profileChanges = true;
                            }

                            if (organization.isDirty()) {
                                profile.profile.userdata.organization = organization();
                                organization.markClean();
                                profileChanges = true;
                            }

                            if (organizationOther.isDirty()) {
                                profile.profile.userdata.organizationOther = organizationOther();
                                organizationOther.markClean();
                                organizationOther = true;
                            }

                            if (department.isDirty()) {
                                profile.profile.userdata.department = department();
                                department.markClean();
                                profileChanges = true;
                            }

                            if (fundingSource.isDirty()) {
                                profile.profile.userdata.fundingSource = fundingSource();
                                fundingSource.markClean();
                                profileChanges = true;
                            }

                            if (avatarOption.isDirty()) {
                                profile.profile.userdata.avatarOption = avatarOption();
                                avatarOption.markClean();
                                profileChanges = true;
                            }

                            if (gravatarDefault.isDirty()) {
                                profile.profile.userdata.gravatarDefault = gravatarDefault();
                                gravatarDefault.markClean();
                                profileChanges = true;
                            }

                            if (affiliations.isDirty()) {
                                // just bundle the whole thing up...
                                var newAffiliations = affiliations().map(function (af) {
                                    return {
                                        title: af.title(),
                                        institution: af.institution(),
                                        start_year: af.start_year(),
                                        end_year: af.end_year()
                                    };
                                });
                                profile.profile.userdata.affiliations = newAffiliations;
                                affiliations.markClean();
                                profileChanges = true;
                            }

                            if (personalStatement.isDirty()) {
                                profile.profile.userdata.personalStatement = personalStatement();
                                personalStatement.markClean();
                                profileChanges = true;
                            }

                            if (jobTitle.isDirty()) {
                                profile.profile.userdata.jobTitle = jobTitle();
                                jobTitle.markClean();
                                profileChanges = true;
                            }

                            if (researchInterests.isDirty()) {
                                profile.profile.userdata.researchInterests = researchInterests()
                                    .map(function (item) {
                                        if (item.checked()) {
                                            return item.value;
                                        }
                                    })
                                    .filter(function (item) {
                                        return (typeof item !== 'undefined');
                                    });
                                researchInterests.markClean();
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
                    affiliations.remove(item);
                }

                function addAffiliation() {
                    affiliations.push(affiliationVm());
                }

                return {
                    // fields being edited or displayed
                    //title: title,
                    //titles: titles,
                    realname: realname,
                    //suffix: suffix,
                    organization: organization,
                    organizationValues: organizationValues,
                    organizationOther: organizationOther,
                    department: department,
                    location: location,
                    avatarOption: avatarOption,
                    avatarOptionValues: avatarOptionValues,
                    gravatarDefault: gravatarDefault,
                    gravatarDefaultValues: gravatarDefaultValues,
                    affiliations: affiliations,
                    personalStatement: personalStatement,
                    personalStatementDisplay: personalStatementDisplay,
                    jobTitle: jobTitle,
                    researchInterests: researchInterests,
                    fundingSource: fundingSource,
                    fundingSourceValues: fundingSourceValues,

                    username: username,

                    // computed
                    gravatarUrl: gravatarUrl,

                    showMore: showMore,
                    more: more,
                    doSaveProfile: doSaveProfile,
                    message: message,
                    messageType: messageType,

                    deleteAffiliation: deleteAffiliation,
                    addAffiliation: addAffiliation,

                    someDirty: someDirty,
                    someInvalid: someInvalid,
                    formCanSave: formCanSave
                };
            },
            template: buildTemplate()
        };
    }
    ko.components.register('profile-editor', component());
});