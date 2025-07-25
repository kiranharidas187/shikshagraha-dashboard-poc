import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-map.html',
  styleUrls: ['./global-map.css']
})
export class GlobalMap implements OnInit, AfterViewInit {
  @ViewChild('globeContainer') private globeContainer!: ElementRef;

  networkData = [
    { source: [-118.2437, 34.0522], target: [76.2711, 10.8505], lineType: 'multi-dash' }, // Los Angeles to Kerala
    { source: [55.2962, 25.2770], target: [72.1362, 22.3094], lineType: 'multi-dash' }, // Dubai to Gujarat
    { source: [8.2275, 46.8182], target: [72.8774, 19.0761], lineType: 'multi-dash' }, // Switzerland to Mumbai
    { source: [0, -90], target: [75.0856, 30.7353], lineType: 'multi-dash' }, // Antarctica to Punjab
    { source: [0, 90], target: [94.5624, 26.1584], lineType: 'multi-dash' }, // Arctic to Nagaland
    { source: [24.6727, -28.4793], target: [77.5712, 32.0842], lineType: 'multi-dash' }, // South Africa to Himachal Pradesh
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.drawGlobe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.drawGlobe();
  }

  private drawGlobe(): void {
    d3.select('#globe-container svg').remove();

    const container = this.globeContainer.nativeElement;
    const width = container.offsetWidth;
    const height = width; // Make it a square for a circular globe

    const svg = d3.select('#globe-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const projection = d3.geoOrthographic()
      .scale(width / 2 - 10)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);

    // Load world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then((world: any) => {
      const countries = topojson.feature(world, world.objects.countries) as any;

      const globe = svg.append('g');

      // Set initial rotation to show India
      projection.rotate([-80, -20, 0]);

      // Draw the ocean
      globe.append('path')
        .datum({ type: 'Sphere' } as any)
        .attr('class', 'ocean')
        .attr('d', path);

      // Draw the countries
      globe.selectAll('path.country')
        .data(countries.features)
        .enter().append('path')
        .attr('class', (d: any) => {
          return d.properties.name === 'India' ? 'country india' : 'country';
        })
        .attr('d', path as any);

      // Draw network lines
      const lineGenerator = d3.line()
        .curve(d3.curveBasis);

      const lines = svg.append('g').attr('class', 'network-lines');

      lines.selectAll('path.network-line')
        .data(this.networkData)
        .enter().append('path')
        .attr('class', 'network-line')
        .attr('d', (d: any) => {
          const sourceCoords = projection(d.source);
          const targetCoords = projection(d.target);

          if (!sourceCoords || !targetCoords) return null;

          // Calculate a control point for curvature
          const midX = (sourceCoords[0] + targetCoords[0]) / 2;
          const midY = (sourceCoords[1] + targetCoords[1]) / 2;
          const controlPoint: [number, number] = [midX + (targetCoords[1] - sourceCoords[1]) * 0.2, midY - (targetCoords[0] - sourceCoords[0]) * 0.2];

          return lineGenerator([sourceCoords, controlPoint, targetCoords]);
        })
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('stroke-dasharray', (d: any) => {
          if (d.lineType === 'multi-dash') {
            return '20, 5, 10, 5'; // Example: long dash, short gap, medium dash, short gap
          } else {
            return '0,0';
          }
        })
        .each(function(d: any) {
          if (d.lineType === 'multi-dash') {
            const totalLength = (this as SVGPathElement).getTotalLength();
            const pathElement = d3.select(this);

            function repeat() {
              pathElement
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(5000) // Animation duration
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat); // Loop the animation
            }
            repeat();
          }
        });

      // Add markers at start and end points
      lines.selectAll('circle.marker')
        .data(this.networkData.map((d: any) => [d.source, d.target]).flat())
        .enter().append('circle')
        .attr('class', 'marker')
        .attr('cx', (d: any) => projection(d)![0])
        .attr('cy', (d: any) => projection(d)![1])
        .attr('r', 3) // Radius of the marker
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);
    });
  }
}