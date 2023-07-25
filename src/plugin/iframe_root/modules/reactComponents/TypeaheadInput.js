/* eslint-disable new-cap */
define([
  'preact',
  'htm',
  './ErrorAlert',

  'bootstrap',
  'css!./TypeaheadInput.css',
], (
    {Component, h, createRef},
    htm,
    ErrorAlert,
) => {
  const html = htm.bind(h);

  const MAX_RESULT_SIZE = 100;
  const MIN_QUERY_LENGTH = 2;

  /**
   * doc here
   */
  class TypeaheadInput extends Component {
    /**
     * doc here
     *
     * @param {*} props
     */
    constructor(props) {
      super(props);
      this.bodyListener = null;
      // we need a handle in order to focus
      // on the input at times.
      this.inputRef = createRef();
      this.state = {
        status: 'INITIAL',
        inputValue: '',
        userOpenedSearch: false,
      };
    }

    /**
     *
     */
    componentDidMount() {
      this.bodyListener = () => {
        this.setState({
          userOpenedSearch: false,
        });
      };
      document.addEventListener('click', this.bodyListener);
    }

    /**
     *
     */
    componentWillUnmount() {
      document.removeEventListener('click', this.bodyListener);
    }

    /**
     * doc here
     *
     * @return {string}
     */
    renderLoading() {
      return html`
                <span className="fa fa-spinner fa-pulse fa-3x'" />
            `;
    }

    /**
     *  doc here
     *
     * @param {*} message
     * @return {string}
     */
    renderError({message}) {
      return html`
            <${ErrorAlert} message=${message} />
        `;
    }

    /**
     *
     * @param {*} searchTerm
     * @return {string}
     */
    searchData(searchTerm) {
      const data = this.props.data;
      const totalCount = data.length;

      if (searchTerm.length < MIN_QUERY_LENGTH) {
        return {
          status: 'ERROR',
          message: `Please enter ${MIN_QUERY_LENGTH} or more letters`,
        };
      }

      searchTerm = searchTerm.toLowerCase();
      const searchedValues = data.filter((item) => {
        // Just do a substring search.
        return item.search.includes(searchTerm);
      });
      const searchCount= searchedValues.length;

      if (searchedValues.length > MAX_RESULT_SIZE) {
        return {
          status: 'SUCCESS',
          value: {
            totalCount,
            searchCount,
            tooManyResults: true,
          },
        };
      } else if (searchedValues.length === 0) {
        return {
          status: 'SUCCESS',
          value: {
            totalCount,
            searchCount,
            searchedValues,
          },
        };
      }

      return {
        status: 'SUCCESS',
        value: {
          totalCount,
          searchCount,
          searchedValues,
        },
      };
    }

    /**
     * doc here
     * @param {*} value
     * @return  {any}
     */
    inputUpdated(value) {
      const resultState = this.searchData(value);
      this.setState({
        ...resultState,
        inputValue: value,
        userHasModified: true,
        userOpenedSearch: true,
      });
      return resultState;
    }

    /**
     * doc here
     * @param {*} e
     */
    onInput(e) {
      const value = e.target.value;
      this.inputUpdated(value);
      this.props.onSelect(value);
    }

    /**
     * doc here
     * @param {*} event
     */
    onKeyDown(event) {
      if (event.key === 'Tab' ||
        event.key === 'Escape' ||
        event.key === 'Enter') {
        this.closeDropdown();
      }
    }

    /**
     * doc here
     * @param {*} e
     */
    doToggleSearch(e) {
      e.stopPropagation();
      this.inputRef.current.focus();
      if (this.state.status !== 'SUCCESS') {
        const totalCount = this.props.data.length;
        this.setState({
          status: 'SUCCESS',
          value: {
            totalCount,
            searchCount: 0,
            searchedValues: [],
          },
          userHasModified: true,
          userOpenedSearch: true,
        });
        return;
      }
      this.setState({
        userOpenedSearch: !this.state.userOpenedSearch,
      });
    }

    /**
     * doc here
     * @return {string}
     */
    renderSearchButton() {
      return html`
                <span className="input-group-addon fa fa-search -search-button" 
                    onClick=${this.doToggleSearch.bind(this)}/>
            `;
    }

    /**
     * doc here
     * @param {*} e
     */
    doClearSearch(e) {
      e.stopPropagation();
      this.inputRef.current.focus();
      this.inputUpdated('');
    }

    /**
     * doc here
     */
    closeDropdown() {
      this.setState({
        ...this.state,
        userOpenedSearch: false,
      });
      this.props.onSelect(this.state.inputValue);
    }

    /**
     * doc here
     * @return {string}
     */
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

    /**
     * doc here
     * @param {*} value
     */
    doSelectValue(value) {
      this.setState({
        ...this.state,
        // value,
        inputValue: value,
        userOpenedSearch: false,
      });
      this.props.onSelect(value);
      this.inputRef.current.focus();
    }

    /**
     * doc here
     * @param {*} ev
     */
    leaveAsIs(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      this.inputRef.current.focus();
      this.closeDropdown();
    }

    /**
     * doc here
     * @return {*}
     */
    renderDropdownItems() {
      if (this.state.value.tooManyResults) {
        return html`
                    <div className="text-warning -message" >
                        Too many matches (
                        <span>${this.state.value.searchCount}</span>
                        ) 
                        to display -- please enter more in order to 
                        narrow your results.
                    </div>
                `;
      } else if (this.state.value.searchedValues.length > 0 &&
                 this.state.inputValue.length > 0 &&
                 this.state.inputValue.length < MIN_QUERY_LENGTH) {
        return html`
                    <div className="text-info -message">
                        Please enter two or more letters above to search 
                        for your research or educational organization.
                    </div>
                `;
      } else if (this.state.value.searchedValues.length === 0 &&
                this.state.userHasModified) {
        if (this.state.inputValue.length === 0) {
          return html`
                        <div className="text-info -message">
                            Please enter two or more letters above to search 
                            for your research or educational organization.
                        </div>
                    `;
        }
        return html`
                    <div className="text-info -message">
                        Nothing matched your search.<br />
                        You may <button className="btn btn-default btn-xs" 
                        onClick=${this.leaveAsIs.bind(this)}>leave it as is</button> 
                        to use this value in your profile,
                        or try different text to match your organization.
                    </div>
                `;
      }

      return this.state.value.searchedValues.map(({label}) => {
        return html`
                <div className="-row -dropdown-item" 
                    onClick=${() => {
    this.doSelectValue(label);
  }}> 
                    ${label}
                </div>
                `;
      });
    }

    /**
     * doc here
     * @return {string}
     */
    renderDropdown() {
      if (!this.state.userOpenedSearch) {
        return;
      }
      if (this.state.status === 'ERROR') {
        return html`
                    <div className="-dropdown-wrapper">
                        <div className="-dropdown text-danger">
                        ${this.state.message}
                        </div>
                        <div className="-dropdown-items">
                            
                        </div>
                    </div>
                `;
      } else if (this.state.status === 'WARNING') {
        return html`
                <div className="-dropdown-wrapper">
                    <div className="-dropdown text-warning">
                        ${this.state.message}
                    </div>
                    <div className="-dropdown-items">
                       
                    </div>
                </div>
            `;
      }
      const foundMessage = (() => {
        if (!this.state.inputValue) {
          return;
        }
        return html`
                    <div>
                        Found
                        <span style=${{padding: '0 0.25em'}}>
                            ${this.state.value.searchCount}
                        </span>
                        out of
                        <span style=${{padding: '0 0.25em'}}>
                            ${Intl.NumberFormat('en-US', {useGrouping: true}).format(this.state.value.totalCount)}
                        </span>
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

    /**
     * doc here
     * @return {string}
     */
    render() {
      return html`
                <div className="TypeaheadInput">
                    <div className="input-group">
                        <input 
                            type="text"
                            ref=${this.inputRef}
                            className="form-control"
                            autocomplete="off"
                            value=${this.state.inputValue}
                            placeholder=${this.props.placeholder}
                            onInput=${this.onInput.bind(this)}
                            onKeyDown=${this.onKeyDown.bind(this)}
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
