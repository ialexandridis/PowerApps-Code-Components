import * as d3 from 'd3';
import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class cmpBarChart implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private container: HTMLDivElement;
    private xAxisLabels: string[];
    private yAxisValues: number[];
    private barColor: string;
    private chartTitle: string;
    private chartHeight: number;
    private chartWidth: number;
    private defaultColors = ['#0072BD'];
    private titleSize: number;
    private chartTextsSize: number;
    private colorSelection: string;
    private adjustedBottomMargin: number;

    constructor() {
        this.xAxisLabels = [];
        this.yAxisValues = [];
        this.barColor = 'blue';
        this.chartTitle = '';
        this.chartHeight = 600;
        this.chartWidth = 600;
    }

    private drawChart(colorScale: d3.ScaleOrdinal<string, string>): void {

        d3.select(this.container).selectAll('*').remove();

        const margin = { top: 80, right: 40, bottom: 45 + this.adjustedBottomMargin  * (this.chartTextsSize * 1.1) , left: 70 };
        console.log('Max number of lines created:', this.adjustedBottomMargin );
        let width = this.chartWidth - margin.left - margin.right;
        let height = this.chartHeight - margin.top - margin.bottom;
    
    
        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(this.yAxisValues) || 0])
            .nice()
            .range([height, 0]);
    
        const x = d3.scaleBand()
            .domain(this.xAxisLabels)
            .range([0, width])
            .padding(0.1);
            

        const xAxis = d3.axisBottom(x);
    
        const yAxis = d3.axisLeft(y)
            .tickFormat(d => this.formatNumber(d));
    
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', this.chartTextsSize)
            .call(this.wrapLabels, x.bandwidth()); // Call wrapLabels to handle word wrapping
    
        svg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', this.chartTextsSize)
            .attr('dy', '.35em');
    
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', this.titleSize)
            .text(this.chartTitle);
    
        svg.selectAll('rect')
            .data(this.yAxisValues)
            .enter()
            .append('rect')
            .attr('x', (d, i) => x(this.xAxisLabels[i]) || 0)
            .attr('y', d => y(d))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d))
            .attr('fill', (d, i) => colorScale(this.xAxisLabels[i]));
    
        svg.selectAll('.bar-label')
            .data(this.yAxisValues)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', (d, i) => (x(this.xAxisLabels[i]) || 0) + x.bandwidth() / 2)
            .attr('y', d => y(d) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', this.chartTextsSize)
            .text(d => this.formatNumber(d));

        this.adjustedBottomMargin = this.wrapLabels(d3.select(this.container).selectAll('.x-axis text'), x.bandwidth());

    }
    
    private wrapLabels(selection: d3.Selection<d3.BaseType, any, any, any>, maxWidth: number): number {
        let maxLines = 0;
    
        selection.each(function () {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let line: string[] = [];
            const lineHeight = 1.3;
            const y = text.attr('y');
            const dy = parseFloat(text.attr('dy') || '0');
            let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
    
            let word = words.pop();
            let numberOfLines = 0;
    
            while (word) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node()!.getComputedTextLength() > maxWidth) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = text
                        .append('tspan')
                        .attr('x', 0)
                        .attr('y', y)
                        .attr('dy', ++numberOfLines * lineHeight + dy + 'em')
                        .text(word);
                } else {
                    // Add space between words
                    line.push('');
                }
                word = words.pop();
            }
    
            maxLines = Math.max(maxLines, numberOfLines);
        });
    
        return maxLines;
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
    
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this.container = container;
        this.updateView(context);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        
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
            this.chartTextsSize = context.parameters.chartTextsSize.raw || 13;
        }

        const yAxisValuesString = (context.parameters.yAxisValues.raw || '') as string;
        const xAxisLabelsString = (context.parameters.xAxisLabels.raw || '') as string;

        this.yAxisValues = yAxisValuesString.split(',').map(value => {
            const parsedValue = parseFloat(value);
            return isNaN(parsedValue) ? 0 : parsedValue;
        });

        this.xAxisLabels = xAxisLabelsString.split(',').map(label => label.trim());

        // Call the getColorScale method to get the color scale
        const colorScale = this.getColorScale(context);

        // Call the drawChart method with the color scale
        this.drawChart(colorScale);
    }

    private colorPalettes: { [key: string]: string[] } = {
        Light_Green: ['#94BC5D'],
        Yellow: ['#F4D470'],
        Purple: ['#A48BC1'],
        Blue_Gray: ['#5C96A5'],
        Gold: ['#F5C767'],
        Dark_Grayish_Purple: ['#76677B'],
        Pale_Yellow: ['#DBD588'],
        Pink: ['#DC9BB0'],
        Light_Blue: ['#88C9DB'],
        Teal: ['#8DD3C7'],
        Cream: ['#FFFFB3'],
        Steel_Blue: ['#80B1D3'],
        // ... Add more palettes as needed
    };

    private getColorScale(context: ComponentFramework.Context<IInputs>): d3.ScaleOrdinal<string, string> {
        const paletteKey = context.parameters.ColorPalettePreference.raw;
        const colorPalette = this.colorPalettes[paletteKey as keyof typeof this.colorPalettes] || this.defaultColors;
    
        return d3.scaleOrdinal<string>()
            .domain(['value1'])
            .range(colorPalette);
    }
    

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup if needed
    }
} 