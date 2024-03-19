# Opening a URL in a new tab/window
Launch URL allows opening a new browser tab (or window), by delegating the actual work to Power BI.

Note: custom visuals are hosted in Power BI inside sandboxed iframes, this prevents opening a new browser tab (or window) in "the usual way", e.g. using `window.open('http://some.link.net','_blank')`.

## Usage
Use the `host.launchUrl()` API call, passing your destination URL as a string argument:

```typescript
this.host.launchUrl('http://some.link.net');
```

## Restrictions
* Use only absolute paths, not relative ones. `http://some.link.net/subfolder/page.html` is fine, `/page.html` won't be opened.
* Currently only `http` and `https` protocols are supported. Avoid `ftp`, `mailto` etc.

## Best practices
1. For most cases, it is best to only open a link as a response to a user's explicit action. Make it easy for the user to understand that clicking the link or button will result in opening a new tab. Triggering a `launchUrl()` call without a user's action, or as a side effect of a different action can be confusing or frustrating for the user.
2. If the link is not crucial for the proper functioning of the visual, it is recommended to provide the report's author a way to disable and hide the link. This is especially relevant for special Power BI use-cases, such as embedding a report in a 3rd party application or publishing it to the web.
3. Avoid Triggering a `launchUrl()` call from inside a loop, the visual's `update` function, or any other frequently recurring code.

## Step by step example
### Adding a link launching element
The following lines were added to the visual's `constructor` function:
```typescript
    this.helpLinkElement = this.createHelpLinkElement();
    options.element.appendChild(this.helpLinkElement);
```
And, a private function creating and attaching the anchor element was added:
```typescript
private createHelpLinkElement(): Element {
    let linkElement = document.createElement("a");
    linkElement.textContent = "?";
    linkElement.setAttribute("title", "Open documentation");
    linkElement.setAttribute("class", "helpLink");
    linkElement.addEventListener("click", () => {
        this.host.launchUrl("https://github.com/Microsoft/PowerBI-visuals/blob/master/Readme.md#developing-your-first-powerbi-visual");
    });
    return linkElement;
};
```
Finally, an entry in the visual.less file defines the style for the link element ([see here](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/commit/2ecc5cf74b9bc6fbf5c03f84c3ab24841b489d4e#diff-96b5545ad582c6d540c60ebff2c9f806))

### Adding a toggling mechanism
This requires adding a static object (see [static object tutorial](https://github.com/Microsoft/PowerBI-visuals-sampleBarChart/blob/master/Tutorial/StaticObjects.md)), so that the report's author can toggle the visibility of the link element (default is set to hidden).
A `showHelpLink` boolean static object was added to `capabilities.json` objects entry:

```typescript
"objects": {
//...
    "generalView": {
            "properties": 
                //...
                "showHelpLink": {
                    "type": { 
                        "bool": true 
                    }
                }
            }
        }
    }
```

![](images/launchURLtoggle.png)

And, in the visual's `update` function, the following lines were added:
```typescript
this.helpLinkElement
    .classed("hidden", !this.formattingSettings.generalView.showHelpLink.value)
    .style("border-color", this.formattingSettings.generalView.helpLinkColor)
    .style("color", this.formattingSettings.generalView.helpLinkColor);
```

The `hidden` class is defined in visual.less to control the display of the element.