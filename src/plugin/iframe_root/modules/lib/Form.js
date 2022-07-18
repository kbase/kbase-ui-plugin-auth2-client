define([], () => {

    class Form {
        constructor({fields, initialValues, onUpdate}) {

            this.fields = fields;
            this.fieldDefinitions = fields.reduce((fieldDefinitions, fieldDefinition) => {
                fieldDefinitions[fieldDefinition.name] = fieldDefinition;
                return fieldDefinitions;
            }, {});

            this.formState = {};

            this.fieldStates = fields.reduce((fieldStates, {name}) => {
                const value = initialValues[name];
                fieldStates[name] = {
                    status: 'INITIAL',
                    initialValue: value,
                    value
                };
                return fieldStates;
            }, {});

            this.onUpdate = onUpdate;
        }

        async initialize() {
            const fieldStates = {};
            for (const {name} of this.fields) {
                const {value} = this.getFieldState(name);
                const state = await this.evaluateField(name, value);
                fieldStates[name] = state;
            }

            this.fieldStates = fieldStates;
            this.onUpdate({
                form: {
                    fields: fieldStates
                }
            });
        }

        getFieldState(fieldName) {
            return this.fieldStates[fieldName];
        }

        getFieldDefinition(fieldName) {
            return this.fieldDefinitions[fieldName];
        }

        validateField(value, fieldDefinition) {
            if (fieldDefinition.minLength) {
                if (value.length < fieldDefinition.minLength) {
                    return {
                        isValid: false,
                        message: `"${fieldDefinition.label}" must have ${fieldDefinition.minLength} or more characters.`
                    };
                }
            }

            if (fieldDefinition.maxLength) {
                if (value.length > fieldDefinition.maxLength) {
                    return {
                        isValid: false,
                        message: `"${fieldDefinition.label}" must have fewer than ${fieldDefinition.maxLength} characters.`
                    };
                }
            }

            return {
                isValid: true
            };
        }

        async evaluateField(fieldName, value) {
            // Apply rules.
            // Realname is required, has no character limit afaik, but let us impose
            // a default of 100 characters.

            const fieldState = this.getFieldState(fieldName);
            const fieldDefinition = this.getFieldDefinition(fieldName);

            if (typeof value === 'undefined') {
                value = fieldState.value;
            }

            const parsedValue = (() => {
                if (typeof value === 'string') {
                    return value.trim();
                }
                return value;
            })();


            if (fieldDefinition.isRequired) {
                if (value.length === 0) {
                    return {
                        ...fieldState,
                        value,
                        isModified: fieldState.initialValue !== value,
                        status: 'REQUIRED_MISSING',
                        message: `"${fieldDefinition.label}" is required`
                    };
                }
            }

            const {isValid, message} = this.validateField(parsedValue, fieldDefinition);
            if (!isValid) {
                return {
                    ...fieldState,
                    value,
                    isModified: fieldState.initialValue !== value,
                    status: 'INVALID',
                    message
                };
            }

            if ('rules' in fieldDefinition) {
                for (const rule of fieldDefinition.rules) {
                    const {isValid, message} = await rule.validate(value);
                    if (!isValid) {
                        return {
                            ...fieldState,
                            value,
                            isModified: fieldState.initialValue !== value,
                            status: 'INVALID',
                            message
                        };
                    }
                }
            }


            return {
                ...fieldState,
                value,
                isModified: fieldState.initialValue !== value,
                status: 'VALID'
            };
        }

        setFieldState(fieldName, fieldState) {
            this.fieldStates[fieldName] = fieldState;
            this.onUpdate({
                form: {
                    fields: this.fieldStates
                }
            });
        }

        async updateField(fieldName, value) {
            const fieldState = await this.evaluateField(fieldName, value);
            this.setFieldState(fieldName, fieldState);
        }

        initialValues() {
            return Object.entries(this.fieldStates).reduce((initialValues, [name, {value, status, message}]) => {
                initialValues[name] = {
                    value, status, message
                };
                return initialValues;
            }, {});
        }

        getAllFields() {
            return Object.entries(this.fieldStates).reduce((allFields, [name, {value, status, message}]) => {
                allFields[name] = {
                    value, status, message
                };
                return allFields;
            }, {});
        }


    }

    return Form;
});
