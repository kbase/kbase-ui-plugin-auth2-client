define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/format',
    'kb_service/userProfile',
    'kb_service/client/userProfile',

    '../components/typeaheadInput'
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
                            textInput: field.name,
                            // valueUpdate: wrapString('afterkeydown')
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.name
                        }
                    })
                ])

            ])
        ]);
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
                            textInput: field.name
                                // valueUpdate: wrapString('afterkeydown')
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.name
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
                                    inputValue: field.name,
                                    dataSource: field.name + '_dataSource'
                                        // availableValues: field.name + 'Values'
                                }
                            }
                        }
                    }),
                    div({
                        class: 'alert alert-danger',
                        dataBind: {
                            validationMessage: field.name
                        }
                    })
                ])
            ])
        ]);
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
            value: field.name,
            options: field.name + 'Values',
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
                            validationMessage: field.name
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
                            foreach: field.name
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
                            validationMessage: field.name
                        }
                    })
                ])
            ])
        ]);
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
                        dataBind: 'text: ' + (field.name)
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
        buildTextarea: buildTextarea,
        buildTypeahead: buildTypeahead,
        buildSelect: buildSelect,
        buildCheckboxes: buildCheckboxes,
        buildDislay: buildDisplay,
        buildContent: buildContent,
    };
});