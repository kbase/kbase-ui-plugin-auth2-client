define([
    'preact',
    'htm',

    'bootstrap'
], (
    preact,
    htm
) => {

    const {h, Component, createRef} = preact;
    const html = htm.bind(h);

    class AddTokenForm extends Component {
        constructor(props) {
            super(props);
            this.ref = createRef();
            this.state = {
                tokenName: null
            };
        }
        componentDidMount() {
            this.ref.current.focus();
        }
        onSubmit(e) {
            e.preventDefault();
            this.props.createToken(this.state.tokenName);
            this.setState({
                tokenName: null
            });
        }
        onTokenNameChange(e) {
            this.setState({
                tokenName: e.target.value
            });
        }
        render() {
            return html`
                <form className="form-inline"
                    onSubmit=${this.onSubmit.bind(this)}
                >
                    <div className="form-group">
                        <label style=${{marginRight: '4px'}}>
                            Token name
                        </label>
                        <input name="token-name"
                            ref=${this.ref}
                            onInput=${this.onTokenNameChange.bind(this)}
                            value=${this.state.tokenName}
                            className="form-control" />
                        ${' '}
                        <button className="btn btn-primary"
                            disabled=${!this.state.tokenName}
                            type="submit">
                            Create Token
                        </button>
                    </div>
                </form>
            `;
        }
    }

    return AddTokenForm;
});