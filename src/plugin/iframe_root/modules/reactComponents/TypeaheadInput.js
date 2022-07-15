define([
    'preact',
    'htm',
    './ErrorAlert',

    'bootstrap',
    'css!./TypeaheadInput.css',
], (
    {Component, h, createRef},
    htm,
    ErrorAlert
) => {
    const html = htm.bind(h);

    const MAX_RESULT_SIZE = 100;
    const MIN_QUERY_LENGTH = 2;

    class TypeaheadInput extends Component {
        constructor(props) {
            super(props);
            this.bodyListener = null;
            // we need a handle in order to focus
            // on the input at times.
            this.inputRef = createRef();
            this.state = {
                status: 'INITIAL',
                inputValue: '',
                userOpenedSearch: false
            };
        }

        componentDidMount() {
            this.bodyListener = () => {
                this.setState({
                    userOpenedSearch: false
                });
            };
            document.addEventListener('click', this.bodyListener);
        }

        componentWillUnmount() {
            document.removeEventListener('click', this.bodyListener);
        }

        renderLoading() {
            return html`
                <span className="fa fa-spinner fa-pulse fa-3x'" />
            `;
        }

        renderError({message}) {
            return html`
                <${ErrorAlert} message=${message} />
            `;
        }

        async searchDataSource(value) {
            const dataSource = this.props.dataSource;
            const totalCount = await dataSource.totalCount();

            const result = await dataSource.search(value);

            const searchCount= result.length;

            if (result.length > MAX_RESULT_SIZE) {
                return {
                    status: 'SUCCESS',
                    value: {
                        totalCount,
                        searchCount,
                        tooManyResults: true
                    }
                };
            } else if (result.length === 0) {
                return {
                    status: 'SUCCESS',
                    value: {
                        totalCount,
                        searchCount,
                        searchedValues: result
                    }
                };
            }

            return {
                status: 'SUCCESS',
                value: {
                    totalCount,
                    searchCount,
                    searchedValues: result
                }
            };
        }

        async inputUpdated(value) {
            const resultState = await this.searchDataSource(value);
            this.setState({
                ...resultState,
                inputValue: value,
                userHasModified: true,
                userOpenedSearch: true
            });
        }

        async onInput(e) {
            const value = e.target.value;
            this.inputUpdated(value);
        }

        onKeyDown(event) {
            if (event.key === 'Tab') {
                this.tabbing = true;
            } else {
                this.tabbing = false;
            }
        }

        async doToggleSearch(e) {
            e.stopPropagation();
            this.inputRef.current.focus();
            if (this.state.status !== 'SUCCESS') {
                const dataSource = this.props.dataSource;
                const totalCount = await dataSource.totalCount();
                this.setState({
                    status: 'SUCCESS',
                    value: {
                        totalCount,
                        searchCount: 0,
                        searchedValues: []
                    },
                    userHasModified: true,
                    userOpenedSearch: true
                });
                return;
            }
            this.setState({
                userOpenedSearch: !this.state.userOpenedSearch
            });
        }

        renderSearchButton() {
            const iconClass = (() => {
                if (this.state.status === 'PENDING') {
                    return 'fa-spinner fa-pulse fa-fw';
                }
                return 'fa-search';
            })();
            return html`
                <span className=${`input-group-addon fa ${iconClass}`} 
                    onClick=${this.doToggleSearch.bind(this)}/>
            `;
        }

        doClearSearch(e) {
            e.stopPropagation();
            this.inputRef.current.focus();
            this.inputUpdated('');
        }

        closeDropdown() {
            this.setState({
                ...this.state,
                userOpenedSearch: false
            });
            this.props.onSelect(this.state.inputValue);
        }

        onKeyPress(e) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                this.closeDropdown();
            }
        }

        onBlur() {
            if (this.tabbing) {
                this.closeDropdown();
            }
        }

        renderCancelSearchButton() {
            if (!this.state.userOpenedSearch) {
                return;
            }
            return html`
                <span className="input-group-addon fa fa-times"
                    style=${{cursor: 'pointer'}}
                    onClick=${this.doClearSearch.bind(this)} />
            `;
        }

        doSelectValue(value) {
            this.setState({
                ...this.state,
                value: {
                    value
                },
                inputValue: value,
                userOpenedSearch: false
            });
            this.props.onSelect(value);
        }

        renderDropdownItems() {
            if (this.state.value.tooManyResults) {
                return html`
                    <div className="text-warning -message" >
                        Too many matches (
                        <span>${this.state.value.searchCount}</span>
                        ) to display -- please enter more in order to narrow your results.
                    </div>
                `;
            } else if (this.state.value.searchedValues.length > 0 && this.state.inputValue.length > 0 && this.state.inputValue.length < 2) {
                return html`
                    <div className="text-info -message">
                        Please enter two or more letters above to search for your research or educational organization.
                    </div>
                `;
            } else if (this.state.value.searchedValues.length === 0 && this.state.userHasModified) {
                if (this.state.inputValue.length === 0) {
                    return html`
                        <div className="text-info -message">
                            Please enter two or more letters above to search for your research or educational organization.
                        </div>
                    `;
                }
                return html`
                    <div className="text-info -message">
                        Nothing matched your search.<br />
                        You may leave it as is to use this value in your profile,
                        or try different text to match your organization.
                    </div>
                `;
            }

            return this.state.value.searchedValues.map(({label}) => {
                return html`
                <div className="-row" 
                style=${{
        padding: '4px',
        cursor: 'pointer'

    }}
                onClick=${() => {this.doSelectValue(label);}}
                > 
                            ${label}
                        </div>
                `;
            });
        }

        renderDropdown() {
            if (!this.state.userOpenedSearch) {
                return;
            }
            const foundMessage = (() => {
                if (!this.state.inputValue) {
                    return;
                }
                return html`
                    <div>
                        Found
                        <span style=${{padding: '0 0.25em'}}>${this.state.value.searchCount}</span>
                        out of
                        <span style=${{padding: '0 0.25em'}}>${Intl.NumberFormat('en-US', {useGrouping: true}).format(this.state.value.totalCount)}</span>
                    </div>
                `;
            })();
            return html`
                <div className="-dropdown-wrapper">
                    <div className="-dropdown">
                       ${foundMessage}
                    </div>
                    <div className="-dropdown-items">
                        ${this.renderDropdownItems()}
                    </div>
                </div>
            `;
        }

        render() {
            return html`
                <div className="TypeaheadInput">
                    <div className="input-group">
                        <input 
                            ref=${this.inputRef}
                            className="form-control"
                            value=${this.state.inputValue}
                            placeholder=${this.props.placeholder}
                            onInput=${this.onInput.bind(this)}
                            onKeyPress=${this.onKeyPress.bind(this)}
                            onKeyDown=${this.onKeyDown.bind(this)}
                            onBlur=${this.onBlur.bind(this)}
                        />

                        ${this.renderCancelSearchButton()}
                        ${this.renderSearchButton()}
                    </div>
                    ${this.renderDropdown()}
                </div>
            `;
        }
    }

    return TypeaheadInput;
});
