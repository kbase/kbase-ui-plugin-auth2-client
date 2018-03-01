define([
    'knockout-plus',
    'kb_common/html',
    '../components/selectInput',
    '../components/checkboxesInput',
    '../components/typeaheadInput'
], function (
    ko,
    html,
    SelectInputComponent,
    CheckboxesInputComponent,
    TypeaheadInputComponent
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        input = t('input'),
        textarea = t('textarea');

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

    function buildRequiredIcon3() {
        var result = span({
            dataBind: {
                if: '$data.field.constraint.isRequired()'
            }
        }, span({
            class: 'glyphicon',
            dataBind: {
                css: '{"glyphicon-asterisk text-danger": field.constraint.isValid() === false, "glyphicon-ok text-success": field.constraint.isValid()}'
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
            class: 'field-doc',
            dataBind: {
                if: 'more'
            }
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

    function buildDocWithMore() {
        return div([
            div({}, [
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
                    borderLeft: '2px silver solid',
                    marginLeft: '4px',
                    padding: '4px'
                }
            })
        ]);
    }

    function buildDocNoMore() {
        return div({
            dataBind: {
                html: 'description'
            }
        });
    }

    function buildDoc() {
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
            div({
                dataBind: {
                    if: 'more'
                }
            }, buildDocWithMore()),
            div({
                dataBind: {
                    ifnot: 'more'
                }
            }, buildDocNoMore())
        ]));
    }

    function buildLabel(id) {
        return label({
            for: id
        }, [
            span({
                dataBind: {
                    html: 'label'
                }
            }),
            buildRequiredIcon3(),
            buildDirtyIcon2()
        ]);
    }

    function buildFieldGroup(id, control) {
        return div({
            class: 'form-group'
        }, [
            buildLabel(id),
            buildDoc(),
            control,
            div({
                dataBind: {
                    if: 'field.constraint.state() === "invalid"'
                }
            }, div({
                class: 'alert alert-danger',
                dataBind: {
                    // validationMessage: 'field'
                    html: 'field.constraint.message'
                }
            }))
        ]);
    }

    function buildLabelRow(id) {
        return div({
            class: 'row row-edgeless'
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
                buildDoc()
            ])
        ]);
    }

    function buildFieldRow(control) {
        return div({
            class: 'row row-edgeless'
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

    function buildInput(vmPath, options) {
        var id = html.genId();
        var control = input({
            type: 'text',
            class: 'form-control',
            id: id,
            // placeholder: 'placeholder',
            dataBind: {
                textInput: 'field'
            }
        });
        return div({
            class: 'form-row',
            dataBind: {
                with: vmPath
            }
        }, div({
            dataBind: {
                if: 'ready'
            }
        }, buildFieldGroup(id, control)));
    }

    function buildTextarea(vmPath, options) {
        var id = html.genId();
        var control = textarea({
            class: 'form-control',
            style: options.style,
            id: id,
            dataBind: {
                textInput: 'field'
            }
        });
        return div({
            class: 'form-row',
            dataBind: {
                with: vmPath
            }
        }, div({
            dataBind: {
                if: 'ready'
            }
        }, buildFieldGroup(id, control)));
    }

    function buildTypeahead(vmPath) {
        var id = html.genId();
        var control = div({
            dataBind: {
                component: {
                    name: TypeaheadInputComponent.quotedName(),
                    params: {
                        inputValue: 'field',
                        dataSource: 'dataSource'
                    }
                }
            }
        });
        return div({
            class: 'form-row',
            dataBind: {
                with: vmPath
            }
        }, div({
            dataBind: {
                if: 'ready'
            }
        }, buildFieldGroup(id, control)));
    }

    function buildSelect(vmPath) {
        var id = html.genId();
        var control = div({
            dataBind: {
                component: {
                    name: SelectInputComponent.quotedName(),
                    params: {
                        field: 'field',
                        dataSource: 'dataSource',
                        emptyLabel: 'emptyLabel'
                    }
                }
            }
        });
        return div({
            class: 'form-row',
            dataBind: {
                with: vmPath
            }
        }, div({
            // dataBind: {
            //     if: 'ready'
            // }
        }, buildFieldGroup(id, control)));
    }

    function buildCheckboxes(vmPath) {
        var id = html.genId();
        var control = div({
            dataBind: {
                component: {
                    name: CheckboxesInputComponent.quotedName(),
                    params: {
                        value: 'field',
                        dataSource: 'dataSource'
                    }
                }
            }
        });
        return div({
            class: 'form-row',
            dataBind: {
                with: vmPath
            }
        }, div({
            dataBind: {
                if: 'ready'
            }
        }, buildFieldGroup(id, control)));
    }

    function buildDisplay(field) {
        var id = html.genId();
        return div({
            class: 'form-group  form-row'
        }, [
            div({
                class: 'row row-edgeless'
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
                class: 'row row-edgeless'
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
                class: 'row row-edgeless'
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
        requiredIcon: requiredIcon,
        dirtyIcon: dirtyIcon,
        fieldDoc: fieldDoc,
        buildDoc: buildDoc,
        buildLabelRow: buildLabelRow,
        buildFieldRow: buildFieldRow
    };
});