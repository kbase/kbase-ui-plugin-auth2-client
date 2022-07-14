define([
    'preact',
    'htm',
    './ErrorAlert',

    'bootstrap',
    'css!./TypeaheadInput.css',
], (
    preact,
    htm,
    ErrorAlert
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    const MAX_RESULT_SIZE = 100;
    const MIN_QUERY_LENGTH = 2;

    class TypeaheadInput extends Component {
        constructor(props) {
            super(props);
            this.state = {
                status: 'INITIAL',
                inputValue: '',
                userOpenedSearch: false
            };
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

        async onInput(e) {
            const value = e.target.value;
            // this.props.onUpdate(value);
            const resultState = await this.searchDataSource(value);
            this.setState({
                ...resultState,
                inputValue: value,
                userHasModified: true,
                userOpenedSearch: true
            });
        }

        onKeyDown(event) {
            if (event.key === 'Tab') {
                this.tabbing = true;
            } else {
                this.tabbing = false;
            }
        }

        onKeyUp() {
            // this.setState({
            //     ...this.state,
            //     userOpenedSearch: true
            // });
            // if (!this.state.userOpenedSearch) {
            //     return;
            // }

            // console.log('key keyup', e);
        }

        doToggleSearch() {
            console.log('TOGGLE SEARCH');
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

        doCancelSearch() {
            console.log('DO CANCEL SEARCH');
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
                    onClick=${this.doCancelSearch.bind(this)} />
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
            console.log('selecting...', value);
            this.props.onSelect(value);
        }

        renderDropdownItems() {
            if (this.state.value.tooManyResults) {
                return html`
                    <div className="text-warning" style=${{fontStyle: 'italic'}}>
                        Too many matches (
                        <span>${this.state.value.searchCount}</span>
                        ) to display -- please enter more in order to narrow your results.
                    </div>
                `;
            } else if (this.state.value.searchedValues.length > 0 && this.state.inputValue.length > 0 && this.state.inputValue.length < 2) {
                return html`
                    <div className="text-info" style=${{fontStyle: 'italic'}}>
                        Please enter two or more letters above to search for your research or educational organization.
                    </div>
                `;
            } else if (this.state.value.searchedValues.length === 0 && this.state.userHasModified) {
                return html`
                    <div className="text-info" style=${{fontStyle: 'italic'}}>
                        Nothing matched your search.<br />
                        You may leave it as is to use this value in your profile,
                        or try different text to match your organization.
                    </div>
                `;
            }

            // onMouseOver=${this.doActivate.bind(this)}
            // onMouseOut=${this.doDeactivate.bind(this)}
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
            return html`
                <div style=${{
        position: 'relative',
        width: '100%'
    }}>
                    <div style=${{
        position: 'relative',
        borderTop: '1px silver solid',
        borderLeft: '1px silver solid',
        borderRight: '1px silver solid',
        backgroundColor: '#EEE',
        zIndex: '100',
        padding: '4px',
        width: '100%'
    }}>
                        Found
                        <span style=${{padding: '0 0.25em'}}>${this.state.value.searchCount}</span>
                        out of
                        <span style=${{padding: '0 0.25em'}}>${Intl.NumberFormat('en-US', {useGrouping: true}).format(this.state.value.totalCount)}</span>
                    </div>
                    <div style=${{
        border: '1px silver solid',
        backgroundColor: 'white',
        zIndex: '100',
        position: 'absolute',
        width: '100%',
        maxHeight: '10em',
        overflow: 'auto'
    }}>
                        ${this.renderDropdownItems()}
                    </div>
                </div>
            `;
        }

        // renderSuccess({}) {
        //     return html`
        //         <div>
        //             <div className="input-group">
        //                 <input
        //                     className="form-control"
        //                     value=${this.props.value}
        //                     placeholder=${this.props.placeholder}
        //                     onInput=${this.onInput.bind(this)}
        //                     onKeyUp=${this.onKeyUp.bind(this)}
        //                 />
        //                 ${this.renderSearchButton()}
        //                 ${this.renderCancelSearchButton()}
        //             </div>
        //             ${this.renderDropdown()}
        //         </div>
        //     `;
        // }


        // renderState() {
        //     switch (this.state.status) {
        //     case 'INITIAL':
        //     case 'PENDING':
        //         return this.renderLoading();
        //     case 'ERROR':
        //         return this.renderError(this.state.error);
        //     case 'SUCCESS':
        //         return this.renderSuccess(this.state.value);
        //     }
        // }

        render() {
            return html`
                <div className="TypeaheadInput">
                    <div className="input-group">
                        <input 
                            className="form-control"
                            value=${this.state.inputValue}
                            placeholder=${this.props.placeholder}
                            onInput=${this.onInput.bind(this)}
                            onKeyPress=${this.onKeyPress.bind(this)}
                            onKeyDown=${this.onKeyDown.bind(this)}
                            onBlur=${this.onBlur.bind(this)}
                        />
                        ${this.renderSearchButton()}
                        ${this.renderCancelSearchButton()}
                    </div>
                    ${this.renderDropdown()}
                </div>
            `;
        }
    }

    return TypeaheadInput;
});
