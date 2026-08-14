/**
 * Canonical ad event type names.
 * @type {{
 *   readonly AD_STARTED: 'adStarted',
 *   readonly AD_DISPLAYED: 'adDisplayed',
 *   readonly AD_COMPLETED: 'adCompleted',
 *   readonly AD_ERROR: 'adError',
 *   readonly AD_FREE_POD: 'adFreePod',
 *   readonly AD_FETCH_COMPLETED: 'adFetchCompleted',
 *   readonly NO_ADS_AVAILABLE: 'noAdsAvailable',
 *   readonly OPT_IN: 'optIn',
 *   readonly OPT_OUT: 'optOut',
 *   readonly SKIP_CARD_SHOWN: 'skipCardShown',
 *   readonly USER_CANCEL: 'userCancel',
 *   readonly USER_CANCEL_STREAM: 'userCancelStream',
 *   readonly XTENDED_VIEW_STARTED: 'xtendedViewStarted',
 *   readonly POPUP_WEBSITE: 'popupWebsite',
 *   readonly VIDEO_EVENT: 'videoEvent',
 * }}
 */
export const TruexAdEventType = {
    AD_STARTED           : 'adStarted',
    AD_DISPLAYED         : 'adDisplayed',
    AD_COMPLETED         : 'adCompleted',
    AD_ERROR             : 'adError',
    AD_FREE_POD          : 'adFreePod',
    AD_FETCH_COMPLETED   : 'adFetchCompleted',
    NO_ADS_AVAILABLE     : 'noAdsAvailable',
    OPT_IN               : 'optIn',
    OPT_OUT              : 'optOut',
    SKIP_CARD_SHOWN      : 'skipCardShown',
    USER_CANCEL          : 'userCancel',
    USER_CANCEL_STREAM   : 'userCancelStream',
    XTENDED_VIEW_STARTED : 'xtendedViewStarted',
    POPUP_WEBSITE        : 'popupWebsite',
    VIDEO_EVENT          : 'videoEvent',
};

export const adEvents = {
    adStarted          : TruexAdEventType.AD_STARTED,
    adDisplayed        : TruexAdEventType.AD_DISPLAYED,
    adCompleted        : TruexAdEventType.AD_COMPLETED,
    adError            : TruexAdEventType.AD_ERROR,
    noAdsAvailable     : TruexAdEventType.NO_ADS_AVAILABLE,
    adFreePod          : TruexAdEventType.AD_FREE_POD,
    adFetchCompleted   : TruexAdEventType.AD_FETCH_COMPLETED,
    userCancelStream   : TruexAdEventType.USER_CANCEL_STREAM,
    optIn              : TruexAdEventType.OPT_IN,
    optOut             : TruexAdEventType.OPT_OUT,
    skipCardShown      : TruexAdEventType.SKIP_CARD_SHOWN,
    userCancel         : TruexAdEventType.USER_CANCEL,
    videoEvent         : TruexAdEventType.VIDEO_EVENT,
    xtendedViewStarted : TruexAdEventType.XTENDED_VIEW_STARTED,
    popupWebsite       : TruexAdEventType.POPUP_WEBSITE,
};

export default adEvents;
