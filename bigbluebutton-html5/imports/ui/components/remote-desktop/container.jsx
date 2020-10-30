import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { getRemoteDesktopUrl } from './service';
import RemoteDesktop from './component';

const RemoteDesktopContainer = props => (
  <RemoteDesktop {...{ ...props }} />
);

export default withTracker(({ isPresenter }) => {
  const inEchoTest = Session.get('inEchoTest');
  return {
    inEchoTest,
    isPresenter,
    remoteDesktopUrl: getRemoteDesktopUrl(),
  };
})(RemoteDesktopContainer);
