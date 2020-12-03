import React, { Component } from 'react';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import PropTypes from 'prop-types';
import _ from 'lodash';
import FullscreenService from '../fullscreen-button/service';
import FullscreenButtonContainer from '../fullscreen-button/container';
import { defineMessages, injectIntl } from 'react-intl';
import VncDisplay from 'react-vnc-display';
import { makeCall } from '/imports/ui/services/api';

import { styles } from './styles';

const propTypes = {
  remoteDesktopUrl: PropTypes.string,
};

const intlMessages = defineMessages({
  remoteDesktopLabel: {
    id: 'app.remoteDesktop.remoteDesktopLabel',
    description: 'remote desktop element label',
  },
});

const ALLOW_FULLSCREEN = Meteor.settings.public.app.allowFullscreen;
const START_VIEWONLY = Meteor.settings.public.remoteDesktop.startLocked;

class RemoteDesktop extends Component {

  constructor(props) {
    super(props);

    var { remoteDesktopUrl } = props;

    /* If the remote desktop URL includes the string "{jwt}", delay
     * opening the connection until we've obtained a JSON Web Token
     * and inserted it into the URL.
     */
    if (remoteDesktopUrl && remoteDesktopUrl.includes('{jwt}')) {
      remoteDesktopUrl = '';
    }

    this.state = {
      isFullscreen: false,
      resized: false,
      remoteDesktopUrl: remoteDesktopUrl,
    };

    this.player = null;
    this.handleResize = this.handleResize.bind(this);
    this.onFullscreenChange = this.onFullscreenChange.bind(this);
    this.resizeListener = () => {
      setTimeout(this.handleResize, 0);
    };
  }

  async componentDidMount() {
    window.addEventListener('layoutSizesSets', this.resizeListener);
    this.playerParent.addEventListener('fullscreenchange', this.onFullscreenChange);

    /* If the remote desktop URL contains the string '{jwt}',
     * asynchronously request a JSON Web Token to authenticate this
     * user.  Once the remote procedure call returns, replace the
     * '{jwt}' string with the JWT, and set this new URL in the state,
     * which will trigger a re-render of this component.
     */

    if (this.props.remoteDesktopUrl.includes('{jwt}')) {
      const jwt = await makeCall('getSignedIdentity');
      this.setState({remoteDesktopUrl: this.props.remoteDesktopUrl.replace(/{jwt}/g, jwt)});
    }
  }

  componentWillUnmount() {
    window.removeEventListener('layoutSizesSets', this.resizeListener);
    this.playerParent.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  handleResize() {

    /* The first time through this code, it's likely that this.playerParent
     * won't be set yet, and that means the full screen component won't
     * work right.  The simplest way I've found to fix this is to set
     * some kind of state variable here, which forces a re-render the
     * first time it toggles from false to true, and that fixes the problem
     * with the full screen component.
     *
     * Strictly speaking, this has nothing to do with a resize.
     */
    this.setState({resized: true});

    if (!this.player || !this.playerParent) {
      return;
    }

    const { isFullscreen } = this.state;
    var par;
    if (isFullscreen) {
	par = this.playerParent;
    } else {
        par = this.playerParent.parentElement;
    }
    const w = par.clientWidth;
    const h = par.clientHeight;

    const fb_width = this.player.rfb._display.width;
    const fb_height = this.player.rfb._display.height;

    if ((fb_width == 0) || (fb_height == 0)) {
	return;
    }

    const idealW = h * fb_width / fb_height;

    const style = {};
    if (idealW > w) {
      style.width = w;
      style.height = Math.floor(w * fb_height / fb_width);
    } else {
      style.width = Math.floor(idealW);
      style.height = h;
    }

    // some violation of component isolation here
    //
    // this.player is a VncDisplay, and we dig down into its internals
    // to resize the component.  This is necessary because not only
    // do we want to resize the drawing canvas, but the scaling factor
    // for translating mouse events also needs to be recomputed,
    // and VncDisplay doesn't currently export a method to do that.

    this.player.rfb._display.autoscale(style.width, style.height);

    const styleStr = `width: ${style.width}px; height: ${style.height}px; display: flex; justify-content: center;`;
    this.playerParent.style = styleStr;
  }

  onFullscreenChange() {
    const { isFullscreen } = this.state;
    const newIsFullscreen = FullscreenService.isFullScreen(this.playerParent);
    if (isFullscreen !== newIsFullscreen) {
      this.setState({ isFullscreen: newIsFullscreen });
    }
    setTimeout(this.handleResize, 0);
  }

  onConnect = () => {
      /* We have to handshake a bit with the VNC server before
       * we know the remote screen geometry.  Therefore, once
       * we finish connecting, schedule a resize.
       */
      setTimeout(this.handleResize, 0);
  }

  renderFullscreenButton() {
    const { intl } = this.props;
    const { isFullscreen } = this.state;

    if (!ALLOW_FULLSCREEN) return null;

    return (
      <FullscreenButtonContainer
        key={_.uniqueId('fullscreenButton-')}
        elementName={intl.formatMessage(intlMessages.remoteDesktopLabel)}
        fullscreenRef={this.playerParent}
        isFullscreen={isFullscreen}
        dark
      />
    );
  }

  render() {
    var { remoteDesktopUrl } = this.state;

    if (remoteDesktopUrl) {
      const url = new URL(remoteDesktopUrl);
      this.vncPassword = url.searchParams.get('password');
    } else {
      this.vncPassword = ''
    }

    return (
      <div
        id="remote-desktop"
        data-test="remoteDesktop"
        ref={(ref) => { this.playerParent = ref; }}
      >
        {this.renderFullscreenButton()}
        {remoteDesktopUrl != '' &&
        <VncDisplay
          className={styles.remoteDesktop}
          width={null}
          height={null}
          url={remoteDesktopUrl}
          credentials={{password: this.vncPassword}}
          onConnect={this.onConnect}
          viewOnly={START_VIEWONLY}
          shared
          ref={(ref) => {
	      this.player = ref;
	      /* window.VncDisplay is globally accessible so that the lock button can access it */
	      window.VncDisplay = ref;
	  }}
        />}
      </div>
    );
  }
}

RemoteDesktop.propTypes = propTypes;

export default injectIntl(injectWbResizeEvent(RemoteDesktop));
