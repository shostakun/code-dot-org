import PropTypes from 'prop-types';
import React, {Component} from 'react';
import Activity from '@cdo/apps/templates/lessonOverview/activities/Activity';
import i18n from '@cdo/locale';
import {announcementShape} from '@cdo/apps/code-studio/announcementsRedux';
import Announcements from '../../code-studio/components/progress/Announcements';
import {connect} from 'react-redux';
import {SignInState} from '@cdo/apps/templates/currentUserRedux';
import {ViewType} from '@cdo/apps/code-studio/viewAsRedux';
import SafeMarkdown from '@cdo/apps/templates/SafeMarkdown';
import styleConstants from '@cdo/apps/styleConstants';
import color from '@cdo/apps/util/color';

const styles = {
  frontPage: {
    display: 'flex',
    flexDirection: 'row'
  },
  left: {
    flexGrow: 2
  },
  right: {
    flexGrow: 1,
    padding: 10,
    borderLeft: 'solid 1px black'
  },
  header: {
    margin: '10px 0px'
  },
  navLink: {
    fontSize: 18,
    color: color.purple
  }
};

class LessonOverview extends Component {
  static propTypes = {
    lesson: PropTypes.shape({
      unit: PropTypes.shape({
        displayName: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired
      }).isRequired,
      displayName: PropTypes.string.isRequired,
      overview: PropTypes.string.isRequired,
      purpose: PropTypes.string.isRequired,
      preparation: PropTypes.string.isRequired
    }).isRequired,
    activities: PropTypes.array,

    // from redux
    announcements: PropTypes.arrayOf(announcementShape),
    viewAs: PropTypes.oneOf(Object.values(ViewType)).isRequired,
    isSignedIn: PropTypes.bool.isRequired
  };

  render() {
    const {lesson, announcements, isSignedIn, viewAs} = this.props;
    return (
      <div>
        <div style={styles.header}>
          <a href={lesson.unit.link} style={styles.navLink}>
            {`< ${lesson.unit.displayName}`}
          </a>
        </div>
        {isSignedIn && (
          <Announcements
            announcements={announcements}
            width={styleConstants['content-width']}
            viewAs={viewAs}
          />
        )}
        <h1>{lesson.displayName}</h1>

        <div style={styles.frontPage}>
          <div style={styles.left}>
            <h2>{i18n.overview()}</h2>
            <SafeMarkdown markdown={lesson.overview} />

            <h2>{i18n.purpose()}</h2>
            <SafeMarkdown markdown={lesson.purpose} />
          </div>
          <div style={styles.right}>
            <h2>{i18n.preparation()}</h2>
            <SafeMarkdown markdown={lesson.preparation} />
          </div>
        </div>

        <h2>{i18n.teachingGuide()}</h2>
        {this.props.activities.map(activity => (
          <Activity activity={activity} key={activity.key} />
        ))}
      </div>
    );
  }
}

export const UnconnectedLessonOverview = LessonOverview;

export default connect(state => ({
  announcements: state.announcements || [],
  isSignedIn: state.currentUser.signInState === SignInState.SignedIn,
  viewAs: state.viewAs
}))(LessonOverview);
