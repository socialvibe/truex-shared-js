/**
 * BlueScript layout JSON (creative `asset_args.layout` / unwrapped `asset_args`).
 *
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md}
 */

export type BluescriptJson =
    | string
    | number
    | boolean
    | null
    | BluescriptJson[]
    | { [key: string]: BluescriptJson };

/** Literal or expression value used in BlueScript actions. */
export type BluescriptValue = BluescriptJson;

/**
 * Top-level BlueScript layout.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#top-level-syntax}
 */
export type LayoutJson = {
    steps: BluescriptStep[];
};

/**
 * A single screen (card). No two steps are presented at once.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#step}
 */
export type BluescriptStep = {
    /** Name of the step; used to identify it for navigation. */
    name: string;
    /** Optional comment about this step. */
    __comment__?: string;
    /** Visual elements of this step. First element is drawn on top. */
    elements: BluescriptElement[];
    /** Event handlers keyed by element name. */
    behaviors?: BluescriptBehaviors;
    /** Named functions invoked from behaviors or other functions. */
    functions?: BluescriptFunctions;
};

/**
 * Map of element name → event handlers for that element.
 */
export type BluescriptBehaviors = Record<string, BluescriptBehavior>;

/**
 * Event name → actions to run.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#behavior-events}
 */
export type BluescriptBehavior = Partial<Record<BluescriptBehaviorTrigger, BluescriptBehaviorAction[]>>;

/**
 * Named function body: a list of actions.
 */
export type BluescriptFunction = BluescriptBehaviorAction[];

/**
 * Map of function name → actions.
 */
export type BluescriptFunctions = Record<string, BluescriptFunction>;

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#behavior-events}
 */
export type BluescriptBehaviorTrigger =
    | 'appear'
    | 'disappear'
    | 'onSelect'
    | 'onFocusGained'
    | 'onFocusLost'
    | 'timerTick'
    | 'videoStarted'
    | 'videoFirstQuartile'
    | 'videoSecondQuartile'
    | 'videoThirdQuartile'
    | 'videoNearCompleted'
    | 'videoCompleted'
    | 'videoLooped'
    | 'videoDidEnterFullscreen'
    | 'videoDidExitFullscreen';

export type BluescriptNumber = number | string;

/**
 * Fields shared by visual BlueScript elements.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#elements}
 */
export type BluescriptElementBase = {
    /** Name of the element; used to identify it for behaviors. */
    name: string;
    /** Screen-space X position; x=0 is the left of the (assumed 1080p) screen. Default 0. */
    x?: BluescriptNumber;
    /** Screen-space Y position; y=0 is the top of the screen. Default 0. */
    y?: BluescriptNumber;
    /** Width on screen. If 0, computed from visual content. Default 0. */
    width?: BluescriptNumber;
    /** Height on screen. If 0, computed from visual content. Default 0. */
    height?: BluescriptNumber;
    /** Opacity in [0, 1]; 0 is fully transparent, 1 is fully opaque. Default 1. */
    opacity?: number;
};

export type BluescriptFocusable = {
    /** Whether the element can take remote/keyboard focus. */
    focusable?: boolean;
    /** Element name to focus when left is pressed. */
    leftFocus?: string;
    /** Element name to focus when right is pressed. */
    rightFocus?: string;
    /** Element name to focus when up is pressed. */
    upFocus?: string;
    /** Element name to focus when down is pressed. */
    downFocus?: string;
    /** If true, this element is focused by default when the step appears. */
    autoFocus?: boolean;
    /** Alternate default-focus flag seen on some layouts. */
    can_be_focused_by_default?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#rectangle}
 */
export type BluescriptElementRectangle = BluescriptElementBase & {
    type: 'Rectangle';
    /** RGBA color drawn in the rectangle region. Default 0xFFFFFFFF. */
    color?: string;
    /** Whether the rectangle is alpha-blended with nodes behind it. Default true. */
    blendingEnabled?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#image}
 */
export type BluescriptElementImage = BluescriptElementBase & {
    type: 'Image';
    /** URI of the image file. */
    image_url: string;
    /** Use the image's native resolution on memory-constrained Roku devices. Default false. */
    forceHighResolution?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#video}
 */
export type BluescriptElementVideo = BluescriptElementBase & BluescriptFocusable & {
    type: 'Video';
    /** URI of the video file (MP4). */
    video_url?: string;
    /** Restart from the beginning when the end is reached. Default true. */
    loop?: boolean;
    /** Start playback when the card is displayed. Default true. */
    autoplay?: boolean;
    /** Make the player focusable on playback completion for replay. Default false. */
    replayable?: boolean;
    /** Mute video audio. Default false. */
    mute?: boolean;
    /** Animate the video to fullscreen size. Default false. */
    fullscreen?: boolean;
    /** Seconds to animate between window and fullscreen. Must be > 0. Default 0.35. */
    zoomAnimationDuration?: number;
    /** Animation curve name (Roku Animation easeFunction). Default inOutCubic. */
    easeFunction?: string;
    /** Current stream time in seconds. */
    currentTime?: number;
    /** Tracking name used instead of the URI. */
    trackingName?: string;
    /** Static image overlay after playback completion. */
    preview_image_url?: string;
    /** If true, ignore video_url and use ad-parameter video_n rotation. Default false. */
    useRotation?: boolean;
    /** Opacity of the static video image overlay. */
    staticVideoImageOpacity?: number;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#text}
 */
export type BluescriptElementText = BluescriptElementBase & {
    type: 'Text';
    /** Text string to render. */
    text?: string;
    /** Text color (HTML / rgb / hex). Default 0xddddddff. */
    color?: string;
    /** Background color covering the calculated width and height. Default 0x00000000. */
    backgroundColor?: string;
    /** Roku font name (system or shipped TTF/OTF). */
    fontName?: string;
    /** Font size in points. Requires fontName. Default 24. */
    font_size?: number;
    /** Fully qualified URL of an OTF/TTF font asset. */
    font_url?: string;
    /** Horizontal alignment. Default center. */
    alignment?: 'left' | 'center' | 'right';
    /** Vertical alignment. Default top. */
    vertical_alignment?: 'top' | 'center' | 'bottom';
    /** Break text over multiple lines. Default true. */
    wrap?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#button}
 */
export type BluescriptElementButton = BluescriptElementBase & BluescriptFocusable & {
    type: 'Button';
    /** URI of the button image. */
    image_url: string;
    /** URI of the focused-state image. */
    hover_image_url?: string;
    /** URI of the enabled/checked-state image. */
    checked_image_url?: string;
    /** URI of the focused image when used as a toggle. */
    hover_checked_image_url?: string;
    /** Whether this toggle button is on by default. Default false. */
    checked?: boolean;
    /** Grow the button on focus instead of swapping to hover_image_url. Default true. */
    hover_effect?: boolean;
    /** Scale factor applied on hover when hover_effect is true. Default 1.1. */
    hover_scale?: number;
    /** Use native resolution on memory-constrained Roku devices. Default false. */
    forceHighResolution?: boolean;
    /** Inline behaviors on the element (in addition to step-level `behaviors`). */
    behavior?: BluescriptBehavior;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#audio}
 */
export type BluescriptElementAudio = {
    type: 'Audio';
    /** Name of the element; used to identify it for behaviors. */
    name: string;
    /** URI of the audio file (MP3; engines may fall back to MP4). */
    audio_url: string;
    /** Restart from the beginning when the end is reached. Default true. */
    loop?: boolean;
    /** Start playback when the card is displayed. Default true. */
    autoplay?: boolean;
    /** If true, audio continues across step transitions. Default false. */
    global?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#qrcode}
 */
export type BluescriptElementQRCode = BluescriptElementBase & {
    type: 'QRCode';
    /** Information encoded in the QR image; also the fallback URL when tagLabel has no click tag. */
    url?: string;
    /** Native size in pixels of the returned QR image. */
    size?: BluescriptNumber;
    /** Margin in QR matrix dots. Default 4. */
    margin?: BluescriptNumber;
    /** Color of QR dots. Default 0xddddddff. */
    color?: string;
    /** Background color. Default 0x00000000. */
    backgroundColor?: string;
    /** Pass the final URL through the minify service. Default false. */
    minify?: boolean | string;
    /** Tag-manager label (trigger qr_code). When set, `url` is ignored if a matching click tag exists. */
    tagLabel?: string;
};

export type BluescriptElement =
    | BluescriptElementRectangle
    | BluescriptElementImage
    | BluescriptElementVideo
    | BluescriptElementText
    | BluescriptElementButton
    | BluescriptElementAudio
    | BluescriptElementQRCode;

export type BluescriptBehaviorAction =
    | BluescriptBehaviorActionAllDoneButtonPushed
    | BluescriptBehaviorActionAnimateElement
    | BluescriptBehaviorActionAssign
    | BluescriptBehaviorActionBreak
    | BluescriptBehaviorActionBringToFront
    | BluescriptBehaviorActionDebugLog
    | BluescriptBehaviorActionDisableUserInput
    | BluescriptBehaviorActionDisableUserNavigation
    | BluescriptBehaviorActionEnableUserInput
    | BluescriptBehaviorActionEnableUserNavigation
    | BluescriptBehaviorActionFlagActivityForAttention
    | BluescriptBehaviorActionFlagActivityForCredit
    | BluescriptBehaviorActionFocusElement
    | BluescriptBehaviorActionFor
    | BluescriptBehaviorActionIf
    | BluescriptBehaviorActionInvoke
    | BluescriptBehaviorActionMakeWebRequest
    | BluescriptBehaviorActionPauseActiveAudio
    | BluescriptBehaviorActionPauseVideo
    | BluescriptBehaviorActionPlayActiveAudio
    | BluescriptBehaviorActionPlaySoundEffect
    | BluescriptBehaviorActionPlayVideo
    | BluescriptBehaviorActionPopStep
    | BluescriptBehaviorActionReplaceStep
    | BluescriptBehaviorActionResetActiveAudio
    | BluescriptBehaviorActionResetFocus
    | BluescriptBehaviorActionResetVideo
    | BluescriptBehaviorActionReturn
    | BluescriptBehaviorActionSetAttribute
    | BluescriptBehaviorActionSetBounds
    | BluescriptBehaviorActionSetTimeout
    | BluescriptBehaviorActionShowStep
    | BluescriptBehaviorActionStopAllTimers
    | BluescriptBehaviorActionStopActiveAudio
    | BluescriptBehaviorActionStopVideo
    | BluescriptBehaviorActionTrackCustomEvent;

/**
 * Triggers the Return to Content button, exiting the ad flow for a completed ad.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#alldonebuttonpushed}
 */
export type BluescriptBehaviorActionAllDoneButtonPushed = {
    host: 'allDoneButtonPushed';
};

/**
 * Animates element attributes from their current values.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#animateelement}
 */
export type BluescriptBehaviorActionAnimateElement = {
    host: 'animateElement';
    /** Name of the element to animate. */
    name?: string;
    /** Attributes to animate (x, y, width, height, opacity; position and size are legacy). */
    attributes: {
        x?: BluescriptNumber;
        y?: BluescriptNumber;
        width?: BluescriptNumber;
        height?: BluescriptNumber;
        opacity?: number;
        position?: BluescriptValue;
        size?: BluescriptValue;
    };
    /** Length of the animation in seconds. Default 0.35. */
    duration?: number;
    /** How values evolve over the duration. Default outCubic. */
    easeFunction?: string;
    /** Roku only: whether the animation can be skipped on stressed low-end devices. Default false. */
    optional?: boolean;
};

/**
 * Assigns a global (`key`) or local (`local`) variable. One of key or local is required.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#assign}
 */
export type BluescriptBehaviorActionAssign = {
    host: 'assign';
    /** Global variable name; dot-separated path into objects/arrays. May be an expression. */
    key?: BluescriptValue;
    /** Local variable name. Either `key` or `local` must be specified. */
    local?: string;
    /** Value to assign; may be an expression. */
    value: BluescriptValue;
};

/**
 * Exits the current `for` loop.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#break}
 */
export type BluescriptBehaviorActionBreak = {
    host: 'break';
};

/**
 * Draws the named element on top of all other displayed elements.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#bringtofront}
 */
export type BluescriptBehaviorActionBringToFront = {
    host: 'bringToFront';
    /** Name of the element to bring to the front. */
    name: string;
};

/**
 * Prints a log message (BrightScript terminal on Roku, console on HTML5).
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#debuglog}
 */
export type BluescriptBehaviorActionDebugLog = {
    host: 'debugLog';
    /** Value to print; may be an expression. Cast to string. */
    value: BluescriptValue;
};

/**
 * Prevent user input from being handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#disableuserinput}
 */
export type BluescriptBehaviorActionDisableUserInput = {
    host: 'disableUserInput';
};

/**
 * Prevent user directional input from being handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#disableusernavigation}
 */
export type BluescriptBehaviorActionDisableUserNavigation = {
    host: 'disableUserNavigation';
};

/**
 * Allow user input to be handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#enableuserinput}
 */
export type BluescriptBehaviorActionEnableUserInput = {
    host: 'enableUserInput';
};

/**
 * Allow user directional input to be handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#enableusernavigation}
 */
export type BluescriptBehaviorActionEnableUserNavigation = {
    host: 'enableUserNavigation';
};

/**
 * Flags the engagement as interacted (true[ATTENTION] interaction requirement).
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#flagactivityforattention}
 */
export type BluescriptBehaviorActionFlagActivityForAttention = {
    host: 'flagActivityForAttention';
};

/**
 * Flags the engagement to send credit events. Fires credit once.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#flagactivityforcredit}
 */
export type BluescriptBehaviorActionFlagActivityForCredit = {
    host: 'flagActivityForCredit';
};

/**
 * Sets focus to a button or video. Triggers onFocusGained / onFocusLost.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#focuselement}
 */
export type BluescriptBehaviorActionFocusElement = {
    host: 'focusElement';
    /** Name of the node that will capture focus. */
    name: string;
};

/**
 * Iterates from `from` to `to` (inclusive) running `do`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#for}
 */
export type BluescriptBehaviorActionFor = {
    host: 'for';
    /** Local or key variable that receives the counter. Default `{ "key": "forI" }`. */
    value?: BluescriptValue;
    /** Integer the loop counter starts from; may be an expression. */
    from: BluescriptValue;
    /** Integer the loop counter counts to (inclusive); may be an expression. */
    to: BluescriptValue;
    /** Actions executed each iteration. */
    do: BluescriptBehaviorAction[];
};

/**
 * Runs `then` or optional `else` based on `expression`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#ifelse}
 */
export type BluescriptBehaviorActionIf = {
    host: 'if';
    /** Condition; a value or expression. */
    expression: BluescriptValue;
    /** Actions if expression is true. */
    then: BluescriptBehaviorAction[];
    /** Actions if expression is not true. */
    else?: BluescriptBehaviorAction[];
};

/**
 * Invokes a named function on the current step.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#invoke}
 */
export type BluescriptBehaviorActionInvoke = {
    host: 'invoke';
    /** Function name defined in the step's `functions` object. */
    function: string;
    /** Optional map of named arguments to pass to the function. */
    args?: Record<string, BluescriptValue>;
};

/**
 * HTTP request from behavior actions.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#makewebrequest}
 */
export type BluescriptBehaviorActionMakeWebRequest = {
    host: 'makeWebRequest';
    /** Server/file location. */
    url: string;
    /** One of GET, PUT, POST, DELETE, HEAD. Default GET. */
    method?: string;
    /** Header name → value. Default Accept and Content-Type application/json. */
    headers?: Record<string, string>;
    /** Body for PUT/POST. Strings sent as-is; objects form-encoded or JSON. */
    body?: BluescriptValue;
    /** `key` or `local` variable that receives the response. */
    assignResponseTo?: { key?: string; local?: string };
    /** Parse the response as JSON before assigning. Default false. */
    responseAsJson?: boolean;
    /** Actions on success. */
    onload?: BluescriptBehaviorAction[];
    /** Actions on failure. */
    onerror?: BluescriptBehaviorAction[];
};

/**
 * Pauses playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#pauseactiveaudio}
 */
export type BluescriptBehaviorActionPauseActiveAudio = {
    host: 'pauseActiveAudio';
};

/**
 * Pauses playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#pausevideo}
 */
export type BluescriptBehaviorActionPauseVideo = {
    host: 'pauseVideo';
    /** Name of the video to pause. */
    target?: string;
};

/**
 * Starts or resumes playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playactiveaudio}
 */
export type BluescriptBehaviorActionPlayActiveAudio = {
    host: 'playActiveAudio';
};

/**
 * Triggers a sound effect for playback.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playsoundeffect}
 */
export type BluescriptBehaviorActionPlaySoundEffect = {
    host: 'playSoundEffect';
    /** URI of the sound file. */
    uri: string;
};

/**
 * Starts or resumes playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playvideo}
 */
export type BluescriptBehaviorActionPlayVideo = {
    host: 'playVideo';
    /** Name of the video to play. */
    target?: string;
};

/**
 * @deprecated Step stacking is no longer supported. Use `replaceStep`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#popstep}
 */
export type BluescriptBehaviorActionPopStep = {
    host: 'popStep';
};

/**
 * Navigates to a different step, replacing the current one.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#replacestep}
 */
export type BluescriptBehaviorActionReplaceStep = {
    host: 'replaceStep';
    /** Name of the step to transition to. */
    cardName: string;
};

/**
 * Resets playback for the active audio element to the beginning.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetactiveaudio}
 */
export type BluescriptBehaviorActionResetActiveAudio = {
    host: 'resetActiveAudio';
};

/**
 * Re-initializes focus, usually the top-most / left-most button.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetfocus}
 */
export type BluescriptBehaviorActionResetFocus = {
    host: 'resetFocus';
};

/**
 * Resets playback for the target video to the beginning.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetvideo}
 */
export type BluescriptBehaviorActionResetVideo = {
    host: 'resetVideo';
    /** Name of the video to reset. */
    target?: string;
};

/**
 * Exits the current event handler or function invocation.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#return}
 */
export type BluescriptBehaviorActionReturn = {
    host: 'return';
    /** Optional return value for a function invocation. */
    value?: BluescriptValue;
};

/**
 * Assigns a property on a script element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#setattribute}
 */
export type BluescriptBehaviorActionSetAttribute = {
    host: 'setAttribute';
    /** Name of the BlueScript element. */
    name: string;
    /** Name of the underlying property to update. */
    key: string;
    /** New value for the property. */
    value: BluescriptValue;
};

/**
 * Instantly sets bounds / position of an element. Alternative to animateElement with duration 0.
 * All new values are optional by omitting them.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#setbounds}
 */
export type BluescriptBehaviorActionSetBounds = {
    host: 'setBounds';
    /** Name of the target node. */
    target?: string;
    /** New x position. */
    x?: BluescriptNumber;
    /** New y position. */
    y?: BluescriptNumber;
    /** New width. */
    width?: BluescriptNumber;
    /** New height. */
    height?: BluescriptNumber;
};

/**
 * Runs actions after a delay, once or repeating.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#settimeout}
 */
export type BluescriptBehaviorActionSetTimeout = {
    host: 'setTimeout';
    /** If true, the timer fires repeatedly. Default false. */
    repeat?: boolean;
    /** Seconds before execution. `timeout` and `delay` are also accepted. */
    duration?: number;
    timeout?: number;
    delay?: number;
    /** Actions to execute. */
    do: BluescriptBehaviorAction[];
};

/**
 * @deprecated Step stacking is no longer supported. Use `replaceStep`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#showstep}
 */
export type BluescriptBehaviorActionShowStep = {
    host: 'showStep';
    /** Name of the step to transition to. */
    cardName: string;
};

/**
 * Stops all timers created by setTimeout.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopalltimers}
 */
export type BluescriptBehaviorActionStopAllTimers = {
    host: 'stopAllTimers';
};

/**
 * Stops playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopactiveaudio}
 */
export type BluescriptBehaviorActionStopActiveAudio = {
    host: 'stopActiveAudio';
};

/**
 * Stops playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopvideo}
 */
export type BluescriptBehaviorActionStopVideo = {
    host: 'stopVideo';
    /** Name of the video to stop. */
    target?: string;
};

/**
 * Tracks a custom event to the true[X] server.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#trackcustomevent}
 */
export type BluescriptBehaviorActionTrackCustomEvent = {
    host: 'trackCustomEvent';
    /** Tracking taxonomy category. Default fep_roku_layout. */
    category?: string;
    /** Name of the tracking event. */
    name: string;
    /** Optional event value. */
    value?: string;
};
