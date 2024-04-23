import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { BarChartDataPoint } from "./barChart";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;
import ColorPicker = formattingSettings.ColorPicker;
import ToggleSwitch = formattingSettings.ToggleSwitch;

/**
 * Enable Axis Formatting Card
 */
class EnableAxisCardSettings extends Card {
    show = new ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
    });

    fill = new ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#000000" }
    });
    topLevelSlice: ToggleSwitch = this.show;
    name: string = "enableAxis";
    displayName: string = "Enable Axis";
    slices: Slice[] = [this.fill];
}

/**
 * Color Selector Formatting Card
 */
class ColorSelectorCardSettings extends Card {
    name: string = "colorSelector";
    displayName: string = "Data Colors";

    // slices will be populated in barChart settings model `populateColorSelector` method
    slices: Slice[] = [];
}

/**
* BarChart formatting settings model class
*/
export class BarChartSettingsModel extends Model {
    // Create formatting settings model formatting cards
    enableAxis = new EnableAxisCardSettings();
    colorSelector = new ColorSelectorCardSettings();
    cards: Card[] = [this.enableAxis, this.colorSelector];

    /**
     * populate colorSelector object categories formatting properties
     * @param dataPoints 
     */
    populateColorSelector(dataPoints: BarChartDataPoint[]) {
        const slices: Slice[] = this.colorSelector.slices;
        if (dataPoints) {
            dataPoints.forEach(dataPoint => {
                slices.push(new ColorPicker({
                    name: "fill",
                    displayName: dataPoint.category,
                    value: { value: dataPoint.color },
                    selector: dataPoint.selectionId.getSelector(),
                }));
            });
        }
    }
}