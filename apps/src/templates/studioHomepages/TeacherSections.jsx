import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import i18n from '@cdo/locale';
import ContentContainer from '../ContentContainer';
import OwnedSections from '../teacherDashboard/OwnedSections';
import {asyncLoadSectionData} from '../teacherDashboard/teacherSectionsRedux';
import SetUpSections from './SetUpSections';

class TeacherSections extends Component {
  static propTypes = {
    //Redux provided
    asyncLoadSectionData: PropTypes.func.isRequired,
    studentSectionIds: PropTypes.array,
    plSectionIds: PropTypes.array,
    asyncLoadComplete: PropTypes.bool
  };

  componentDidMount() {
    this.props.asyncLoadSectionData();
  }

  render() {
    const hasSections =
      this.props.studentSectionIds?.length > 0 ||
      this.props.plSectionIds?.length > 0;
    return (
      <div id="classroom-sections">
        {this.props.asyncLoadComplete && (
          <ContentContainer heading={i18n.createSection()}>
            <SetUpSections hasSections={hasSections} />
          </ContentContainer>
        )}
        <ContentContainer heading={i18n.sectionsTitle()}>
          <OwnedSections />
        </ContentContainer>
        {this.props.plSectionIds?.length > 0 && (
          <ContentContainer heading={i18n.plSectionsTitle()}>
            <OwnedSections isPlSections={true} />
          </ContentContainer>
        )}
      </div>
    );
  }
}
export const UnconnectedTeacherSections = TeacherSections;
export default connect(
  state => ({
    studentSectionIds: state.teacherSections.studentSectionIds,
    plSectionIds: state.teacherSections.plSectionIds,
    asyncLoadComplete: state.teacherSections.asyncLoadComplete
  }),
  {
    asyncLoadSectionData
  }
)(TeacherSections);
