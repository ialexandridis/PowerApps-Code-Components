import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as d3 from 'd3';

export class cmpBubbleChart implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _container: HTMLDivElement;
    private data: any[];
    private chartTitle: string;
    private chartWidth: number = 400;
    private chartHeight: number = 400;
    private titleSize: number;
    private chartTextsSize: number;
    private outlineBubbleColor: string;
    private outlineBubbleThickness: string;
    private paletteKey:string;


    constructor() {
    }

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this._container = container;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const names = context.parameters.name.raw?.split(',') || [];
        const values = context.parameters.value.raw?.split(',').map(Number) || [];
        const xValues = context.parameters.xs.raw?.split(',').map(Number) || [];
        const yValues = context.parameters.ys.raw?.split(',').map(Number) || [];
        const categories = context.parameters.category.raw?.split(',') || [];

        if (context.parameters.chartTitle) {
            this.chartTitle = context.parameters.chartTitle.raw || '';
        }
        if (context.parameters.chartHeight) {
            this.chartHeight = context.parameters.chartHeight.raw || 300;
        }
        if (context.parameters.chartWidth) {
            this.chartWidth = context.parameters.chartWidth.raw || 600;
        }

        if (context.parameters.titleSize) {
            this.titleSize = context.parameters.titleSize.raw || 16;
        }
        if (context.parameters.chartTextsSize) {
            this.chartTextsSize = context.parameters.chartTextsSize.raw || 12;
        }

        if (context.parameters.outlineBubbleColor) {
            this.outlineBubbleColor = context.parameters.outlineBubbleColor.raw || 'white';
        }

        if (context.parameters.outlineBubbleThickness) {
            this.outlineBubbleThickness = context.parameters.outlineBubbleThickness.raw || '0';
        }

        this.paletteKey = context.parameters.ColorPalettePreference.raw;


        if (names.length !== values.length || names.length !== xValues.length || names.length !== yValues.length || names.length !== categories.length) {
            const maxLength = Math.max(names.length, values.length, xValues.length, yValues.length, categories.length);
            this.data = Array.from({ length: maxLength }, (_, index) => ({
                name: names[index] || '', // Set the name as blank if it is missing
                value: values[index] || 0,
                x: xValues[index] || 0,
                y: yValues[index] || 0,
                category: categories[index] || ''
            }));
        } else {
            this.data = names.map((name, index) => ({
                name,
                value: values[index],
                x: xValues[index],
                y: yValues[index],
                category: categories[index]
            }));
        }

        this.drawChart(context);
    }
    
    private drawChart(context: ComponentFramework.Context<IInputs>): void {
        // Clear and refresh chart
        d3.select(this._container).selectAll('*').remove();
    
        const data = this.data;
    
        const margin = { top: 40 + this.titleSize, right: 30 + this.chartTextsSize , bottom: this.chartTextsSize < 12 ? 60 : this.chartTextsSize * 2 + 45 , left: this.chartTextsSize * 4 };
        const width = this.chartWidth - margin.left - margin.right;
        const height = this.chartHeight - margin.top - margin.bottom;
    
        // Adjust xScale and yScale domain based on user input
        const xMaxValue = Math.max(...data.map(item => item.x));
        const yMaxValue = Math.max(...data.map(item => item.y));
    
        const xScale = d3.scaleLinear()
            .domain([0, xMaxValue])
            .range([0, width]);
    
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => this.formatNumber(d)); // Format x-axis ticks using formatNumber method

        const svg = d3.select(this._container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
        svg.append('g')
            .style('font-size', this.chartTextsSize + 'px')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);
    
        const yScale = d3.scaleLinear()
            .domain([0, yMaxValue])
            .range([height, 0]);
    
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => this.formatNumber(d)); // Format y-axis ticks using formatNumber method

        svg.append('g')
            .style('font-size', this.chartTextsSize + 'px')
            .call(yAxis);
    
        let color: d3.ScaleOrdinal<string, string>;

        if (this.paletteKey === 'colorSet1') {
            color = d3.scaleOrdinal<string>(d3.schemeTableau10);
        } else if (this.paletteKey === 'colorSet2') {
            color = d3.scaleOrdinal<string>(d3.schemeSet2);
        } else if (this.paletteKey === 'colorSet3') {
            color = d3.scaleOrdinal(d3.schemePastel1); //d3.scaleOrdinal<string>(d3.schemeSet3);
        } else if (this.paletteKey === 'colorSet4') {
            color = d3.scaleOrdinal(d3.schemePaired); //d3.scaleOrdinal<string>(d3.schemeSet3);
        } else if (this.paletteKey === 'colorSet5') {
            color = d3.scaleOrdinal(d3.schemeDark2); //d3.scaleOrdinal<string>(d3.schemeSet3);
        } else {
            // Default to set1 if the paletteKey is not recognized
            color = d3.scaleOrdinal<string>(d3.schemeSet1);
        }
        
    
        // Step 1: Calculate the sum of all 'value' attributes
        const totalValue = data.reduce((sum, item) => sum + item.value, 0);
        const minRadius = 10;
    
        const tooltip = d3.select(this._container).append('div')
            .style('opacity', 0)
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', 'solid')
            .style('border-width', '1px')
            .style('border-radius', '5px')
            .style('padding', '10px');
    
		const defs = svg.append('defs');
        defs.append('clipPath')
            .attr('id', 'chart-area')
            .append('rect')
            .attr('width', width)
            .attr('height', height);
	
        const chartGroup = svg.append('g')
            .attr('clip-path', 'url(#chart-area)');
    
        const circles = chartGroup.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => {
                const x = xScale(d.x);
                return Math.max(minRadius, Math.min(width - minRadius, x)); // Ensure the circle is within the chart
            })
            .attr('cy', d => {
                const y = yScale(d.y);
                return Math.max(minRadius, Math.min(height - minRadius, y)); // Ensure the circle is within the chart
            })
            .attr('r', d => {
                const radius = (d.value / totalValue) * 150;
                return radius < minRadius ? minRadius : radius;
            })
            .style('fill', d => color(d.category))
            .style('opacity', 0.9)
            .style('stroke', this.outlineBubbleColor) // Set the border color to black or any other color you prefer
            .style('stroke-width', this.outlineBubbleThickness) // Set the border width to the desired value
            
    
        // Add click event listener for each circle
        circles.nodes().forEach((node, index) => {
            const clickedData = data[index];
            const formattedValue = this.formatNumber(clickedData.value);

            node.addEventListener('click', (event) => handleBubbleClick(event, clickedData, formattedValue));
        });

        const tooltipText = svg.append('text')
            .attr('class', 'tooltip-text')
            .style('opacity', 0)
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', this.chartTextsSize + 'px');
    
        function handleBubbleClick(event: MouseEvent, clickedData: any, formattedValue: string) {
            // Get the clicked circle
            const clickedCircle = d3.select(event.currentTarget as SVGElement);

            // Check if the circle is already highlighted
            const isHighlighted = clickedCircle.property('data-highlighted') === true;
        
            // Toggle tooltip visibility
            if (!isHighlighted) {
                // Highlight the clicked circle with transition
                circles.transition().duration(300).style('opacity', 0.2);
                clickedCircle.transition().duration(300).style('opacity', isHighlighted ? 0.9 : 0.9);
                // Show tooltip
                tooltip.transition().duration(300).style('opacity', 1);
                tooltipText.transition().duration(300).style('opacity', 1);
                tooltipText.text(`Name: ${clickedData.name}, Value: ${formattedValue}`) 
                    .attr('x', 0)
                    .attr('y', -10);
                
                legendGroup.selectAll('text').each(function () {
                    const textContent = (this as SVGGElement).textContent; // Cast to SVGGElement
                    d3.select(this as Element).transition().duration(300).style('opacity', 1);
                });
                
            } else {
                // Reset opacity for all circles with transition
                circles.transition().duration(300).style('opacity', 0.9);
                // Hide tooltip
                tooltip.transition().duration(300).style('opacity', 0);
                tooltipText.transition().duration(300).style('opacity', 0);
            }
        
            // Update the 'data-highlighted' property to toggle the state
            clickedCircle.property('data-highlighted', !isHighlighted);
        }
  
        // Add legends with dynamic spacing
        const legendNames = [...new Set(data.map(item => item.category))];

        // Modify it to use the same color scale as bubbles
        const legendColors = color;

        const legendGroup = svg.append('g');
        let accumulatedX = 0;
    
        legendNames.forEach((name, index) => {
            const legendText = legendGroup
                .append('text')
                .attr('x', accumulatedX + 20)
                .attr('y', height + 30 + this.chartTextsSize * 1.2)
                .style('font-size', this.chartTextsSize + 'px')
                .text(name)
                .node() as Element; // Type assertion to tell TypeScript that it won't be null
            
            legendText.addEventListener('click', () => handleLegendClick(legendText, name));

            const text = legendGroup.append('text').text(name);
            const textNode = text.node();
            if (textNode) {
                const textLength = textNode.getComputedTextLength();
                text.remove();
    
                const rectNode = legendGroup.append('rect')
                    .attr('x', accumulatedX)
                    .attr('y', height + 15 + this.chartTextsSize * 1.2)
                    .attr('width', 15)
                    .attr('height', 15)
                    .style('fill', legendColors(name))
                    .node() as Element; // Type assertion to tell TypeScript that it won't be null
    
                rectNode.addEventListener('click', () => handleLegendClick(legendText, name));
    
                accumulatedX += textLength + this.chartTextsSize * 3; // Adjusted spacing between legends
            }
        });

        let lastClickedCategory: string | null = null;

        function handleLegendClick(legendText: Element, clickedCategory: string) {
            // Toggle opacity for circles based on legend click
            const isOpaque = d3.select(legendText).property('data-clicked') === true;
        
            // Update opacity for circles
            circles.each(function (d) {
                d3.select(this).transition().duration(300).style('opacity', isOpaque ? 0.9 : (d.category === clickedCategory ? 0.9 : 0.2));
            });
        
            // Toggle opacity for legends
            legendGroup.selectAll('text').each(function () {
                const textContent = (this as SVGGElement).textContent; // Cast to SVGGElement
                d3.select(this as Element).transition().duration(300).style('opacity',  isOpaque ? 1 : (textContent === clickedCategory ? 1 : 0.2));
            });

            // Update the 'data-clicked' property and last clicked category
            d3.select(legendText).property('data-clicked', !isOpaque);
            lastClickedCategory = clickedCategory;
        
            // Reorder circles based on the last clicked category
            const sortOrder = (a: any, b: any) => {
                if (lastClickedCategory === null) {
                    return 0; // No last clicked category, maintain original order
                } else if (a.category === lastClickedCategory) {
                    return 1; // Move bubbles from the last clicked category to the front
                } else if (b.category === lastClickedCategory) {
                    return -1; // Move bubbles from the last clicked category to the front
                } else {
                    return 0; // Maintain original order for other bubbles
                }
            };
        
            // Sort the circles based on the sortOrder function
            circles.sort(sortOrder);
        }
        
        // Add chart title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .style('font-size', this.titleSize + 'px')
            .text(this.chartTitle);
    }

    private formatNumber(n: number | { valueOf(): number }): string {
        const value = typeof n === 'number' ? n : n.valueOf();
        if (value >= 1e12) {
            return (value / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
        }
        if (value >= 1e9) {
            return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        }
        if (value >= 1e6) {
            return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (value >= 1e3) {
            return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return value.toString();
    }
    
    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup code if necessary
    }
}