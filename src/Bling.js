/* eslint-disable react/sort-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import invariant from "invariant";
import deepEqual from "deep-equal";
import hoistStatics from "hoist-non-react-statics";
import Events from "./Events";
import filterPropsSimple from "./utils/filterProps";
import { createManager, pubadsAPI } from "./createManager";
/**
 * An Ad Component using Google Publisher Tags.
 * This component should work standalone w/o context.
 * https://developers.google.com/doubleclick-gpt/
 *
 * @module Bling
 * @class Bling
 * @fires Bling#Events.READY
 * @fires Bling#Events.SLOT_RENDER_ENDED
 * @fires Bling#Events.IMPRESSION_VIEWABLE
 * @fires Bling#Events.SLOT_VISIBILITY_CHANGED
 * @fires Bling#Events.SLOT_LOADED
 */
class Bling extends Component {
    static propTypes = {
        /**
         * An optional string to be used as container div id.
         *
         * @property id
         */
        id: PropTypes.string,
        /**
         * An optional string indicating ad unit path which will be used
         * to create an ad slot.
         *
         * @property adUnitPath
         */
        adUnitPath: PropTypes.string.isRequired,
        /**
         * An optional object which includes ad targeting key-value pairs.
         *
         * @property targeting
         */
        targeting: PropTypes.object,
        /**
         * An optional prop to specify the ad slot size which accepts [googletag.GeneralSize](https://developers.google.com/doubleclick-gpt/reference#googletag.GeneralSize) as a type.
         * This will be preceded by the sizeMapping if specified.
         *
         * @property slotSize
         */
        slotSize: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
        /**
         * An optional array of object which contains an array of viewport size and slot size.
         * This needs to be set if the ad needs to serve different ad sizes per different viewport sizes (responsive ad).
         * Setting the `slot` to any dimension that's not configured in DFP results in rendering an empty ad.
         * The ad slot size which is provided for the viewport size of [0, 0] will be used as default ad size if none of viewport size matches.
         *
         * https://support.google.com/dfp_premium/answer/3423562?hl=en
         *
         * e.g.
         *
         * sizeMapping={[
         *   {viewport: [0, 0], slot: [320, 50]},
         *   {viewport: [768, 0], slot: [728, 90]}
         * ]}
         *
         * @property sizeMapping
         */
        sizeMapping: PropTypes.arrayOf(
            PropTypes.shape({
                viewport: PropTypes.array,
                slot: PropTypes.array,
            })
        ),
        /**
         * An optional flag to indicate whether an ad slot should be out-of-page slot.
         *
         * @property outOfPage
         */
        outOfPage: PropTypes.bool,
        /**
         * An optional flag to indicate whether companion ad service should be enabled for the ad.
         * If an object is passed, it takes as a configuration expecting `enableSyncLoading` or `refreshUnfilledSlots`.
         *
         * @property companionAdService
         */
        companionAdService: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.object,
        ]),
        /**
         * An optional HTML content for the slot. If specified, the ad will render with the HTML content using content service.
         *
         * @property content
         */
        content: PropTypes.string,
        /**
         * An optional click through URL. If specified, any landing page URL associated with the creative that is served is overridden.
         *
         * @property clickUrl
         */
        clickUrl: PropTypes.string,
        /**
         * An optional string or an array of string which specifies a page-level ad category exclusion for the given label name.
         *
         * @property categoryExclusion
         */
        categoryExclusion: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.array,
        ]),
        /**
         * An optional map of key-value pairs for an AdSense attribute on a particular ad slot.
         * see the list of supported key value: https://developers.google.com/doubleclick-gpt/adsense_attributes#adsense_parameters.googletag.Slot
         *
         * @property attributes
         */
        attributes: PropTypes.object,
        /**
         * An optional flag to indicate whether an empty ad should be collapsed or not.
         *
         * @property collapseEmptyDiv
         */
        collapseEmptyDiv: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.array,
        ]),
        /**
         * An optional flag to indicate whether ads in this slot should be forced to be rendered using a SafeFrame container.
         *
         * @property forceSafeFrame
         */
        forceSafeFrame: PropTypes.bool,
        /**
         * An optional object to set the slot-level preferences for SafeFrame configuration.
         *
         * @property safeFrameConfig
         */
        safeFrameConfig: PropTypes.object,
        /**
         * An optional event handler function for `googletag.events.SlotRenderEndedEvent`.
         *
         * @property onSlotRenderEnded
         */
        onSlotRenderEnded: PropTypes.func,
        /**
         * An optional event handler function for `googletag.events.ImpressionViewableEvent`.
         *
         * @property onImpressionViewable
         */
        onImpressionViewable: PropTypes.func,
        /**
         * An optional event handler function for `googletag.events.slotVisibilityChangedEvent`.
         *
         * @property onSlotVisibilityChanged
         */
        onSlotVisibilityChanged: PropTypes.func,
        /**
         * An optional event handler function for `googletag.events.SlotOnloadEvent`.
         *
         * @property onSlotOnload
         */
        onSlotOnload: PropTypes.func,
        /**
         * An optional flag to indicate whether an ad should only render when it's fully in the viewport area.
         *
         * @property renderWhenViewable
         */
        renderWhenViewable: PropTypes.bool,
        /**
         * An optional number to indicate how much percentage of an ad area needs to be in a viewable area before rendering.
         * Acceptable range is between 0 and 1.
         *
         * @property viewableThreshold
         */
        viewableThreshold: PropTypes.number,
        /**
         * An optional call back function to notify when the script is loaded.
         *
         * @property onScriptLoaded
         */
        onScriptLoaded: PropTypes.func,
        /**
         * An optional call back function to notify when the media queries on the document change.
         *
         * @property onMediaQueryChange
         */
        onMediaQueryChange: PropTypes.func,
        /**
         * An optional object to be applied as `style` props to the container div.
         *
         * @property style
         */
        style: PropTypes.object,
        /**
         * An optional property to control non-personalized Ads.
         * https://support.google.com/admanager/answer/7678538
         *
         * Set to `true` to mark the ad request as NPA, and to `false` for ad requests that are eligible for personalized ads
         * It is `false` by default, according to Google's definition.
         *
         * @property npa
         */
        npa: PropTypes.bool,
    };

    /**
     * An array of prop names which can reflect to the ad by calling `refresh`.
     *
     * @property refreshableProps
     * @static
     */
    static refreshableProps = [
        "targeting",
        "sizeMapping",
        "clickUrl",
        "categoryExclusion",
        "attributes",
        "collapseEmptyDiv",
        "companionAdService",
        "forceSafeFrame",
        "safeFrameConfig",
    ];
    /**
     * An array of prop names which requires to create a new ad slot and render as a new ad.
     *
     * @property reRenderProps
     * @static
     */
    static reRenderProps = [
        "adUnitPath",
        "slotSize",
        "outOfPage",
        "content",
        "npa",
    ];
    /**
     * An instance of ad manager.
     *
     * @property _adManager
     * @private
     * @static
     */
    static _adManager = createManager();
    /**
     *
     * @property
     * @private
     * @static
     */
    static _config = {
        /**
         * An optional string for GPT seed file url to override.
         */
        seedFileUrl: "//www.googletagservices.com/tag/js/gpt.js",
        /**
         * An optional flag to indicate whether an ad should only render when it's fully in the viewport area. Default is `true`.
         */
        renderWhenViewable: true,
        /**
         * An optional number to indicate how much percentage of an ad area needs to be in a viewable area before rendering. Default value is 0.5.
         * Acceptable range is between 0 and 1.
         */
        viewableThreshold: 0.5,
        /**
         * An optional function to create an object with filtered current props and next props for a given keys to perform equality check.
         */
        filterProps: filterPropsSimple,
        /**
         * An optional function for the filtered props and the next props to perform equality check.
         */
        propsEqual: deepEqual,
    };

    static on(eventType, cb) {
        Bling._on("on", eventType, cb);
    }

    static once(eventType, cb) {
        Bling._on("once", eventType, cb);
    }

    static removeListener(...args) {
        Bling._adManager.removeListener(...args);
    }

    static removeAllListeners(...args) {
        Bling._adManager.removeAllListeners(...args);
    }

    static _on(fn, eventType, cb) {
        if (typeof cb !== "function") {
            return;
        }
        if (eventType === Events.READY && Bling._adManager.isReady) {
            cb.call(Bling._adManager, Bling._adManager.googletag);
        } else {
            Bling._adManager[fn](eventType, cb);
        }
    }

    static configure(config = {}) {
        Bling._config = {
            ...Bling._config,
            ...config,
        };
    }
    /**
     * Returns the GPT version.
     *
     * @method getGPTVersion
     * @returns {Number|boolean} a version or false if GPT is not yet ready.
     * @static
     */
    static getGPTVersion() {
        return Bling._adManager.getGPTVersion();
    }
    /**
     * Returns the Pubads Service version.
     *
     * @method getPubadsVersion
     * @returns {Number|boolean} a version or false if Pubads Service is not yet ready.
     * @static
     */
    static getPubadsVersion() {
        return Bling._adManager.getPubadsVersion();
    }
    /**
     * Sets a flag to indicate whether the correlator value should always be same across the ads in the page or not.
     *
     * @method syncCorrelator
     * @param {boolean} value
     * @static
     */
    static syncCorrelator(value) {
        Bling._adManager.syncCorrelator(value);
    }
    /**
     * Trigger re-rendering of all the ads.
     *
     * @method render
     * @static
     */
    static render() {
        Bling._adManager.renderAll();
    }
    /**
     * Refreshes all the ads in the page with a new correlator value.
     *
     * @param {Array} slots An array of ad slots.
     * @param {Object} options You can pass `changeCorrelator` flag.
     * @static
     */
    static refresh(slots, options) {
        Bling._adManager.refresh(slots, options);
    }
    /**
     * Clears the ads for the specified ad slots, if no slots are provided, all the ads will be cleared.
     *
     * @method clear
     * @param {Array} slots An optional array of slots to clear.
     * @static
     */
    static clear(slots) {
        Bling._adManager.clear(slots);
    }
    /**
     * Updates the correlator value for the next ad request.
     *
     * @method updateCorrelator
     * @static
     */
    static updateCorrelator() {
        Bling._adManager.updateCorrelator();
    }

    static set testManager(testManager) {
        invariant(testManager, "Pass in createManagerTest to mock GPT");
        Bling._adManager = testManager;
    }

    state = {
        scriptLoaded: false,
        inViewport: false,
        moatYieldReady: false,
    };

    get adSlot() {
        return this._adSlot;
    }

    get viewableThreshold() {
        return this.props.viewableThreshold >= 0
            ? this.props.viewableThreshold
            : Bling._config.viewableThreshold;
    }

    componentDidMount() {
        Bling._adManager.addInstance(this);
        Bling._adManager
            .load(Bling._config.seedFileUrl)
            .then(this.onScriptLoaded.bind(this))
            .catch(this.onScriptError.bind(this));
    }

    componentWillReceiveProps(nextProps) {
        const { propsEqual } = Bling._config;
        const { sizeMapping } = this.props;
        if (
            (nextProps.sizeMapping || sizeMapping) &&
            !propsEqual(nextProps.sizeMapping, sizeMapping)
        ) {
            Bling._adManager.removeMQListener(this, nextProps);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        // if adUnitPath changes, need to create a new slot, re-render
        // otherwise, just refresh
        const { scriptLoaded, inViewport } = nextState;
        const notInViewport = this.notInViewport(nextProps, nextState);
        const inViewportChanged = this.state.inViewport !== inViewport;
        const isScriptLoaded = this.state.scriptLoaded !== scriptLoaded;

        // Exit early for visibility change, before executing deep equality check.
        if (notInViewport) {
            return false;
        } else if (inViewportChanged) {
            return true;
        }

        const { filterProps, propsEqual } = Bling._config;
        const refreshableProps = filterProps(
            Bling.refreshableProps,
            this.props,
            nextProps
        );
        const reRenderProps = filterProps(
            Bling.reRenderProps,
            this.props,
            nextProps
        );
        const shouldRender = !propsEqual(
            reRenderProps.props,
            reRenderProps.nextProps
        );
        const shouldRefresh =
            !shouldRender &&
            !propsEqual(refreshableProps.props, refreshableProps.nextProps);
        // console.log(`shouldRefresh: ${shouldRefresh}, shouldRender: ${shouldRender}, isScriptLoaded: ${isScriptLoaded}, syncCorrelator: ${Bling._adManager._syncCorrelator}`);

        if (shouldRefresh) {
            this.configureSlot(this._adSlot, nextProps);
        }

        if (Bling._adManager._syncCorrelator) {
            if (shouldRefresh) {
                Bling._adManager.refresh();
            } else if (shouldRender || isScriptLoaded) {
                // Bling._adManager.renderAll();
                return true;
            }
        } else {
            if (shouldRefresh) {
                this.refresh();
                return false;
            }
            if (shouldRender || isScriptLoaded) {
                return true;
            }
        }

        return false;
    }

    componentDidUpdate() {
        if (this.notInViewport(this.props, this.state)) {
            return;
        }
        if (this._divId) {
            // initial render will enable pubads service before any ad renders
            // so taken care of by the manager
            if (Bling._adManager._initialRender) {
                Bling._adManager.render();
            } else {
                this.renderAd();
            }
        }
    }

    componentWillUnmount() {
        Bling._adManager.removeInstance(this);
        if (this._adSlot) {
            Bling._adManager.googletag.destroySlots([this._adSlot]);
            this._adSlot = null;
        }
    }

    onScriptLoaded() {
        const { onScriptLoaded } = this.props;

        if (this.getRenderWhenViewable()) {
            this.foldCheck();
        }
        this.setState({ scriptLoaded: true }, onScriptLoaded); // eslint-disable-line react/no-did-mount-set-state
    }

    onScriptError(err) {
        console.warn(
            `Ad: Failed to load gpt for ${Bling._config.seedFileUrl}`,
            err
        );
    }

    getRenderWhenViewable(props = this.props) {
        return props.renderWhenViewable !== undefined
            ? props.renderWhenViewable
            : Bling._config.renderWhenViewable;
    }

    foldCheck() {
        if (this.state.inViewport) {
            return;
        }

        let slotSize;

        if (this.props.prebidConf) {
            // console.log('ttype', this.props.type, this.props.prebidConf.viewport, this.props);
            slotSize = this.getSlotSize(
                this.props.type,
                this.props.prebidConf.viewport
            );
        } else {
            // console.log('type', this.props.type, this.props);
            slotSize = this.getSlotSize();
        }

        if (Array.isArray(slotSize) && Array.isArray(slotSize[0])) {
            slotSize = slotSize[0];
        }
        if (
            slotSize === "fluid" ||
            (Array.isArray(slotSize) && slotSize[0] === "fluid")
        ) {
            slotSize = [0, 0];
        }
        const viewableThresholdValues = this.getUserViewableThresholdValues();
        const inViewport = Bling._adManager.isInViewport(
            ReactDOM.findDOMNode(this),
            slotSize,
            this.viewableThreshold,
            viewableThresholdValues
        );
        if (inViewport) {
            this.setState({ inViewport: true });
        }
    }

    defineSizeMapping(adSlot, sizeMapping) {
        if (sizeMapping) {
            Bling._adManager.addMQListener(this, this.props);
            const sizeMappingArray = sizeMapping
                .reduce((mapping, size) => {
                    return mapping.addSize(size.viewport, size.slot);
                }, Bling._adManager.googletag.sizeMapping())
                .build();
            adSlot.defineSizeMapping(sizeMappingArray);
        }
    }

    setAttributes(adSlot, attributes) {
        // no clear method, attempting to clear existing attributes before setting new ones.
        const attributeKeys = adSlot.getAttributeKeys();
        attributeKeys.forEach((key) => {
            adSlot.set(key, null);
        });
        if (attributes) {
            Object.keys(attributes).forEach((key) => {
                adSlot.set(key, attributes[key]);
            });
        }
    }

    setTargeting(adSlot, targeting) {
        adSlot.clearTargeting();
        if (targeting) {
            Object.keys(targeting).forEach((key) => {
                adSlot.setTargeting(key, targeting[key]);
            });
        }
    }

    addCompanionAdService(serviceConfig, adSlot) {
        const companionAdsService = Bling._adManager.googletag.companionAds();
        adSlot.addService(companionAdsService);
        if (typeof serviceConfig === "object") {
            if (serviceConfig.hasOwnProperty("enableSyncLoading")) {
                companionAdsService.enableSyncLoading();
            }
            if (serviceConfig.hasOwnProperty("refreshUnfilledSlots")) {
                companionAdsService.setRefreshUnfilledSlots(
                    serviceConfig.refreshUnfilledSlots
                );
            }
        }
    }
    getUserViewableThresholdValues() {
        return this.props.viewableThresholdValues;
    }
    getSlotSize(name, viewport) {
        const {
            slotSize: origSlotSize,
            sizeMapping: origSizeMapping,
        } = this.props;
        let slotSize;
        if (origSlotSize) {
            slotSize = origSlotSize;
        } else if (origSizeMapping) {
            const sizeMapping = origSizeMapping;
            slotSize = sizeMapping[0] && sizeMapping[0].slot;

        var ads = [
        {name: 'topFullWidthFlex', sizes: [
            [300, 250], 
            [728, 90], 
            [[970, 250], [728, 90]]
        ]},
        {name: 'flexbillboard_1', sizes: [
            [300, 250], 
            [728, 90], 
            [[970, 250], [970, 90], [728, 90]]
        ]},
        {name: 'flexbillboard_2', sizes: [
            [300, 250], 
            [728, 90], 
            [[970, 250], [970, 90], [728, 90]]
        ]},
        {name: 'flexbillboard_3', sizes: [
            [300, 250], 
            [728, 90], 
            [[970, 250], [970, 90], [728, 90]]
        ]},
        {name: 'flexbillboard', sizes: [
            [300, 250], 
            [728, 90], 
            [[970, 250], [970, 90], [728, 90]]
        ]},
        {name: 'heroFixedleaderboard', sizes: [
            [300, 250], 
            [300, 250], 
            [[970, 90], [728, 90]]
        ]},
        {name: 'topFlexRectangle', sizes: [
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]]
        ]},
        {name: 'flexiblehalfpage', sizes: [
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]]
        ]},
        {name: 'flexiblehalfpage_1', sizes: [
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]]
        ]},
        {name: 'flexiblehalfpage_2', sizes: [
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]], 
            [[300, 600], [300, 250]]
        ]},
        {name: 'mobileInBodyIMU', sizes: [
            [300, 250], 
            [300, 250], 
            [300, 250]
        ]},
        {name: 'btwnBillboard', sizes: [
            [], 
            [728, 90], 
            [[970, 250], [970, 90], [728, 90]]
            ]},
        {name: 'btwnIMU', sizes: [
            [300, 250], 
            [300, 250], 
            [300, 250]
        ]},
        {name: 'adhesiveBanner', sizes: [
            [320, 50], 
            [320, 50], 
            [320, 50]
        ]},
        {name: 'leftRailTopVideoIMU', sizes: [
            [300, 250], 
            [300, 250], 
            [300, 250]
        ]},
        {name: 'stickyFlexRectangle', sizes: [
            [300, 250], 
            [300, 250], 
            [300, 250]
        ]},
        {name: 'leftRailTopIMU', sizes: [
            [300, 250], 
            [300, 250], 
            [300, 250]
        ]}
        ];

        ads.map((ad, i)=>{
            if  (ad.name.indexOf(name) !== -1){
                slotSize = ad.sizes[viewport]   
                // console.log('slot Size func🌀', slotSize, name)
            }
        })
        
        return slotSize
            // For internal use, inc defines it with 0, 0 first
        // if (useSecondary) {
        //         slotSize = sizeMapping[1] && sizeMapping[1].slot;
        //     }
        // }

        // return slotSize;
        }
    }

    addMoatYieldReadyFunc(adSlot) {
        // console.log("adding moat yield ready");
        let self = this;
        window.top["moatYieldReady"] = function () {
            // console.log("moat yeild ready!", adSlot);
            // Run moat call here
            self.callMoatPrebidAnalytics(adSlot);
        };
    }

    callMoatPrebidAnalytics(adSlot) {
        // new :
        if (
            window.top.moatPrebidApi &&
            typeof window.top.moatPrebidApi.enableLogging === "function"
        ) {
            window.top.moatPrebidApi.enableLogging();
            // console.log("moat prebid api logging enabled");
        }

        var interval;
        var counter = 0;
        function setTargetingIfMoatLoaded() {
            // console.log('counter', counter);
            if (
                window.moatPrebidApi &&
                typeof window.moatPrebidApi.slotDataAvailable === "function" &&
                window.moatPrebidApi.slotDataAvailable()
            ) {
                window.moatPrebidApi.setMoatTargetingForSlot(adSlot);
                // window.moatPrebidApi.setMoatTargetingForAllSlots();
                clearInterval(interval);
            } else {
                // Moat tag hasn’t fully rendered yet, or slot data is not available for this URL
                if (counter >= 30) {
                    clearInterval(interval);
                    return false;
                }
                counter++;
                return false;
            }
        }

        interval = setInterval(setTargetingIfMoatLoaded, 50);

        // old :
        // if (
        //     window.top.moatPrebidApi &&
        //     typeof window.top.moatPrebidApi.enableLogging === "function"
        // ) {
        //     window.top.moatPrebidApi.enableLogging();
        //     // console.log("moat prebid api logging enabled");
        // }
        // if (
        //     window.top.moatPrebidApi &&
        //     typeof window.top.moatPrebidApi.slotDataAvailable === "function" &&
        //     window.top.moatPrebidApi.slotDataAvailable()
        // ) {
        //     // console.log("set moat targeting for slot", adSlot);
        //     window.top.moatPrebidApi.setMoatTargetingForSlot(adSlot);
        //     // this.display();
        // } else {
        //     // console.log("// Moat tag hasn’t fully rendered yet, or slot data is not available for this URL.");
        //     // this.display();
        // }
    }

    renderAd() {
        // console.log("render ad");
        this.defineSlot();
        // this.display();
        // Wrap in try catch to prevent site from crashing.
        try {
            this.display();
        } catch (err) {
            console.log("display error", err);
        }
    }

    notInViewport(props = this.props, state = this.state) {
        const { inViewport } = state;
        return this.getRenderWhenViewable(props) && !inViewport;
    }

    defineSlot() {
        const { adUnitPath, outOfPage, npa } = this.props;
        const divId = this._divId;
        var slotSize;
         if (this.props.prebidConf){
            // console.log('ttype', this.props.type, this.props.prebidConf.viewport, this.props);
            slotSize = this.getSlotSize(this.props.type, this.props.prebidConf.viewport);
        } else {
            // console.log('type', this.props.type, this.props);
            slotSize = this.getSlotSize();
        }
        // console.log('DEFINESLOT', 'divId', divId, 'slotsize', slotSize, 'aduunitpath', adUnitPath);

        this.handleSetNpaFlag(npa);
        if (!this._adSlot) {
            // console.log('💀 DEFINESLOT: no ad slot case', divId, slotSize, adUnitPath)
            if (outOfPage) {
                this._adSlot = Bling._adManager.googletag.defineOutOfPageSlot(
                    adUnitPath,
                    divId
                );
            } else {
                this._adSlot = Bling._adManager.googletag.defineSlot(
                    adUnitPath,
                    slotSize || [],
                    divId
                );
                // console.log('👀 DEFINESLOT: slot defined manually', this._adSlot)
            }
        }
        this.configureSlot(this._adSlot);
    }

    configureSlot(adSlot, props = this.props) {
        // console.log("CONFIGURESLOT adSlot", adSlot);
        const {
            sizeMapping,
            attributes,
            targeting,
            companionAdService,
            categoryExclusion,
            collapseEmptyDiv,
            safeFrameConfig,
            content,
            clickUrl,
            forceSafeFrame,
        } = props;

        this.defineSizeMapping(adSlot, sizeMapping);

        if (collapseEmptyDiv !== undefined) {
            // console.log('CONFIGURESLOT: collapseEmptyDiv value', collapseEmptyDiv)
            if (Array.isArray(collapseEmptyDiv)) {
                adSlot.setCollapseEmptyDiv.call(adSlot, ...collapseEmptyDiv);
            } else {
                adSlot.setCollapseEmptyDiv(collapseEmptyDiv);
            }
        }

        // Overrides click url
        if (clickUrl) {
            adSlot.setClickUrl(clickUrl);
        }

        // Sets category exclusion
        if (categoryExclusion) {
            let exclusion = categoryExclusion;
            if (typeof exclusion === "string") {
                exclusion = [exclusion];
            }
            adSlot.clearCategoryExclusions();
            exclusion.forEach((item) => {
                adSlot.setCategoryExclusion(item);
            });
        }

        // Sets AdSense attributes
        this.setAttributes(adSlot, attributes);

        // Sets custom targeting parameters
        this.setTargeting(adSlot, targeting);

        if (safeFrameConfig) {
            adSlot.setSafeFrameConfig(safeFrameConfig);
        }

        if (forceSafeFrame) {
            adSlot.setForceSafeFrame(forceSafeFrame);
        }

        // Enables companion ad service
        if (companionAdService) {
            this.addCompanionAdService(companionAdService, adSlot);
        }

        // GPT checks if the same service is already added.
        if (content) {
            adSlot.addService(Bling._adManager.googletag.content());
        } else {
            adSlot.addService(Bling._adManager.googletag.pubads());
        }

        // CALL MOAT AFTER SLOT HAS BEEN DEFINED
        // if (typeof window.top.moatYieldReady !== "function" && this.props.abgroup === 20) {
        if (typeof window.top.moatYieldReady !== "function") {
            // add moat yeild then call moat
            this.addMoatYieldReadyFunc(adSlot);
        } else {
            // console.log("moat yield ready already defined");
            // immediately run moat call
            this.callMoatPrebidAnalytics(adSlot);
        }
    }

    floorPrice(day, floorConf) {
        if (!floorConf.floor) {
            return 0.25;
        }
        // Sunday
        if (day === 0) {
            return floorConf.floor.sunday || floorConf.floor;
        }
        // Monday
        if (day === 1) {
            return floorConf.floor.monday || floorConf.floor;
        }
        // Tuesday
        if (day === 2) {
            return floorConf.floor.tuesday || floorConf.floor;
        }
        // Wednesday
        if (day === 3) {
            return floorConf.floor.wednesday || floorConf.floor;
        }
        // Thursday
        if (day === 4) {
            return floorConf.floor.thursday || floorConf.floor;
        }
        // Friday
        if (day === 5) {
            return floorConf.floor.friday || floorConf.floor;
        }
        // Saturday
        if (day === 6) {
            return floorConf.floor.saturday || floorConf.floor;
        }
        return 0.25;
    }

    display() {
        let domain = window.top.location.origin;
        const { content, adUnitPath, type } = this.props;
        const divId = this._divId;
        const adSlot = this._adSlot;
        const self = this;

        if (content) {
                Bling._adManager.googletag.content().setContent(adSlot, content);
                Bling._adManager.googletag.display(divId);
                return;
        } else {
            if (
                !Bling._adManager._disableInitialLoad &&
                !Bling._adManager._syncCorrelator
            ) {
                // Bling._adManager.updateCorrelator();
            }

            // PBJS configs
            const prebidConf = this.props.prebidConf;

            if (prebidConf) {
                // console.log('is load disabled?:', Bling._adManager._disableInitialLoad)

                let requestManager = {
                    adserverRequestSent: false,
                    aps: false,
                    prebid: false,
                };
                const PREBID_TIMEOUT = prebidConf.timeout;
                const priceBucket = prebidConf.priceBuckets;
                const floorConf = prebidConf.floorPrices;
                const floor = this.floorPrice(new Date().getDay(), floorConf);
                const prebidAnalytics = prebidConf.analytics;
                const pbjs = window.pbjs || {};
                const apstag = window.apstag || {};
                pbjs.que = pbjs.que || [];
                var slotSize = this.getSlotSize(this.props.type, prebidConf.viewport);
                // console.log('prebid slot size', slotSize, divId, adUnitPath, adSlot, 'prebid bidparams', prebidConf.bidParams);
                // Set config
                pbjs.setConfig({
                    bidderTimeout: PREBID_TIMEOUT,
                    timeoutBuffer: 350,
                    enableSendAllBids: true,
                    useBidCache: true,
                    publisherDomain: domain,
                    priceGranularity: priceBucket,
                    targetingControls: {
                        alwaysIncludeDeals: true,
                    },
                    userSync: {
                        filterSettings: {
                            iframe: {
                                bidders: "*", // '*' means all bidders
                                filter: "include",
                            },
                            image: {
                                bidders: "*",
                                filter: "include",
                            },
                        },
                        syncEnabled: true,
                        syncsPerBidder: 4,
                        syncDelay: 2000,
                    },
                    consentManagement: {
                        gdpr: {
                            cmpApi: "iab",
                            allowAuctionWithoutConsent: true, // suppress auctions if there's no GDPR consent string
                            timeout: PREBID_TIMEOUT, // GDPR timeout
                        },
                        usp: {
                            cmpApi: "iab",
                            timeout: 100, // US Privacy timeout 100ms
                        },
                    },
                });

                // console.log('googletag \n',Bling._adManager.googletag,
                // 'admanager \n', Bling._adManager,
                // 'pubads \n', Bling._adManager.googletag.pubads(),
                // 'refresh \n', Bling._adManager.refresh,
                // 'initial load \n', Bling._adManager._disableInitialLoad)
                // AD is paused
                // console.log('intial load disabled1 ', Bling._adManager.googletag.pubads().isInitialLoadDisabled(), Bling._adManager.googletag.pubads());

                // Define pbjs unit
                const adUnits = [
                    {
                        code: divId,
                        mediaTypes: {
                            banner: {
                                sizes: slotSize,
                            },
                        },
                        bids: prebidConf.bidParams,
                    },
                ];

                // REQUEST HEADER BIDS
                var requestHeaderBids = function requestHeaderBids() {
                    pbjs.adserverRequestSent = true;

                    apstag.fetchBids(
                        {
                            slots: [
                                {
                                    slotID: divId,
                                    slotName: adUnitPath, // may have to delete slash that begins adunitpath
                                    sizes: slotSize,
                                },
                            ],
                        },
                        function (bids) {
                            Bling._adManager.googletag.cmd.push(function () {
                                apstag.setDisplayBids();
                                requestManager.aps = true; // signals that APS request has completed
                            });
                        }
                    );

                    pbjs.que.push(function () {
                        pbjs.addAdUnits(adUnits);
                        pbjs.aliasBidder("appnexus", "pangaea");
                        pbjs.requestBids({
                            bidsBackHandler: biddersBack,
                        });
                        requestManager.prebid = true;
                    });
                };

                // BIDDERS BACK
                var biddersBack = function biddersBack() {
                    if (requestManager.aps && requestManager.prebid) {
                        Bling._adManager.googletag.cmd.push(function () {
                            // pbjs.que.push(function () {
                            if (prebidAnalytics && prebidAnalytics.rubicon) {
                                pbjs.enableAnalytics({
                                    provider: "rubicon",
                                    options: {
                                        accountId: prebidAnalytics.rubicon,
                                        endpoint:
                                            "https://prebid-a.rubiconproject.com/event",
                                        samplingFactor: 1,
                                    },
                                });
                            }

                            if (pbjs.getHighestCpmBids(divId).length) {
                                var highestBid = pbjs.getHighestCpmBids(
                                    divId
                                )[0].cpm;
                                highestBid = parseFloat(highestBid);
                                if (highestBid >= floor) {
                                    pbjs.setTargetingForGPTAsync([divId]);
                                } else {
                                    pbjs.setTargetingForGPTAsync([divId]);
                                    var hbpbValue = adSlot.getTargeting(
                                        "hb_pb"
                                    );
                                    adSlot.setTargeting(
                                        "hb_pb",
                                        hbpbValue + "x"
                                    );
                                }
                            }

                                if (pbjs.getAllPrebidWinningBids().length){
                                    console.log('we have some winners', pbjs.getAllPrebidWinningBids(), pbjs.getAllPrebidWinningBids()[0].adId, window)
                                    // pbjs.renderAd(divId, `${pbjs.getAllPrebidWinningBids()[0].adId}`);
                                }
                                    Bling._adManager.googletag.display(divId); 
                                    self.refresh();
                                    pbjs.removeAdUnit(divId);
                                    pbjs.adserverRequestSent = false;
                                    adSlot.clearTargeting();
                                    return;
                        });
                    }
                };
                setTimeout(() => {
                    requestHeaderBids();
                });
            } else {
                // console.log('no prebid Conf', divId);
                // setTimeout(function () {
                    Bling._adManager.googletag.display(divId);
                    self.refresh();
                    return;
                // });
            }
        }
    }

    clear() {
        const adSlot = this._adSlot;
        if (adSlot && adSlot.hasOwnProperty("getServices")) {
            // googletag.ContentService doesn't clear content
            const services = adSlot.getServices();
            if (this._divId && services.some((s) => !!s.setContent)) {
                document.getElementById(this._divId).innerHTML = "";
                return;
            }
            Bling._adManager.clear([adSlot]);
        }
    }

    refresh(options) {
        const adSlot = this._adSlot;
        if (adSlot) {
            this.clear();
            Bling._adManager.refresh([adSlot], options);
        }
    }

    render() {
        const { scriptLoaded } = this.state;
        const { id, outOfPage, style } = this.props;
        const shouldNotRender = this.notInViewport(this.props, this.state);
        var slotSize;
        if (!scriptLoaded || shouldNotRender) {
            
            if (this.props.prebidConf) {
                slotSize = this.getSlotSize(
                    this.props.type,
                    this.props.prebidConf.viewport
                );
            } else {
                slotSize = this.getSlotSize();
            }

            if (!outOfPage) {
                invariant(
                    slotSize,
                    "Either 'slotSize' or 'sizeMapping' prop needs to be set."
                );
            }

            if (Array.isArray(slotSize) && Array.isArray(slotSize[0])) {
                slotSize = slotSize[0];
            }
            // https://developers.google.com/doubleclick-gpt/reference?hl=en#googletag.NamedSize
            if (
                slotSize === "fluid" ||
                (Array.isArray(slotSize) && slotSize[0] === "fluid")
            ) {
                slotSize = ["auto", "auto"];
            }

            const emptyStyle = slotSize && {
                width: slotSize[0],
                height: slotSize[1],
            };
            // render node element instead of script element so that `inViewport` check works.
            return <div style={emptyStyle}></div>;
        }

        // clear the current ad if exists
        this.clear();
        if (this._adSlot) {
            Bling._adManager.googletag.destroySlots([this._adSlot]);
            this._adSlot = null;
        }
        this._divId = id || Bling._adManager.generateDivId();

        return <div id={this._divId} style={style} />;
    }

    /**
     * Call pubads and set the non-personalized Ads flag, if it is not undefined.
     *
     * @param {boolean} npa
     */
    handleSetNpaFlag(npa) {
        if (npa === undefined) {
            return;
        }

        Bling._adManager.pubadsProxy({
            method: "setRequestNonPersonalizedAds",
            args: [npa ? 1 : 0],
            resolve: null,
            reject: null,
        });
    }
}

// proxy pubads API through Bling
export default hoistStatics(
    Bling,
    pubadsAPI.reduce((api, method) => {
        api[method] = (...args) =>
            Bling._adManager.pubadsProxy({ method, args });
        return api;
    }, {})
);
