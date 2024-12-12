import React from 'react';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';

const Age = ({ chartType, data }) => {
  const renderChart = () => {
    switch (chartType) {
      case 'Bar':
        return <BarChart data={data} />;
      case 'Line':
        return <LineChart data={data} />;
      case 'Pie':
        return <PieChart data={data} />;
      default:
        return <BarChart data={data} />;
    }
  };

  return (
    <div>
      <h2 className="text-center text-lg font-bold">Age</h2>
      {renderChart()}
    </div>
  );
};

export default Age;
