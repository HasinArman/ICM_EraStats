import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%');

    svg.selectAll('*').remove(); // Clear previous contents

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .nice()
      .range([height, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', 'steelblue')
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('.tooltip');
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`Label: ${d.label}<br>Value: ${d.value}`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
        d3.select(this).attr('fill', 'orange');
      })
      .on('mouseout', function() {
        const tooltip = d3.select('.tooltip');
        tooltip.transition().duration(500).style('opacity', 0);
        d3.select(this).attr('fill', 'steelblue');
      });

  }, [data]);

  return (
    <svg ref={svgRef} className="w-full h-full"></svg>
  );
};

export default BarChart;
