define([
    'kb_lib/html',
    'kb_knockout/lib/generators',
    '../components/selectInput',
    '../components/checkboxesInput',
    '../components/typeaheadInput',
    '../components/fieldDoc'
], function (
    html,
    gen,
    SelectInputComponent,
    CheckboxesInputComponent,
    TypeaheadInputComponent,
    FieldDocComponent
) {
    'use strict';

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
                css: '{"glyphicon-asterisk text-danger": ' + field.vmId + '.isValid() === false, "glyphicon-ok text-success":' + field.vmId + '.isValid()}',
                style: {
                    opacity: 'field.constraint.isValid() ? "0.5" : "1.0"'
                }
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
                css: '{"glyphicon-asterisk text-danger": field.isValid() === false, "glyphicon-ok text-success": field.isValid()}',
                style: {
                    opacity: 'field.constraint.isValid() ? "0.5" : "1.0"'
                }
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
                css: '{"glyphicon-asterisk text-danger": field.constraint.isValid() === false, "glyphicon-ok text-success": field.constraint.isValid()}',
                style: {
                    opacity: 'field.constraint.isValid() ? "0.5" : "1.0"'
                }
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

    function buildInlineLabel() {
        return span({
        }, [
            buildRequiredIcon3(),
            buildDirtyIcon2()
        ]);
    }

    function buildFieldGroup(id, control) {
        return div({
            class: 'form-group'
        }, [
            buildLabel(id),
            gen.if('doc',
                div({
                    dataBind: {
                        component: {
                            name: FieldDocComponent.quotedName(),
                            params: {
                                description: 'doc.description',
                                more: 'doc.more'
                            }
                        }
                    }
                })),
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
                gen.if('$data.doc',
                    div({
                        dataBind: {
                            component: {
                                name: FieldDocComponent.quotedName(),
                                params: {
                                    description: '$data.doc.description',
                                    more: '$data.doc.more'
                                }
                            }
                        }
                    })),
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

    function buildInput(vmPath) {
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
        buildContent: buildContent,
        requiredIcon: requiredIcon,
        dirtyIcon: dirtyIcon,
        buildLabelRow: buildLabelRow,
        buildFieldRow: buildFieldRow,
        buildInlineLabel
    };
});