# Localizing your Custom Visuals 

Visuals can now know PowerBI's locale, so they can display localized information
(read more about [Supported languages and countries/regions for Power BI](https://powerbi.microsoft.com/en-us/documentation/powerbi-supported-languages/)).<br>
The `locale` string is passed on `IVisualHost`.

See [commit - UPDATE THIS!!!](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/a521bc6b9930f630861dc08e27330030766ae057) for what was added at this step.

## Localizing the tooltips

In the sample we display the current locale in the tooltip.

![Sample BarChart with Locale](./images/LocaleInSampleBarChart.png)

Each of these bar charts was created under different locale (English, Basque and Hindi), and it is displayed in the tooltip.

The BarChart contructor now has a `locale` member which is instantiated in the constructor with the host `locale` instance.

```typescript
    private locale: string;
    ...
    this.locale = options.host.locale;
```

A 'Localization' interface was added, which helps in localizing strings. It defines the required string for each locale, and also the 'defaultValue', which will be displayed if the visual wansn't adapted to this locale.

```typescript
    /**
     * Returns the localized string in the locale transfared using the key that was given to serch the resources
     * 
     * @param {string} locale - the locale in which PowerBI is currently running
     * @param {object} key - specify a key for the string you want localized in your visual
     */   
    export function getLocalizedString(locale: string, key: string): string {
        return myResources && key && myResources[key] && (((myResources[key]).localization[locale])|| (myResources[key]).defaultValue);
   }
```
`myResources` holds the actual strings:

```typescript
module powerbi.extensibility.visual {

    export var myResources: Resources = {};
    myResources["LanguageKey"] = {
        defaultValue: "English(English)",
        localization: {
            "ar-SA": "العربية (Arabic)",
            "bg-BG": "български (Bulgarian)",
            ...,
            "zh-CN": "中国 (Chinese-Simplified)",
            "zh-TW": "中國 (Chinese-Tranditional)"
        }
    };

}
```