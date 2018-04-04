# Adding Report Page Tooltips support to Bar Chart
Report page tooltips support can be done by updating your visual capabilities.
See [commit](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/3c6e8186436b63bf0cf97d2cdd5dde8aa8d08709) for what was added at this step.

To add report page tooltips support, most changes will be located in `capabilities.json`. A sample schema is already in place for you.

Report page tooltips definition can be done on the Format pane.

![](images/ReportPageTooltip.png)

## Support Canvas Tooltips
To support displaying report page tooltips, add "tooltips" definition to capabilities.json as follows

```json
"tooltips": {
        "supportedTypes": {
            "default": true,
            "canvas": true
        },
        "roles": [
            "tooltips"
        ]
}
```

`supportedTypes` is the tooltips configuration supported by the visual and reflected on the field well.
    `default` specifies whether the "automatic" tooltips binding via data field is supported.
    `canvas` specifies whether the report page tooltips are supported.

`roles` optional. Once defined, instructs what data roles will be bound to the selected tooltip option in fields well.


For more information, see the Report Page Tooltips usage guidlines [Report Page Tooltips](https://powerbi.microsoft.com/en-us/blog/power-bi-desktop-march-2018-feature-summary/#tooltips).

## Applying report page tooltips
For report page tooltip display, on call to ITooltipService .Show(options TooltipShowOptions) (or ITooltipService .Move(options TooltipMoveOptions)), PowerBI host will look for 'identities' property (ISelectionId[]) of TooltipMoveOptions object sent as argument to tooltip call. 
SelectionId  should indicate the "filtered" definition to be applied on the visuals referenced by report page tooltip.

Example of how to send the selectionId to tooltip display calls:

![](images/ApplyReportPageTooltip.png)

