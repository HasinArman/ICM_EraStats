import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%');

    svg.selectAll('*').remove(); // Clear previous contents

    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const radius = Math.min(width, height) / 2;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('.tooltip');
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`Label: ${d.data.label}<br>Value: ${d.data.value}`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
        d3.select(this).attr('opacity', 0.7);
      })
      .on('mouseout', function() {
        const tooltip = d3.select('.tooltip');
        tooltip.transition().duration(500).style('opacity', 0);
        d3.select(this).attr('opacity', 1);
      });

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .text(d => d.data.label);

  }, [data]);

  return (
    <svg ref={svgRef} className="w-full h-full"></svg>
  );
};

export default PieChart;
