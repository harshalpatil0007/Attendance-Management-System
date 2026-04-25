import React from 'react';
import TimetableContainer from './timetable/TimetableContainer';

const TimetableSection = ({ data }) => {
  // If we're passed the old prop names, wrap them
  const processedData = data?.timetable ? data : { timetable: data };
  
  return <TimetableContainer data={processedData} />;
};

export default TimetableSection;
