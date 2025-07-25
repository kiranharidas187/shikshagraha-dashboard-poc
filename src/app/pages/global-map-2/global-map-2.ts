import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule } from '@angular/common';

interface NetworkDataItem {
  source: [number, number];
  target: [number, number];
  lineType: string;
  sourceIcon: string;
  targetIcon: string;
  partners: { name: string; icon: string; }[];
  curvature?: number;
}

@Component({
  selector: 'app-global-map-2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-map-2.html',
  styleUrls: ['./global-map-2.css']
})
export class GlobalMap2 implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') private mapContainer!: ElementRef;
  
    constructor() { }
  
    ngOnInit(): void {
    }
  
    ngAfterViewInit(): void {
      this.drawChoroplethMap();
    }
  
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
      this.drawChoroplethMap();
    }
  
    private drawChoroplethMap(): void {
      d3.select('#map-container-2 svg').remove();
      d3.select('.tooltip').remove();
  
      const container = this.mapContainer.nativeElement;
      const width = container.offsetWidth;
      const height = container.offsetHeight;
  
      if (width === 0 || height === 0) return;
  
      const svg = d3.select('#map-container-2')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
  
      // Define SVG defs for gradient and arrowhead
      const defs = svg.append('defs');

      defs.append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%')
        .selectAll('stop')
        .data([
          { offset: '0%', color: 'red' },
          { offset: '50%', color: 'purple' },
          { offset: '100%', color: 'blue' }
        ])
        .enter().append('stop')
        .attr('offset', (d: any) => d.offset)
        .attr('stop-color', (d: any) => d.color);

      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5Z')
        .attr('fill', 'purple'); // Color for arrowhead
  
      const projection = d3.geoMercator()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 1.5]);
  
      const path = d3.geoPath().projection(projection);

      const lineGenerator = d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveBasis); // For curved lines
  
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip');
  
      Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        d3.csv('https://raw.githubusercontent.com/dbouquin/IS_608/master/NanosatDB_munging/Countries-Continents.csv')
      ]).then(([world, continentData]) => {
       // @ts-ignore
  const countries = topojson.feature(world, world.objects.countries).features;
  
        const continentMap = new Map(continentData.map((d: any) => [d.Country, d.Continent]));
  
        console.log("All country names:", countries.map((c: any) => c.properties.name));
  
        // Draw the ocean
        svg.append('path')
          .datum({ type: 'Sphere' } as any)
          .attr('class', 'ocean')
          .attr('d', path as any)
          .on('mouseover', (event: any) => {
            tooltip.transition().style('opacity', .9);
            tooltip.html(`<strong>Ocean</strong>`);
          })
          .on('mousemove', (event: any) => {
            tooltip.style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', () => {
            tooltip.transition().style('opacity', 0);
          });
  
        svg.append('g')
          .selectAll('path')
          .data(countries)
          .enter().append('path')
          .attr('class', 'country')
          .attr('d', path as any)
          .attr('fill', (d: any) => {
            if (d.properties.name === 'India') {
              return '#ffcc99'; // Highlight color for India
            }
            // const continent = continentMap.get(d.properties.name);
            // return continent ? colorScale(continent) : '#ccc'; 
            return '#e6e3e3ff'; // Grey color for all other countries
          })
          .on('mouseover', (event, d: any) => {
            const continent = continentMap.get(d.properties.name) || 'N/A';
            tooltip.transition().style('opacity', .9);
            tooltip.html(`<strong>${d.properties.name}</strong><br/>Continent: ${continent}`);
          })
          .on('mousemove', (event: any) => {
            tooltip.style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', () => {
            tooltip.transition().style('opacity', 0);
          });
  
        const india = countries.find((d: any) => d.properties.name === 'India');

        const networkData: NetworkDataItem[] = [
    // Existing Data
    {
      source: [77.2090, 28.6139], target: [72.8777, 19.0760],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner A', icon: '/assets/icons/target-icon.jpg' }, { name: 'Partner B', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Delhi to Mumbai

    {
      source: [75.7139, 15.3173], target: [94.5624, 26.1584],
      lineType: 'multi-dash',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner C', icon: '/assets/icons/target-icon.jpg' }, { name: 'Partner D', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Karnataka to Nagaland

    {
      source: [90.4336, 27.5142], target: [77.5946, 12.9716],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner E', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Bhutan to Karnataka

    {
      source: [45.3182, 2.0469], target: [75.7873, 26.9124],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner F', icon: '/assets/icons/target-icon.jpg' }, { name: 'Partner G', icon: '/assets/icons/target-icon.jpg' }, { name: 'Partner H', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Somalia (Mogadishu) to Rajasthan (Jaipur)

    {
      source: [51.3890, 35.6892], target: [76.9366, 8.5241],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner I', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Iran (Tehran) to Kerala (Thiruvananthapuram)

    {
      source: [116.4074, 39.9042], target: [77.5946, 12.9716],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner J', icon: '/assets/icons/target-icon.jpg' }, { name: 'Partner K', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.8 // Special high curvature for this line
    }, // China (Beijing) to Karnataka (Bangalore)

    // Additional Internal Connections
    {
      source: [77.2090, 28.6139], target: [75.7873, 26.9124],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner L', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Delhi to Jaipur (Rajasthan)

    {
      source: [88.3639, 22.5726], target: [79.0193, 21.1458],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner M', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Kolkata (West Bengal) to Maharashtra (Nagpur)

    {
      source: [77.2090, 28.6139], target: [88.3639, 22.5726],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner N', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Delhi to Kolkata

    {
      source: [72.8777, 19.0760], target: [78.4867, 17.3850],
      lineType: 'multi-dash',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner O', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Mumbai to Hyderabad

    {
      source: [80.9462, 26.8467], target: [76.9366, 8.5241],
      lineType: 'solid',
      sourceIcon: '',
      targetIcon: '',
      partners: [{ name: 'Partner P', icon: '/assets/icons/target-icon.jpg' }],
      curvature: 0.3
    }, // Lucknow (Uttar Pradesh) to Kerala
  ];

        svg.selectAll('path.network-line')
        .data(networkData)
        .enter().append('path')
        .attr('class', 'network-line')
        .attr('d', (d: any) => {
          const sourceCoords = projection(d.source);
          const targetCoords = projection(d.target);

          if (!sourceCoords || !targetCoords) return null;

          const midX = (sourceCoords[0] + targetCoords[0]) / 2;
          const midY = (sourceCoords[1] + targetCoords[1]) / 2;

          let controlPoint: [number, number];

          const currentCurvature = d.curvature !== undefined ? d.curvature : 0.3; // Default curvature

          if (currentCurvature === 0) {
            // Straight line
            controlPoint = [midX, midY];
          } else {
            // Curved line
            const dx = targetCoords[0] - sourceCoords[0]; // Difference in X
            const dy = targetCoords[1] - sourceCoords[1]; // Difference in Y

            // Adjust the control point to always push the curve upwards
            controlPoint = [
              midX, // Keep the X coordinate the same as the midpoint for a symmetric curve
              midY - Math.abs(dy) * currentCurvature // Pull the control point upwards by the magnitude of dy
            ];
          }


          return lineGenerator([sourceCoords, controlPoint, targetCoords]);
        })
        .attr('fill', 'none')
        .attr('stroke', (d: any) => d.lineType === 'dotted' ? 'url(#line-gradient)' : (d.lineType === 'glow' ? 'blue' : (d.lineType === 'multi-dash' ? 'red' : 'purple'))) // Use gradient for dotted lines, blue for glow, purple for arrowhead, red for multi-dash
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('stroke-dasharray', (d: any) => {
          if (d.lineType === 'dotted' || d.lineType === 'arrowhead') {
            return '10,10';
          } else if (d.lineType === 'multi-dash') {
            return '20, 5, 10, 5'; // Example: long dash, short gap, medium dash, short gap
          } else {
            return '0,0';
          }
        })
        .attr('marker-end', (d: any) => d.lineType === 'arrowhead' ? 'url(#arrowhead)' : '')
        .each(function (d: any) {
          if (d.lineType === 'dotted' || d.lineType === 'arrowhead') {
            const totalLength = (this as SVGPathElement).getTotalLength();
            const pathElement = d3.select(this);

            function repeat() {
              pathElement
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(2000) // Animation duration
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat); // Loop the animation
            }
            repeat();
          } else if (d.lineType === 'glow') {
            const originalPath = d3.select(this);
            const totalLength = (this as SVGPathElement).getTotalLength();

            function repeat() {
              originalPath
                .attr('stroke-width', 2)
                .attr('opacity', 0.2)
                .transition()
                .duration(1500) // Pulse duration
                .ease(d3.easeLinear)
                .attr('stroke-width', 8) // Max glow width
                .attr('opacity', 1)
                .transition()
                .duration(1500) // Fade duration
                .ease(d3.easeLinear)
                .attr('stroke-width', 2)
                .attr('opacity', 0.2)
                .on('end', repeat); // Loop the animation
            }
            repeat();
          } else if (d.lineType === 'multi-dash') {
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

        // Add icons
        const iconData = networkData.flatMap((d: any) => [
          { icon: d.sourceIcon, coordinates: d.source, partners: d.partners },
          { icon: d.targetIcon, coordinates: d.target, partners: d.partners },
        ]);

        svg.selectAll('.node-icon')
          .data(iconData)
          .enter().append('image')
          .attr('class', 'node-icon')
          .attr('xlink:href', (d: any) => d.icon)
          .attr('width', 24) // Adjust icon size as needed
          .attr('height', 24)
          .attr('x', (d: any) => {
            const coords = projection(d.coordinates);
            return coords ? coords[0] - 12 : 0; // Center the icon
          })
          .attr('y', (d: any) => {
            const coords = projection(d.coordinates);
            return coords ? coords[1] - 12 : 0; // Center the icon
          })
          .on('mouseover', (event: any, d: any) => {
            tooltip.transition().style('opacity', .9);
            let partnersHtml = '<strong>Partners:</strong><br/>';
            d.partners.forEach((p: any) => {
              partnersHtml += `- ${p.name}<br/>`;
            });
            tooltip.html(partnersHtml);
          })
          .on('mousemove', (event: any) => {
            tooltip.style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', () => {
            tooltip.transition().style('opacity', 0);
          });
  
      }).catch(err => console.error('Error loading data:', err));
    }
}