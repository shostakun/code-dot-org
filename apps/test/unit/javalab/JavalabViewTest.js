import React from 'react';
import {expect} from '../../util/reconfiguredChai';
import {shallow} from 'enzyme';
// We use the UnconnectedJavalabView because shallow().dive() does not work with our version of react-redux
import {UnconnectedJavalabView as JavalabView} from '@cdo/apps/javalab/JavalabView';
import color from '@cdo/apps/util/color';
global.$ = require('jquery');

describe('Java Lab View Test', () => {
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      onMount: () => {},
      onContinue: () => {},
      onCommitCode: () => {},
      isProjectLevel: false,
      isReadOnlyWorkspace: false,
      isDarkMode: false
    };
  });

  describe('getButtonStyles', () => {
    it('Is cyan or orange in light mode', () => {
      let editor = shallow(<JavalabView {...defaultProps} />);
      const notSettings = editor.instance().getButtonStyles(false);
      expect(notSettings.backgroundColor).to.equal(color.cyan);
      const settings = editor.instance().getButtonStyles(true);
      expect(settings.backgroundColor).to.equal(color.orange);
    });

    it('Is grey in dark mode', () => {
      let props = {...defaultProps, isDarkMode: true};
      let editor = shallow(<JavalabView {...props} />);
      const notSettings = editor.instance().getButtonStyles(false);
      expect(notSettings.backgroundColor).to.equal('#272822');
      const settings = editor.instance().getButtonStyles(false);
      expect(settings.backgroundColor).to.equal('#272822');
    });
  });
});
