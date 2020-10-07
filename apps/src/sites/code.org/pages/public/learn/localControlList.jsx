import PropTypes from 'prop-types';
import React from 'react';
import SafeMarkdown from '@cdo/apps/templates/SafeMarkdown';

export const styles = {
  linkStyle: {
    color: 'rgb(102, 102, 102)',
    display: 'block',
    padding: '5px',
    fontSize: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  listStyle: {
    margin: '0px',
    padding: '0px',
    listStyleType: 'none'
  }
};

export default class LocalMapControlList extends React.Component {
  static propTypes = {
    selected: PropTypes.number,
    lng: PropTypes.string,
    lat: PropTypes.string,
    featureList: PropTypes.arrayOf(PropTypes.object),
    flyToStore: PropTypes.func,
    createPopUp: PropTypes.func,
    resetMap: PropTypes.func,
    updateActive: PropTypes.func
  };

  render() {
    const {
      featureList,
      lng,
      lat,
      flyToStore,
      createPopUp,
      resetMap,
      selected,
      updateActive
    } = this.props;
    var allFeatures = [];
    featureList.forEach((feature, index) => {
      allFeatures.push(
        <li
          id={`control-${index}`}
          key={`control-${index}`}
          className={index + 1 === selected ? 'active' : ''}
        >
          <a
            style={styles.linkStyle}
            onClick={() => {
              flyToStore(feature);
              createPopUp(feature);
              updateActive(featureList, lng, lat, index + 1);
            }}
          >
            <span>
              <SafeMarkdown markdown={feature.properties.title} />
            </span>
          </a>
        </li>
      );
    });
    return (
      <ul className="ullist controls" style={styles.listStyle}>
        <li className={selected === 0 ? 'active' : ''}>
          <a
            id="ullist_a_all"
            style={styles.linkStyle}
            onClick={() => {
              updateActive(featureList, lng, lat, 0);
              resetMap();
            }}
          >
            <span>View All</span>
          </a>
        </li>
        {allFeatures}
      </ul>
    );
  }
}
