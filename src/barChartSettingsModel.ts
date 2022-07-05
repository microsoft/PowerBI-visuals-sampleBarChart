import powerbi from "powerbi-visuals-api";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import { FormattingSettingsCard, FormattingSettingsModel, FormattingSettingsSlice } from "powerbi-visuals-utils-formattingmodel";
import { BarChartDataPoint } from "./barChart";

class EnableAxisCardSettings implements FormattingSettingsCard {
    show: FormattingSettingsSlice = {
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle:  true,
        type: powerbi.visuals.FormattingComponent.ToggleSwitch
    };

    fill: FormattingSettingsSlice = {
        name: "fill",
        displayName: "Color",
        value: "#000000",
        type: powerbi.visuals.FormattingComponent.ColorPicker
    };

    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices: Array<FormattingSettingsSlice> = [this.show, this.fill];
}


class ColorSelectorCardSettings implements FormattingSettingsCard {
    name: string = "colorSelector";
    displayName: string = "Data Colors";
    slices: Array<FormattingSettingsSlice> = [];
}

class GeneralViewCardSettings implements FormattingSettingsCard {
    opacity: FormattingSettingsSlice = {
        name: "opacity",
        displayName: "Bars Opacity",
        value: 100,
        type: powerbi.visuals.FormattingComponent.NumUpDown
    };

    showHelpLink: FormattingSettingsSlice = {
        name: "showHelpLink",
        displayName: "Show Help Button",
        value: false,
        type: powerbi.visuals.FormattingComponent.ToggleSwitch
    };

    name: string = "generalView";
    displayName: string = "General View";
    helpLinkColor: string = "#80B0E0"
    slices: Array<FormattingSettingsSlice> = [this.opacity, this.showHelpLink];
}

class AverageLineCardSettings implements FormattingSettingsCard {
    show: FormattingSettingsSlice = {
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true,
        type: powerbi.visuals.FormattingComponent.ToggleSwitch
    };

    fill: FormattingSettingsSlice = {
        name: "fill",
        displayName: "Color",
        value: "#888888",
        type: powerbi.visuals.FormattingComponent.ColorPicker
    };

    showDataLabel: FormattingSettingsSlice = {
        name: "showDataLabel",
        displayName: "Data Label",
        value: false,
        type: powerbi.visuals.FormattingComponent.ToggleSwitch
    };

    name: string = "averageLine";
    displayName: string = "Average Line";
    analyticsPane: boolean = true;
    slices: Array<FormattingSettingsSlice> = [this.show, this.fill, this.showDataLabel];
}

/**
* Interface for BarChart settings.
*
* @interface
* @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
* @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
* @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
*/
export class BarChartSettingsModel extends FormattingSettingsModel {
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    generalView = new GeneralViewCardSettings();
    averageLine = new AverageLineCardSettings();

    constructor() {
        super();
        this.cards = [this.enableAxis, this.colorSelector, this.generalView, this.averageLine];
    }


    /**
     * populate colorSelector object categories formatting properties
     * @param dataPoints 
     */
    populateColorSelector(dataPoints: BarChartDataPoint[]) {
        let slices = this.colorSelector.slices;
        if (dataPoints) {
            dataPoints.forEach(dataPoint => {
                slices.push({
                    name: "fill",
                    displayName: dataPoint.category,
                    value: dataPoint.color,
                    type: powerbi.visuals.FormattingComponent.ColorPicker,
                    instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule,
                    altConstantValueSelector: dataPoint.selectionId.getSelector(),
                    selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
                });
            });
        }
    }
}
