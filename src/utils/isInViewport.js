export default function isInViewport(el, [width, height] = [0, 0], offset = 0, viewableThresholdValues) {
    if (!el || el.nodeType !== 1) {
        return false;
    }
    const clientRect = el.getBoundingClientRect();
    if (!viewableThresholdValues) {
        viewableThresholdValues = {
            userViewport: 'desktop',
            mobileValue: 500,
            desktopValue: 500
        };
    }
    const { userViewport, mobileValue, desktopValue } = viewableThresholdValues;
    const preLoadOffset = (userViewport && userViewport === 'mobile') ? mobileValue : desktopValue;
    const rect = {
        top: clientRect.top - preLoadOffset,
        left: clientRect.left,
        bottom: clientRect.bottom,
        right: clientRect.right
    };
    const viewport = {
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth
    };
    const inViewport =
        rect.bottom >= viewport.top + height * offset &&
        rect.right >= viewport.left + width * offset &&
        rect.top <= viewport.bottom - height * offset &&
        rect.left <= viewport.right - width * offset;
    return inViewport;
}
