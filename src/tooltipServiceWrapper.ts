module powerbi.extensibility.visual {

    export interface TooltipEventArgs<TData> {
        data: TData;
        coordinates: number[];
        elementCoordinates: number[];
        context: HTMLElement;
        isTouchEvent: boolean;
    }

    export interface ITooltipServiceWrapper {
        addTooltip<T>(
            selection: d3.Selection<Element>,
            getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
            getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId,
            reloadTooltipDataOnMouseMove?: boolean): void;
        hide(): void;
    }

    const DefaultHandleTouchDelay = 1000;

    export function createTooltipServiceWrapper(tooltipService: ITooltipService, rootElement: Element, handleTouchDelay: number = DefaultHandleTouchDelay): ITooltipServiceWrapper {
        return new TooltipServiceWrapper(tooltipService, rootElement, handleTouchDelay);
    }

    class TooltipServiceWrapper implements ITooltipServiceWrapper {
        private handleTouchTimeoutId: number;
        private visualHostTooltipService: ITooltipService;
        private rootElement: Element;
        private handleTouchDelay: number;

        constructor(tooltipService: ITooltipService, rootElement: Element, handleTouchDelay: number) {
            this.visualHostTooltipService = tooltipService;
            this.handleTouchDelay = handleTouchDelay;
            this.rootElement = rootElement;
        }

        public addTooltip<T>(
            selection: d3.Selection<Element>,
            getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
            getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId,
            reloadTooltipDataOnMouseMove?: boolean): void {

            if (!selection || !this.visualHostTooltipService.enabled()) {
                return;
            }

            let rootNode = this.rootElement;

            // Mouse events
            selection.on("mouseover.tooltip", () => {
                // Ignore mouseover while handling touch events
                if (!this.canDisplayTooltip(d3.event))
                    return;

                let tooltipEventArgs = this.makeTooltipEventArgs<T>(rootNode, true, false);
                if (!tooltipEventArgs)
                    return;

                let tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                if (tooltipInfo == null)
                    return;

                let selectionId = getDataPointIdentity(tooltipEventArgs);

                this.visualHostTooltipService.show({
                    coordinates: tooltipEventArgs.coordinates,
                    isTouchEvent: false,
                    dataItems: tooltipInfo,
                    identities: selectionId ? [selectionId] : [],
                });
            });

            selection.on("mouseout.tooltip", () => {
                this.visualHostTooltipService.hide({
                    isTouchEvent: false,
                    immediately: false,
                });
            });

            selection.on("mousemove.tooltip", () => {
                // Ignore mousemove while handling touch events
                if (!this.canDisplayTooltip(d3.event))
                    return;

                let tooltipEventArgs = this.makeTooltipEventArgs<T>(rootNode, true, false);
                if (!tooltipEventArgs)
                    return;

                let tooltipInfo: VisualTooltipDataItem[];
                if (reloadTooltipDataOnMouseMove) {
                    tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                    if (tooltipInfo == null)
                        return;
                }

                let selectionId = getDataPointIdentity(tooltipEventArgs);

                this.visualHostTooltipService.move({
                    coordinates: tooltipEventArgs.coordinates,
                    isTouchEvent: false,
                    dataItems: tooltipInfo,
                    identities: selectionId ? [selectionId] : [],
                });
            });

            // --- Touch events ---

            let touchStartEventName: string = TooltipServiceWrapper.touchStartEventName();
            let touchEndEventName: string = TooltipServiceWrapper.touchEndEventName();
            let isPointerEvent: boolean = TooltipServiceWrapper.usePointerEvents();

            selection.on(touchStartEventName + '.tooltip', () => {
                this.visualHostTooltipService.hide({
                    isTouchEvent: true,
                    immediately: true,
                });

                let tooltipEventArgs = this.makeTooltipEventArgs<T>(rootNode, isPointerEvent, true);
                if (!tooltipEventArgs)
                    return;

                let tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
                let selectionId = getDataPointIdentity(tooltipEventArgs);

                this.visualHostTooltipService.show({
                    coordinates: tooltipEventArgs.coordinates,
                    isTouchEvent: true,
                    dataItems: tooltipInfo,
                    identities: selectionId ? [selectionId] : [],
                });
            });

            selection.on(touchEndEventName + '.tooltip', () => {
                this.visualHostTooltipService.hide({
                    isTouchEvent: true,
                    immediately: false,
                });

                if (this.handleTouchTimeoutId)
                    clearTimeout(this.handleTouchTimeoutId);

                // At the end of touch action, set a timeout that will let us ignore the incoming mouse events for a small amount of time
                // TODO: any better way to do this?
                this.handleTouchTimeoutId = setTimeout(() => {
                    this.handleTouchTimeoutId = undefined;
                }, this.handleTouchDelay);
            });
        }

        public hide(): void {
            this.visualHostTooltipService.hide({ immediately: true, isTouchEvent: false });
        }

        private makeTooltipEventArgs<T>(rootNode: Element, isPointerEvent: boolean, isTouchEvent: boolean): TooltipEventArgs<T> {
            let target = <HTMLElement>(<Event>d3.event).target;
            let data: T = d3.select(target).datum();

            let mouseCoordinates = this.getCoordinates(rootNode, isPointerEvent);
            let elementCoordinates: number[] = this.getCoordinates(target, isPointerEvent);
            let tooltipEventArgs: TooltipEventArgs<T> = {
                data: data,
                coordinates: mouseCoordinates,
                elementCoordinates: elementCoordinates,
                context: target,
                isTouchEvent: isTouchEvent
            };

            return tooltipEventArgs;
        }

        private canDisplayTooltip(d3Event: any): boolean {
            let canDisplay: boolean = true;
            let mouseEvent: MouseEvent = <MouseEvent>d3Event;
            if (mouseEvent.buttons !== undefined) {
                // Check mouse buttons state
                let hasMouseButtonPressed = mouseEvent.buttons !== 0;
                canDisplay = !hasMouseButtonPressed;
            }

            // Make sure we are not ignoring mouse events immediately after touch end.
            canDisplay = canDisplay && (this.handleTouchTimeoutId == null);

            return canDisplay;
        }

        private getCoordinates(rootNode: Element, isPointerEvent: boolean): number[] {
            let coordinates: number[];

            if (isPointerEvent) {
                // copied from d3_eventSource (which is not exposed)
                let e = <any>d3.event, s;
                while (s = e.sourceEvent) e = s;
                let rect = rootNode.getBoundingClientRect();
                coordinates = [e.clientX - rect.left - rootNode.clientLeft, e.clientY - rect.top - rootNode.clientTop];
            }
            else {
                let touchCoordinates = d3.touches(rootNode);
                if (touchCoordinates && touchCoordinates.length > 0) {
                    coordinates = touchCoordinates[0];
                }
            }

            return coordinates;
        }

        private static touchStartEventName(): string {
            let eventName: string = "touchstart";

            if (window["PointerEvent"]) {
                // IE11
                eventName = "pointerdown";
            }

            return eventName;
        }

        private static touchMoveEventName(): string {
            let eventName: string = "touchmove";

            if (window["PointerEvent"]) {
                // IE11
                eventName = "pointermove";
            }

            return eventName;
        }

        private static touchEndEventName(): string {
            let eventName: string = "touchend";

            if (window["PointerEvent"]) {
                // IE11
                eventName = "pointerup";
            }

            return eventName;
        }

        private static usePointerEvents(): boolean {
            let eventName = TooltipServiceWrapper.touchStartEventName();
            return eventName === "pointerdown" || eventName === "MSPointerDown";
        }
    }
}