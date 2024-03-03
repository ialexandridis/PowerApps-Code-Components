/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    ColorPalettePreference: ComponentFramework.PropertyTypes.EnumProperty<"Light_Green" | "Yellow" | "Purple" | "Blue_Gray" | "Gold" | "Dark_Grayish_Purple" | "Pale_Yellow" | "Pink" | "Light_Blue" | "Teal" | "Cream" | "Steel_Blue">;
    chartTitle: ComponentFramework.PropertyTypes.StringProperty;
    chartHeight: ComponentFramework.PropertyTypes.WholeNumberProperty;
    chartWidth: ComponentFramework.PropertyTypes.WholeNumberProperty;
    yAxisValues: ComponentFramework.PropertyTypes.StringProperty;
    xAxisLabels: ComponentFramework.PropertyTypes.StringProperty;
    titleSize: ComponentFramework.PropertyTypes.WholeNumberProperty;
    chartTextsSize: ComponentFramework.PropertyTypes.WholeNumberProperty;
}
export interface IOutputs {
    chartTitle?: string;
    chartHeight?: number;
    chartWidth?: number;
    titleSize?: number;
    chartTextsSize?: number;
}
