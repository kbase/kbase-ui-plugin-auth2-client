define([
    'preact',
    'htm',
    'uuid',

    'bootstrap',
], (
    preact,
    htm,
    Uuid
) => {

    const {h, Component} = preact;
    const html = htm.bind(h);

    function buildIcon(arg) {
        const klasses = ['fa'],
            style = {verticalAlign: 'middle'};
        klasses.push(`fa-${  arg.name}`);
        if (arg.rotate) {
            klasses.push(`fa-rotate-${  String(arg.rotate)}`);
        }
        if (arg.flip) {
            klasses.push(`fa-flip-${  arg.flip}`);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push(`fa-${  String(arg.size)  }x`);
            } else {
                klasses.push(`fa-${  arg.size}`);
            }
        }
        if (arg.classes) {
            arg.classes.forEach((klass) => {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach((key) => {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return html`
            <span style=${style} className=${klasses.join(' ')} />
        `;
    }

    class CollapsiblePanel extends Component {
        render() {
            const collapseId = new Uuid(4).format();
            const type = this.props.type || 'primary';
            const collapseClasses = ['panel-collapse collapse'];
            const toggleClasses = [];
            const style = this.props.style || {};
            let icon, classes = ['panel', `panel-${  type}`];
            if (this.props.hidden) {
                classes.push('hidden');
            }
            if (!this.props.collapsed) {
                collapseClasses.push('in');
            } else {
                toggleClasses.push('collapsed');
            }
            if (this.props.classes) {
                classes = classes.concat(this.props.classes);
            }
            if (this.props.icon) {
                icon = [' ', buildIcon(this.props.icon)];
            }
            return html`<div className=${classes.join(' ')} style=${{style}}>
            <div className="panel-heading">
                <div className="panel-title">
                    <span className=${toggleClasses.join(' ')}
                        data-toggle="collapse"
                        data-target=${`#${  collapseId}`}
                        style=${{cursor: 'pointer'}}>
                        ${this.props.title} ${icon}
                    </span>
                </div>
            </div>
            <div id=${collapseId} className=${collapseClasses.join(' ')}>
                <div className="panel-body">
                    ${this.props.children}
                </div>
            </div>
        </div>`;
        }
    }

    return CollapsiblePanel;
});