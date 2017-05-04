define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    'kb_service/userProfile',
    'kb_service/client/userProfile',

    '../components/typeaheadInput',
    '../components/checkboxesInput',
    '../components/selectInput'
], function (
    ko,
    html,
    BS,
    Format,
    UserProfile,
    UserProfileService
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        input = t('input'),
        textarea = t('textarea'),
        select = t('select');

    function requiredIcon(field) {
        if (!field.required) {
            return;
        }
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-asterisk text-danger": ' + field.vmId + '.isValid() === false, "glyphicon-ok text-success":' + field.vmId + '.isValid()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    /*
        In the context of the field:
        required - boolean
        isValid() - must have validation enabled for the field
    */
    function buildRequiredIcon2() {
        var result = span({
            dataBind: {
                if: '$data.required'
            }
        }, span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-asterisk text-danger": field.isValid() === false, "glyphicon-ok text-success": field.isValid()}'
            },
            style: {
                marginLeft: '4px'
            }
        }));
        return result;
    }

    function dirtyIcon(field) {
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-flash text-muted": ' + field.vmId + '.isDirty() !== true, "glyphicon-flash text-warning":' + field.vmId + '.isDirty()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    function buildDirtyIcon2() {
        var result = span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-flash text-muted": field.isDirty() !== true, "glyphicon-flash text-warning": field.isDirty()}'
            },
            style: {
                marginLeft: '4px'
            }
        });
        return result;
    }

    function fieldDoc(description, content, name) {
        if (!description) {
            return;
        }
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
                dataBind: {
                    css: {
                        hidden: 'more.' + name + '()'
                    }
                },
                dataElement: 'content',
                style: {
                    border: '1px silver dashed',
                    padding: '6px'
                }
            }, content)
        ]);
    }

    // description, content, name
    // context is the vm field.
    function buildDoc2() {
        return div({
            dataBind: {
                if: 'doc'
            }
        }, div({
            class: 'field-doc',
            dataBind: {
                with: 'doc'
            }
        }, [
            div([
                span({
                    style: {
                        padding: '2px',
                        cursor: 'pointer'
                    },
                    // TODO: toggle more observable
                    dataBind: {
                        click: 'toggleShowMore.bind($data)'
                    }
                }, span({

                }, [
                    span({
                        dataBind: {
                            html: 'description'
                        }
                    }),
                    span({
                        class: 'fa ',
                        style: {
                            marginLeft: '5px',
                        },
                        dataBind: {
                            css: {
                                '"fa-caret-right"': '!showMore()',
                                '"fa-caret-down"': 'showMore()'
                            }
                        }
                    })
                ]))
            ]),
            div({
                dataBind: {
                    css: {
                        hidden: '!showMore()',
                    },
                    html: 'more'
                },
                style: {
                    border: '1px silver dashed',
                    padding: '6px'
                }
            })
        ]));
    }

    function buildInput(field) {
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
                        div({}, fieldDoc(field.description, field.more, field.name))
                    ]

                )
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    input({
                        type: 'text',
                        class: 'form-control',
                        id: id,
                        placeholder: field.placeholder,
                        dataBind: {
                            textInput: field.vmId,
                            // valueUpdate: wrapString('afterkeydown')
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId
                        }
                    })
                ])

            ])
        ]);
    }

    function buildLabelRow(id) {
        return div({
            class: 'row'
        }, [
            div({
                class: 'col-md-12'
            }, [
                label({
                    for: id
                }, [
                    span({
                        dataBind: {
                            html: 'label'
                        }
                    }),
                    buildRequiredIcon2(),
                    buildDirtyIcon2()
                ]),
                buildDoc2()
            ])
        ]);
    }

    function buildFieldRow(control) {
        return div({
            class: 'row'
        }, [
            div({
                class: 'col-md-12'
            }, [
                control,
                div({
                    class: 'alert alert-danger',
                    dataBind: {
                        validationMessage: 'field'
                    }
                })
            ])
        ]);
    }

    function buildInput2(vmPath, options) {
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row',
            dataBind: {
                if: 'ready'
            }
        };
        return div({
            dataBind: {
                with: vmPath
            }
        }, div(attribs, [
            buildLabelRow(id),
            buildFieldRow(input({
                type: 'text',
                class: 'form-control',
                id: id,
                // placeholder: 'placeholder',
                dataBind: {
                    textInput: 'field'
                }
            }))
        ]));
    }

    function buildTextarea2(vmPath, options) {
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row',
            dataBind: {
                if: 'ready'
            }
        };
        return div({
            dataBind: {
                with: vmPath
            }
        }, div(attribs, [
            buildLabelRow(id),
            buildFieldRow(textarea({
                class: 'form-control',
                style: options.style,
                id: id,
                //placeholder: 'placeholder',
                dataBind: {
                    textInput: 'field'
                }
            }))
        ]));
    }

    function buildTextarea(field) {
        var id = html.genId();
        var style = field.style || {};
        return div({
            class: 'form-group  form-row'
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
                        div({}, fieldDoc(field.description, field.more, field.name))
                    ]

                )
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    textarea({
                        class: 'form-control',
                        style: style,
                        id: id,
                        placeholder: field.placeholder,
                        dataBind: {
                            textInput: field.vmId
                                // valueUpdate: wrapString('afterkeydown')
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId
                        }
                    })
                ])
            ])
        ]);
    }

    function buildTypeahead(field, options) {
        var id = html.genId();
        return div({
            class: 'form-group  form-row'
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
                    div({}, fieldDoc(field.description, field.more, field.name))
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    div({
                        dataBind: {
                            component: {
                                name: '"typeahead-input"',
                                params: {
                                    inputValue: field.vmId,
                                    dataSource: field.vmId + '_dataSource'
                                        // availableValues: field.name + 'Values'
                                }
                            }
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId
                        }
                    })
                ])
            ])
        ]);
    }

    function buildTypeahead2(vmPath, options) {

        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row',
            dataBind: {
                if: 'ready'
            }
        };
        var control = div({
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
        });
        return div({
            dataBind: {
                with: vmPath
            }
        }, div(attribs, [
            buildLabelRow(id),
            buildFieldRow(control)
        ]));
        // var id = html.genId();
        // return div({
        //     class: 'form-group  form-row'
        // }, [
        //     div({
        //         class: 'row'
        //     }, [
        //         div({
        //             class: 'col-md-12'
        //         }, [
        //             label({
        //                 for: id
        //             }, [field.label, requiredIcon(field), dirtyIcon(field)]),
        //             div({}, fieldDoc(field.description, field.more, field.name))
        //         ])
        //     ]),
        //     div({
        //         class: 'row'
        //     }, [
        //         div({
        //             class: 'col-md-12'
        //         }, [
        //             div({
        //                 dataBind: {
        //                     component: {
        //                         name: '"typeahead-input"',
        //                         params: {
        //                             inputValue: field.vmId,
        //                             dataSource: field.vmId + '_dataSource'
        //                                 // availableValues: field.name + 'Values'
        //                         }
        //                     }
        //                 }
        //             }),
        //             div({
        //                 class: 'alert alert-danger',
        //                 dataBind: {
        //                     validationMessage: field.vmId
        //                 }
        //             })
        //         ])
        //     ])
        // ]);
    }

    function buildSelect(field, options) {
        options = options || {};
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row'
        };
        if (options.condition) {
            attribs.dataBind = {
                if: options.condition
            };
        }
        var controlBinding = {
            value: field.vmId,
            options: field.vmId + 'Values',
            optionsText: '"label"',
            optionsValue: '"value"'
        };
        if (options.optionsCaption) {
            controlBinding.optionsCaption = '"' + options.optionsCaption.replace(/"/g, '\\"') + '"';
            // controlBinding.optionsCaption = '"enter a value"';
        }
        return div(attribs, [
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
                }, [
                    select({
                        class: 'form-control',
                        id: id,
                        dataBind: controlBinding
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId
                        }
                    })
                ])
            ])
        ]);
    }

    function buildSelect2(vmPath, options) {
        options = options || {};
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row',
            // dataBind: {
            //     if: 'ready'
            // }
        };

        return div({
            dataBind: {
                with: vmPath
            }
        }, div(attribs, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    label({
                        for: id
                    }, [
                        span({
                            dataBind: {
                                text: 'label'
                            }
                        }),
                        buildRequiredIcon2(),
                        buildDirtyIcon2()
                    ]),
                    buildDoc2()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, div({
                        dataBind: {
                            component: {
                                name: '"select-input"',
                                params: {
                                    field: 'field',
                                    dataSource: 'dataSource',
                                    emptyLabel: 'emptyLabel'
                                }
                            }
                        }
                    },
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: 'field'
                        }
                    })
                ))
            ])
        ]));
    }

    function buildSelect2x(vmPath, options) {
        options = options || {};
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row'
        };
        if (options.condition) {
            attribs.dataBind = {
                if: options.condition
            };
        }
        var controlBinding = {
            value: vmPath + '.value',
            options: vmPath + '.values',
            optionsText: '"label"',
            optionsValue: '"value"'
        };
        if (options.optionsCaption) {
            controlBinding.optionsCaption = '"' + options.optionsCaption.replace(/"/g, '\\"') + '"';
            // controlBinding.optionsCaption = '"enter a value"';
        }
        return div(attribs, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    label({
                        for: id
                    }, [
                        span({
                            dataBind: {
                                text: vmPath + '.label'
                            }
                        }),

                        // requiredIcon(field),
                        // dirtyIcon(field)
                    ]),
                    fieldDoc2(vmPath)
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    select({
                        class: 'form-control',
                        id: id,
                        dataBind: controlBinding
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: vmPath
                        }
                    })
                ])
            ])
        ]);
    }

    function buildCheckboxes(field, condition) {
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row'
        };
        if (condition) {
            attribs.dataBind = {
                if: condition
            };
        }
        return div(attribs, [
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
                }, [
                    div({
                        dataBind: {
                            foreach: field.vmId
                        }
                    }, div({
                            class: 'checkbox'
                        },
                        label({
                            style: {
                                marginLeft: '1em'
                            }
                        }, [
                            input({
                                type: 'checkbox',
                                dataBind: {
                                    checked: 'checked',
                                    value: 'value'
                                }
                            }),
                            span({
                                dataBind: {
                                    text: 'label'
                                }
                            })
                        ])
                    )),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.vmId
                        }
                    })
                ])
            ])
        ]);
    }

    function buildCheckboxes2(vmPath, options) {
        options = options || {};
        var id = html.genId();
        var attribs = {
            class: 'form-group  form-row',
            dataBind: {
                if: 'ready'
            }
        };
        var control = div({
            dataBind: {
                component: {
                    name: '"checkboxes-input"',
                    params: {
                        value: 'field',
                        dataSource: 'dataSource'
                    }
                }
            }
        });

        return div({
            dataBind: {
                with: vmPath
            }
        }, div(attribs, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    label({
                        for: id
                    }, [
                        span({
                            dataBind: {
                                text: 'label'
                            }
                        }),
                        buildRequiredIcon2(),
                        buildDirtyIcon2()
                    ]),
                    buildDoc2()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    control,
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: 'field'
                        }
                    })
                ])
            ])
        ]));
    }

    function buildDisplay(field) {
        var id = html.genId();
        return div({
            class: 'form-group  form-row'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    label({
                        for: id
                    }, field.label),
                    fieldDoc(field.description, field.more, field.name)
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    div({
                        dataBind: 'text: ' + (field.vmId)
                    })
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

    return {
        buildInput: buildInput,
        buildInput2: buildInput2,
        buildTextarea: buildTextarea,
        buildTextarea2: buildTextarea2,
        buildTypeahead: buildTypeahead,
        buildTypeahead2: buildTypeahead2,
        buildSelect: buildSelect,
        buildSelect2: buildSelect2,
        buildCheckboxes: buildCheckboxes,
        buildCheckboxes2: buildCheckboxes2,
        buildDislay: buildDisplay,
        buildContent: buildContent,
        requiredIcon: requiredIcon,
        dirtyIcon: dirtyIcon,
        fieldDoc: fieldDoc,
        buildDoc2: buildDoc2,
        buildLabelRow: buildLabelRow,
        buildFieldRow: buildFieldRow
    };
});