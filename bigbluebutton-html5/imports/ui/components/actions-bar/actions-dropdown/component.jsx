import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, intlShape } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import Dropdown from '/imports/ui/components/dropdown/component';
import DropdownTrigger from '/imports/ui/components/dropdown/trigger/component';
import DropdownContent from '/imports/ui/components/dropdown/content/component';
import DropdownList from '/imports/ui/components/dropdown/list/component';
import DropdownListItem from '/imports/ui/components/dropdown/list/item/component';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import DropdownListSeparator from '/imports/ui/components/dropdown/list/separator/component';
import ExternalVideoModal from '/imports/ui/components/external-video-player/modal/container';
import cx from 'classnames';
import { styles } from '../styles';
import RemoteDesktopModal from '/imports/ui/components/remote-desktop/modal/container';

const propTypes = {
  amIPresenter: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
  mountModal: PropTypes.func.isRequired,
  amIModerator: PropTypes.bool.isRequired,
  shortcuts: PropTypes.string,
  handleTakePresenter: PropTypes.func.isRequired,
  /* should be 'bool', but we actually pass strings that get cast to bool */
  /* isSharingVideo: PropTypes.bool.isRequired, */
  /* isSharingDesktop: PropTypes.bool.isRequired, */
  isPollingEnabled: PropTypes.bool.isRequired,
  allowExternalVideo: PropTypes.bool.isRequired,
  allowRemoteDesktop: PropTypes.bool.isRequired,
  stopExternalVideoShare: PropTypes.func.isRequired,
  stopRemoteDesktop: PropTypes.func.isRequired,
};

const defaultProps = {
  shortcuts: '',
};

const intlMessages = defineMessages({
  actionsLabel: {
    id: 'app.actionsBar.actionsDropdown.actionsLabel',
    description: 'Actions button label',
  },
  presentationLabel: {
    id: 'app.actionsBar.actionsDropdown.presentationLabel',
    description: 'Upload a presentation option label',
  },
  presentationDesc: {
    id: 'app.actionsBar.actionsDropdown.presentationDesc',
    description: 'adds context to upload presentation option',
  },
  desktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.desktopShareDesc',
    description: 'adds context to desktop share option',
  },
  stopDesktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.stopDesktopShareDesc',
    description: 'adds context to stop desktop share option',
  },
  pollBtnLabel: {
    id: 'app.actionsBar.actionsDropdown.pollBtnLabel',
    description: 'poll menu toggle button label',
  },
  pollBtnDesc: {
    id: 'app.actionsBar.actionsDropdown.pollBtnDesc',
    description: 'poll menu toggle button description',
  },
  takePresenter: {
    id: 'app.actionsBar.actionsDropdown.takePresenter',
    description: 'Label for take presenter role option',
  },
  takePresenterDesc: {
    id: 'app.actionsBar.actionsDropdown.takePresenterDesc',
    description: 'Description of take presenter role option',
  },
  startExternalVideoLabel: {
    id: 'app.actionsBar.actionsDropdown.shareExternalVideo',
    description: 'Start sharing external video button',
  },
  stopExternalVideoLabel: {
    id: 'app.actionsBar.actionsDropdown.stopShareExternalVideo',
    description: 'Stop sharing external video button',
  },
  startRemoteDesktopLabel: {
    id: 'app.actionsBar.actionsDropdown.shareRemoteDesktop',
    description: 'Start sharing remote desktop button',
  },
  stopRemoteDesktopLabel: {
    id: 'app.actionsBar.actionsDropdown.stopShareRemoteDesktop',
    description: 'Stop sharing remote desktop button',
  },
});

const handlePresentationClick = () => Session.set('showUploadPresentationView', true);

class ActionsDropdown extends PureComponent {
  constructor(props) {
    super(props);

    this.presentationItemId = _.uniqueId('action-item-');
    this.pollId = _.uniqueId('action-item-');
    this.takePresenterId = _.uniqueId('action-item-');

    this.handleExternalVideoClick = this.handleExternalVideoClick.bind(this);
    this.makePresentationItems = this.makePresentationItems.bind(this);
    this.handleRemoteDesktopClick = this.handleRemoteDesktopClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { amIPresenter: wasPresenter } = prevProps;
    const { amIPresenter: isPresenter, mountModal } = this.props;
    if (wasPresenter && !isPresenter) {
      mountModal(null);
    }
  }

  getAvailableActions() {
    const {
      intl,
      amIPresenter,
      allowExternalVideo,
      allowRemoteDesktop,
      handleTakePresenter,
      isSharingVideo,
      isSharingDesktop,
      isPollingEnabled,
      stopExternalVideoShare,
      stopRemoteDesktop,
    } = this.props;

    const {
      pollBtnLabel,
      pollBtnDesc,
      presentationLabel,
      presentationDesc,
      takePresenter,
      takePresenterDesc,
    } = intlMessages;

    const {
      formatMessage,
    } = intl;

    return _.compact([
      (amIPresenter && isPollingEnabled
        ? (
          <DropdownListItem
            icon="polling"
            data-test="polling"
            label={formatMessage(pollBtnLabel)}
            description={formatMessage(pollBtnDesc)}
            key={this.pollId}
            onClick={() => {
              if (Session.equals('pollInitiated', true)) {
                Session.set('resetPollPanel', true);
              }
              Session.set('openPanel', 'poll');
              Session.set('forcePollOpen', true);
            }}
          />
        )
        : null),
      (!amIPresenter
        ? (
          <DropdownListItem
            icon="presentation"
            label={formatMessage(takePresenter)}
            description={formatMessage(takePresenterDesc)}
            key={this.takePresenterId}
            onClick={() => handleTakePresenter()}
          />
        )
        : null),
      (amIPresenter
        ? (
          <DropdownListItem
            data-test="uploadPresentation"
            icon="presentation"
            label={formatMessage(presentationLabel)}
            description={formatMessage(presentationDesc)}
            key={this.presentationItemId}
            onClick={handlePresentationClick}
          />
        )
        : null),
      (amIPresenter && allowExternalVideo
        ? (
          <DropdownListItem
            icon="video"
            label={!isSharingVideo ? intl.formatMessage(intlMessages.startExternalVideoLabel)
              : intl.formatMessage(intlMessages.stopExternalVideoLabel)}
            description="External Video"
            key="external-video"
            onClick={isSharingVideo ? stopExternalVideoShare : this.handleExternalVideoClick}
          />
        )
        : null),
      (amIPresenter && allowRemoteDesktop
        ? (
          <DropdownListItem
            icon="desktop"
            label={!isSharingDesktop ? intl.formatMessage(intlMessages.startRemoteDesktopLabel)
              : intl.formatMessage(intlMessages.stopRemoteDesktopLabel)}
            description="Remote Desktop"
            key="remote-desktop"
            onClick={isSharingDesktop ? stopRemoteDesktop : this.handleRemoteDesktopClick}
          />
        )
        : null),
    ]);
  }

  makePresentationItems() {
    const {
      presentations,
      setPresentation,
      podIds,
    } = this.props;

    if (!podIds || podIds.length < 1) return [];

    // We still have code for other pods from the Flash client. This intentionally only cares
    // about the first one because it's the default.
    const { podId } = podIds[0];

    const presentationItemElements = presentations.map((p) => {
      const itemStyles = {};
      itemStyles[styles.presentationItem] = true;
      itemStyles[styles.isCurrent] = p.current;

      return (<DropdownListItem
        className={cx(itemStyles)}
        icon="file"
        iconRight={p.current ? 'check' : null}
        label={p.name}
        description="uploaded presentation file"
        key={`uploaded-presentation-${p.id}`}
        onClick={() => {
          setPresentation(p.id, podId);
        }}
      />
      );
    });

    presentationItemElements.push(<DropdownListSeparator key={_.uniqueId('list-separator-')} />);
    return presentationItemElements;
  }

  handleRemoteDesktopClick() {
    const { mountModal } = this.props;
    mountModal(<RemoteDesktopModal />);
  }

  handleExternalVideoClick() {
    const { mountModal } = this.props;
    mountModal(<ExternalVideoModal />);
  }

  render() {
    const {
      intl,
      amIPresenter,
      amIModerator,
      shortcuts: OPEN_ACTIONS_AK,
      isMeteorConnected,
    } = this.props;

    const availableActions = this.getAvailableActions();
    const availablePresentations = this.makePresentationItems();
    const children = availablePresentations.length > 2 && amIPresenter
      ? availablePresentations.concat(availableActions) : availableActions;

    if ((!amIPresenter && !amIModerator)
      || availableActions.length === 0
      || !isMeteorConnected) {
      return null;
    }

    return (
      <Dropdown ref={(ref) => { this._dropdown = ref; }}>
        <DropdownTrigger tabIndex={0} accessKey={OPEN_ACTIONS_AK}>
          <Button
            hideLabel
            aria-label={intl.formatMessage(intlMessages.actionsLabel)}
            label={intl.formatMessage(intlMessages.actionsLabel)}
            icon="plus"
            color="primary"
            size="lg"
            circle
            onClick={() => null}
          />
        </DropdownTrigger>
        <DropdownContent placement="top left">
          <DropdownList>
            {children}
          </DropdownList>
        </DropdownContent>
      </Dropdown>
    );
  }
}

ActionsDropdown.propTypes = propTypes;
ActionsDropdown.defaultProps = defaultProps;

export default withShortcutHelper(withModalMounter(ActionsDropdown), 'openActions');
