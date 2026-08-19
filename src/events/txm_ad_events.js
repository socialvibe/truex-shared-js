/**
 * Canonical TruexAdRenderer ad event type names (`event.type` from `subscribe`).
 *
 * Terminal events: `adCompleted`, `userCancelStream`, `noAdsAvailable`, `adError`.
 * `adFreePod` is not terminal — record it and wait for a terminal event before resuming playback.
 *
 * @see {@link https://github.com/socialvibe/infillion-ads-integration-docs/blob/master/docs/platforms/web/index.md#truexadrenderer-ad-events}
 */
export const TruexAdEventType = Object.freeze({
    /**
     * Fires after `start` when the TrueX UI is being constructed and connected to the page.
     * Host apps can use a missing `adStarted` as a load timeout and fall back to linear ads.
     */
    AD_STARTED: 'adStarted',
    /**
     * Fires once the TrueX UI is loaded and visible (image assets ready).
     * Useful if the host app shows its own loading indicator and needs to hide it without a flash.
     */
    AD_DISPLAYED: 'adDisplayed',
    /**
     * Terminal. The TrueX unit is finished; resume playback and tear down the renderer.
     * Examples: user opts for linear ads, choice-card timeout, engagement completed, skip card finished.
     * Payload: `timeSpent` — seconds the user spent on the TrueX unit.
     */
    AD_COMPLETED: 'adCompleted',
    /**
     * Terminal. Unrecoverable renderer error; handle like `adCompleted`.
     * Payload: `errorMessage` — description of the cause.
     */
    AD_ERROR: 'adError',
    /**
     * User earned a TrueX credit. Do not resume yet — wait for a terminal event.
     * If this fired before the terminal event, skip the rest of the current ad pod;
     * otherwise resume linear ads.
     */
    AD_FREE_POD: 'adFreePod',
    /**
     * Fires when `init`'s ad request succeeds and the ad is ready to present.
     * Use for a pre-roll loading screen or a mid-roll preload timeout before calling `start`.
     */
    AD_FETCH_COMPLETED: 'adFetchCompleted',
    /**
     * Terminal. No TrueX ads available for this user; handle like `adCompleted`.
     */
    NO_ADS_AVAILABLE: 'noAdsAvailable',
    /**
     * Informative. User chose the interactive ad.
     * May fire more than once if they opt in and then back out.
     */
    OPT_IN: 'optIn',
    /**
     * Informative. User chose (or timed out into) a linear video ad.
     * Payload: `userInitiated` — `true` if they selected it, `false` if the choice-card countdown expired.
     */
    OPT_OUT: 'optOut',
    /**
     * Informative. A skip card is shown after a completed TrueX Sponsored Stream in an earlier pre-roll.
     */
    SKIP_CARD_SHOWN: 'skipCardShown',
    /**
     * Informative. User backed out of the engagement after opt-in (confirm "choose a different ad experience").
     * They return to the choice card with a full countdown; further `optIn` / `optOut` may follow.
     */
    USER_CANCEL: 'userCancel',
    /**
     * Terminal. User intends to leave the stream entirely (only if `supportsUserCancelStream` is true).
     * Treat like any other in-stream exit (typically back to episode/series detail).
     * If that option is off, the renderer emits `adCompleted` instead.
     */
    USER_CANCEL_STREAM: 'userCancelStream',
    /**
     * Informative. Creative is playing its own built-in extended fallback video.
     * Host app keeps the normal event flow; no extra action.
     */
    XTENDED_VIEW_STARTED: 'xtendedViewStarted',
    /**
     * Mobile: user clicked an external site link (e.g. Learn More). The host app must open the page.
     * Payload: `url` — page to navigate to.
     */
    POPUP_WEBSITE: 'popupWebsite',
    /**
     * Informative. Noteworthy video progress inside the TrueX unit.
     * Payload: `subType` (`started` | `firstQuartile` | `secondQuartile` | `thirdQuartile` | `completed`),
     * `videoName`, `url` when available.
     */
    VIDEO_EVENT: 'videoEvent',
});

/**
 * @deprecated use {@link TruexAdEventType} instead
 */
export const adEvents = Object.freeze({
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
});

export default adEvents;
