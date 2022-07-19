define([
    'preact',
    'htm',

    // For effect
    'css!./SignInButton.css'
], (
    preact,
    htm
) => {
    const {Component} = preact;
    const html = htm.bind(preact.h);

    class SignInButton extends Component {
        constructor(props) {
            super(props);
            this.imageBase =  `${this.props.assetsPath}/providers/${this.props.provider.id.toLowerCase()}/signin-button`;
            this.state = {
                loading: false,
                imageState: 'normal'
            };
        }

        renderSpinner() {
            if (this.state.loading) {
                return html`
                    <div className="-loading">
                        <span className="fa fa-spinner fa-pulse fa-3x" />
                    </div>
                `;
            }
        }

        doSignIn() {
            this.setState({
                loading: true,
                imageState: 'disabled'
            }, () => {
                this.props.doSignIn();
            });
        }

        doMouseOver() {
            this.setState({
                imageState: 'hover'
            });
        }

        doMouseOut() {
            this.setState({
                imageState: 'normal'
            });
        }

        doMouseDown() {
            this.setState({
                imageState: 'pressed'
            });
        }

        doMouseUp() {
            this.setState({
                imageState: 'normal'
            });
        }

        renderImageSource() {
            return `${this.imageBase}/${this.state.imageState}.png`;
        }

        render() {
            const buttonLabel = `Sign In button for the ${this.props.provider.label} identity provider`;
            return html`
                <div className="SignInButton" role="button" aria-label=${buttonLabel} title=${buttonLabel}>
                    <img onClick=${this.doSignIn.bind(this)}
                         onMouseOver=${this.doMouseOver.bind(this)}
                         onMouseOut=${this.doMouseOut.bind(this)}
                         onMouseDown=${this.doMouseDown.bind(this)}
                         onMouseUp=${this.doMouseUp.bind(this)}
                         src=${this.renderImageSource()} />
                    ${this.renderSpinner()}
                </div>
            `;
        }
    }

    return SignInButton;
});