/**
 * BlueScript layout JSON (creative `asset_args.layout` / unwrapped `asset_args`).
 *
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md}
 */

export type BlueScriptJson =
    | string
    | number
    | boolean
    | null
    | BlueScriptJson[]
    | { [key: string]: BlueScriptJson }
;

export type BlueScriptLiteralExpression = {
    literal: BlueScriptJson;
};

export type BlueScriptKeyExpression = {
    key: BlueScriptExpression | string;
};

export type BlueScriptLocalExpression = {
    local: BlueScriptExpression | string;
};

export type BlueScriptArgExpression = {
    arg: BlueScriptGenericValue;
    default?: BlueScriptGenericValue;
};

export type BlueScriptInvokeExpression = {
    invoke: string;
    args?: Record<string, BlueScriptGenericValue>;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#date-expressions}
 */
export type BlueScriptDateExpression = {
    date:'now' | BlueScriptExpression | BlueScriptDateExpressionOptions;
};

export type BlueScriptDateExpressionOptions = {
    year?: number | string;
    month?: number | string;
    day?: number | string;
    hours?: number | string;
    minutes?: number | string;
    seconds?: number | string;
    milliseconds?: number | string;
};

/**
 * Get value of element's attribute
 */
export type BlueScriptAttributeExpression = {
    element: BlueScriptExpression | string;
    attribute: BlueScriptExpression | string;
};

/**
 * Simplified `{ "+": [...] }` form recognized by `evalExpr`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#expressions}
 */
export type BlueScriptSimplifiedOperationExpression =
    | { '+'  : BlueScriptReducableOperationArguments<BlueScriptExpression | string | number> }
    | { '-'  : BlueScriptReducableOperationArguments<BlueScriptExpression | string | number> }
    | { '*'  : BlueScriptReducableOperationArguments<BlueScriptExpression | number> }
    | { '/'  : BlueScriptReducableOperationArguments<BlueScriptExpression | number> }
    | { '&&' : BlueScriptReducableOperationArguments<BlueScriptGenericValue> }
    | { '||' : BlueScriptReducableOperationArguments<BlueScriptGenericValue> }
    | { '%'  : BlueScriptExpression | number }
    | { '>'  : BlueScriptExpression | number }
    | { '<'  : BlueScriptExpression | number }
    | { '>=' : BlueScriptExpression | number }
    | { '<=' : BlueScriptExpression | number }
    | { '==' : BlueScriptGenericValue }
    | { '!=' : BlueScriptGenericValue }
    | { '!'  : BlueScriptGenericValue }
    | { floor      : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { round      : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { ceil       : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { max        : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { min        : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { replace    : [ BlueScriptExpression | string, BlueScriptExpression | string, BlueScriptExpression | string] }
    | { replaceAll : [ BlueScriptExpression | string, BlueScriptExpression | string, BlueScriptExpression | string] }
    | { length     : BlueScriptGenericValue }
    | { random     : BlueScriptExpression | number }
    | { toFixed                   : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { toTrimFixed               : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { zeroFill                  : [ BlueScriptExpression | number, BlueScriptExpression | number ] }
    | { formatMinutesSeconds      : BlueScriptExpression | number }
    | { formatHoursMinutesSeconds : BlueScriptExpression | number }
;

/** `keyof` on a union is the *intersection* of keys; this distributes so you get every member's keys. */
type KeysOfUnion<T> = T extends T ? keyof T : never;

/** Operators recognized by `evalExpr` (simplified form and legacy `{ operation, values }`). */
export type BlueScriptOperator = KeysOfUnion<BlueScriptSimplifiedOperationExpression>;

export type BlueScriptOperationExpression = {
    operation: BlueScriptOperator;
    values?: BlueScriptGenericValue[];
};

export type BlueScriptReducableOperationArguments<T> = T[];

/**
 * Object/array forms evaluated by `evalExpr` (not a JSON literal).
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#expressions}
 */
export type BlueScriptExpression =
    | BlueScriptLiteralExpression
    | BlueScriptKeyExpression
    | BlueScriptLocalExpression
    | BlueScriptArgExpression
    | BlueScriptInvokeExpression
    | BlueScriptDateExpression
    | BlueScriptOperationExpression
    | BlueScriptSimplifiedOperationExpression
    | BlueScriptAttributeExpression
;

/**
 * Input to `evalExpr`: a JSON literal, or an expression.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#bluescript-values-and-expressions}
 */
export type BlueScriptGenericValue = BlueScriptExpression | BlueScriptJson;

/**
 * Top-level BlueScript layout.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#top-level-syntax}
 */
export type LayoutJson = {
    steps: BlueScriptStepConfig[];
};

/**
 * A single screen (card). No two steps are presented at once.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#step}
 */
export type BlueScriptStepConfig = {
    /** Name of the step; used to identify it for navigation. */
    name: string;
    /** Visual elements of this step. First element is drawn on top. */
    elements: BlueScriptElementConfig[];
    /** Event handlers keyed by element name. */
    behaviors?: BlueScriptStepBehaviors;
    /** Named functions invoked from behaviors or other functions. */
    functions?: BlueScriptStepFunctions;
};

/**
 * Map of element name → event handlers for that element.
 */
export type BlueScriptStepBehaviors = Record<string, BlueScriptBehaviors>;

/**
 * Event name → actions to run.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#behavior-events}
 */
export type BlueScriptBehaviors = Partial<Record<BlueScriptBehaviorTrigger, BlueScriptAction[]>>;

/**
 * Named function body: a list of actions.
 */
export type BlueScriptFunction = BlueScriptAction[];

/**
 * Map of function name → actions.
 */
export type BlueScriptStepFunctions = Record<string, BlueScriptFunction>;

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#behavior-events}
 */
export type BlueScriptBehaviorTrigger =
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
    | 'videoDidExitFullscreen'
;

export type BlueScriptNumber = number | string;

/**
 * Fields shared by visual BlueScript elements.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#elements}
 */
export type BlueScriptElementBase = {
    /** Name of the element; used to identify it for behaviors. */
    name: string;
    /** Screen-space X position; x=0 is the left of the (assumed 1080p) screen. Default 0. */
    x?: BlueScriptNumber;
    /** Screen-space Y position; y=0 is the top of the screen. Default 0. */
    y?: BlueScriptNumber;
    /** Width on screen. If 0, computed from visual content. Default 0. */
    width?: BlueScriptNumber;
    /** Height on screen. If 0, computed from visual content. Default 0. */
    height?: BlueScriptNumber;
    /** Opacity in [0, 1]; 0 is fully transparent, 1 is fully opaque. Default 1. */
    opacity?: number;
};

export type BlueScriptFocusable = {
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
export type BlueScriptRectangleElement = BlueScriptElementBase & {
    type: 'Rectangle';
    /** RGBA color drawn in the rectangle region. Default 0xFFFFFFFF. */
    color?: string;
    /** Whether the rectangle is alpha-blended with nodes behind it. Default true. */
    blendingEnabled?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#image}
 */
export type BlueScriptImageElement = BlueScriptElementBase & {
    type: 'Image';
    /** URI of the image file. */
    image_url: string;
    /** Use the image's native resolution on memory-constrained Roku devices. Default false. */
    forceHighResolution?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#video}
 */
export type BlueScriptVideoElement = BlueScriptElementBase & BlueScriptFocusable & {
    type: 'Video';
    /** URI of the video file (MP4). [required] */
    video_url: string;
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

    /**
     * Show native playback controls in HTML and desktop environments.
     * Ignored on CTV platforms.
     */
    controls?: boolean;

    /**
     * Allow HTML users to start or pause playback by clicking the video,
     * supporting user-initiated playback when autoplay is restricted.
     * Ignored on Roku and tvOS.
     */
    allowClickToPlay?: boolean;

    /**
     * Allow HTML users to toggle sound by clicking the video,
     * supporting user-initiated audio when autoplay is restricted.
     * Ignored on Roku and tvOS.
     */
    allowClickForSound?: boolean;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#text}
 */
export type BlueScriptTextElement = BlueScriptElementBase & {
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
export type BlueScriptButtonElement = BlueScriptElementBase & BlueScriptFocusable & {
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
    behavior?: BlueScriptBehaviors;
};

/**
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#audio}
 */
export type BlueScriptAudioElement = BlueScriptElementBase & {
    type: 'Audio';
    /** URI of the audio file (MP3; engines may fall back to MP4). */
    audio_url: string;
    /** Mute audio. Default false. */
    mute?: boolean;
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
export type BlueScriptQRCodeElement = BlueScriptElementBase & {
    type: 'QRCode';
    /** Information encoded in the QR image; also the fallback URL when tagLabel has no click tag. */
    url?: string;
    /** Native size in pixels of the returned QR image. */
    size?: BlueScriptNumber;
    /** Margin in QR matrix dots. Default 4. */
    margin?: BlueScriptNumber;
    /** Color of QR dots. Default 0xddddddff. */
    color?: string;
    /** Background color. Default 0x00000000. */
    backgroundColor?: string;
    /** Pass the final URL through the minify service. Default false. */
    minify?: boolean | string;
    /** Tag-manager label (trigger qr_code). When set, `url` is ignored if a matching click tag exists. */
    tagLabel?: string;
    /**
     * Name of a predefined QR-code style. When provided, the QR-code service
     * resolves it to a saved configuration for rendering parameters such as its
     * logo, gradient, dot style, and anchor style.
     */
    style?: string;
};

export type BlueScriptElementConfig =
    | BlueScriptRectangleElement
    | BlueScriptImageElement
    | BlueScriptVideoElement
    | BlueScriptTextElement
    | BlueScriptButtonElement
    | BlueScriptAudioElement
    | BlueScriptQRCodeElement
;

export type BlueScriptAction =
    | BlueScriptAllDoneButtonPushedAction
    | BlueScriptAnimateElementAction
    | BlueScriptAssignAction
    | BlueScriptBreakAction
    | BlueScriptBringToFrontAction
    | BlueScriptDebugLogAction
    | BlueScriptDisableUserInputAction
    | BlueScriptDisableUserNavigationAction
    | BlueScriptEnableUserInputAction
    | BlueScriptEnableUserNavigationAction
    | BlueScriptFlagActivityForAttentionAction
    | BlueScriptFlagActivityForCreditAction
    | BlueScriptFocusElementAction
    | BlueScriptForAction
    | BlueScriptIfAction
    | BlueScriptInvokeAction
    | BlueScriptMakeWebRequestAction
    | BlueScriptPauseActiveAudioAction
    | BlueScriptPauseVideoAction
    | BlueScriptPlayActiveAudioAction
    | BlueScriptPlaySoundEffectAction
    | BlueScriptPlayVideoAction
    | BlueScriptPopStepAction
    | BlueScriptReplaceStepAction
    | BlueScriptResetActiveAudioAction
    | BlueScriptResetFocusAction
    | BlueScriptResetVideoAction
    | BlueScriptReturnAction
    | BlueScriptSetAttributeAction
    | BlueScriptSetBoundsAction
    | BlueScriptSetTimeoutAction
    | BlueScriptShowStepAction
    | BlueScriptStopAllTimersAction
    | BlueScriptStopActiveAudioAction
    | BlueScriptStopVideoAction
    | BlueScriptTrackCustomEventAction;


/**
 * Triggers the Return to Content button, exiting the ad flow for a completed ad.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#alldonebuttonpushed}
 */
export type BlueScriptAllDoneButtonPushedAction = {
    host: 'allDoneButtonPushed';
};

/**
 * Animates element attributes from their current values.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#animateelement}
 */
export type BlueScriptAnimateElementAction = {
    host: 'animateElement';
    /** Name of the element to animate. */
    name?: BlueScriptExpression | string;
    /** Attributes to animate (x, y, width, height, opacity; position and size are legacy). */
    attributes: {
        x?: BlueScriptExpression | string | number;
        y?: BlueScriptExpression | string | number;
        width?: BlueScriptExpression | string | number;
        height?: BlueScriptExpression | string | number;
        opacity?: BlueScriptExpression | string | number;
        position?: BlueScriptExpression | string | number;
        size?: BlueScriptExpression | string | number;
    };
    /** Length of the animation in seconds. Default 0.35. */
    duration?: BlueScriptExpression | string | number;
    /** How values evolve over the duration. Default outCubic. */
    easeFunction?: string;
    /** Roku only: whether the animation can be skipped on stressed low-end devices. Default false. */
    optional?: boolean;
};

/**
 * Assigns a global (`key`) or local (`local`) variable. One of key or local is required.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#assign}
 */
export type BlueScriptAssignAction = {
    host: 'assign';
    /** Global variable name; dot-separated path into objects/arrays. May be an expression. */
    key?: BlueScriptExpression | string;
    /** Local variable name. Either `key` or `local` must be specified. */
    local?: BlueScriptExpression | string;
    /** Value to assign; may be an expression. */
    value: BlueScriptGenericValue;
};

/**
 * Exits the current `for` loop.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#break}
 */
export type BlueScriptBreakAction = {
    host: 'break';
};

/**
 * Draws the named element on top of all other displayed elements.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#bringtofront}
 */
export type BlueScriptBringToFrontAction = {
    host: 'bringToFront';
    /** Name of the element to bring to the front. */
    name?: BlueScriptExpression | string;
};

/**
 * Prints a log message (BrightScript terminal on Roku, console on HTML5).
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#debuglog}
 */
export type BlueScriptDebugLogAction = {
    host: 'debugLog';
    /** Value to print; may be an expression. Cast to string. */
    value: BlueScriptGenericValue;
};

/**
 * Prevent user input from being handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#disableuserinput}
 */
export type BlueScriptDisableUserInputAction = {
    host: 'disableUserInput';
};

/**
 * Prevent user directional input from being handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#disableusernavigation}
 */
export type BlueScriptDisableUserNavigationAction = {
    host: 'disableUserNavigation';
};

/**
 * Allow user input to be handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#enableuserinput}
 */
export type BlueScriptEnableUserInputAction = {
    host: 'enableUserInput';
};

/**
 * Allow user directional input to be handled.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#enableusernavigation}
 */
export type BlueScriptEnableUserNavigationAction = {
    host: 'enableUserNavigation';
};

/**
 * Flags the engagement as interacted (true[ATTENTION] interaction requirement).
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#flagactivityforattention}
 */
export type BlueScriptFlagActivityForAttentionAction = {
    host: 'flagActivityForAttention';
};

/**
 * Flags the engagement to send credit events. Fires credit once.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#flagactivityforcredit}
 */
export type BlueScriptFlagActivityForCreditAction = {
    host: 'flagActivityForCredit';
};

/**
 * Sets focus to a button or video. Triggers onFocusGained / onFocusLost.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#focuselement}
 */
export type BlueScriptFocusElementAction = {
    host: 'focusElement';
    /** Name of the node that will capture focus. */
    name: BlueScriptExpression | string;
};

/**
 * Iterates from `from` to `to` (inclusive) running `do`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#for}
 */
export type BlueScriptForAction = {
    host: 'for';
    /** Local or key variable that receives the counter. Default `{ "key": "forI" }`. */
    value?: BlueScriptKeyExpression | BlueScriptLocalExpression;
    /** Integer the loop counter starts from; may be an expression. */
    from: BlueScriptExpression | number;
    /** Integer the loop counter counts to (inclusive); may be an expression. */
    to: BlueScriptExpression | number;
    /** Actions executed each iteration. */
    do: BlueScriptAction | BlueScriptAction[];
};

/**
 * Runs `then` or optional `else` based on `expression`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#ifelse}
 */
export type BlueScriptIfAction = {
    host: 'if';
    /** Condition; a value or expression. */
    expression: BlueScriptExpression | boolean;
    /** Actions if expression is true. */
    then: BlueScriptAction | BlueScriptAction[];
    /** Actions if expression is not true. */
    else?: BlueScriptAction | BlueScriptAction[];
};

/**
 * Invokes a named function on the current step.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#invoke}
 */
export type BlueScriptInvokeAction = {
    host: 'invoke';
    /** Function name defined in the step's `functions` object. */
    function: string;
    /** Optional map of named arguments to pass to the function. */
    args?: Record<string, BlueScriptGenericValue>;
};

/**
 * HTTP request from behavior actions.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#makewebrequest}
 */
export type BlueScriptMakeWebRequestAction = {
    host: 'makeWebRequest';
    /** Server/file location. */
    url: BlueScriptExpression | string;
    /** One of GET, PUT, POST, DELETE, HEAD. Default GET. */
    method?: BlueScriptExpression | string;
    /** Header name → value. Default Accept and Content-Type application/json. */
    headers?: Record<string, BlueScriptExpression | string>;
    /** Body for PUT/POST. Strings sent as-is; objects form-encoded or JSON. */
    body?: BlueScriptGenericValue;
    /** `key` or `local` variable that receives the response. */
    assignResponseTo?: { key?: string; local?: string };
    /** Parse the response as JSON before assigning. Default false. */
    responseAsJson?: boolean;
    /** Actions on success. */
    onload?: BlueScriptAction | BlueScriptAction[];
    /** Actions on failure. */
    onerror?: BlueScriptAction | BlueScriptAction[];
};

/**
 * Pauses playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#pauseactiveaudio}
 */
export type BlueScriptPauseActiveAudioAction = {
    host: 'pauseActiveAudio';
};

/**
 * Pauses playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#pausevideo}
 */
export type BlueScriptPauseVideoAction = {
    host: 'pauseVideo';
    /** Name of the video to pause. */
    target?: BlueScriptExpression | string;
};

/**
 * Starts or resumes playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playactiveaudio}
 */
export type BlueScriptPlayActiveAudioAction = {
    host: 'playActiveAudio';
};

/**
 * Triggers a sound effect for playback.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playsoundeffect}
 */
export type BlueScriptPlaySoundEffectAction = {
    host: 'playSoundEffect';
    /** URI of the sound file. */
    uri: BlueScriptExpression | string;
};

/**
 * Starts or resumes playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#playvideo}
 */
export type BlueScriptPlayVideoAction = {
    host: 'playVideo';
    /** Name of the video to play. */
    target?: BlueScriptExpression | string;
    /** position */
    atTime?: BlueScriptExpression | string | number;
    /** default: true, not supported on `roku` */
    stopActiveAudio?: BlueScriptExpression | boolean;
    /** URI of the replace video */
    video_url?: BlueScriptExpression | string;
};

/**
 * @deprecated Step stacking is no longer supported. Use `replaceStep`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#popstep}
 */
export type BlueScriptPopStepAction = {
    host: 'popStep';
};

/**
 * Navigates to a different step, replacing the current one.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#replacestep}
 */
export type BlueScriptReplaceStepAction = {
    host: 'replaceStep';
    /** Name of the step to transition to. */
    cardName?: BlueScriptExpression | string;
    /**
     * alias to `cardName`, not supported on `roku`
     */
    stepName?: BlueScriptExpression | string;
};

/**
 * Resets playback for the active audio element to the beginning.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetactiveaudio}
 */
export type BlueScriptResetActiveAudioAction = {
    host: 'resetActiveAudio';
};

/**
 * Re-initializes focus, usually the top-most / left-most button.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetfocus}
 */
export type BlueScriptResetFocusAction = {
    host: 'resetFocus';
};

/**
 * Resets playback for the target video to the beginning.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#resetvideo}
 */
export type BlueScriptResetVideoAction = {
    host: 'resetVideo';
    /** Name of the video to reset. */
    target?: BlueScriptExpression | string;
};

/**
 * Exits the current event handler or function invocation.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#return}
 */
export type BlueScriptReturnAction = {
    host: 'return';
    /** Optional return value for a function invocation. */
    value?: BlueScriptGenericValue;
};

/**
 * Assigns a property on a script element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#setattribute}
 */
export type BlueScriptSetAttributeAction = {
    host: 'setAttribute';
    /** Name of the BlueScript element. */
    name: BlueScriptExpression | string;
    /** Name of the underlying property to update. */
    key: string;
    /** New value for the property. */
    value: BlueScriptGenericValue;
};

/**
 * Instantly sets bounds / position of an element. Alternative to animateElement with duration 0.
 * All new values are optional by omitting them.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#setbounds}
 */
export type BlueScriptSetBoundsAction = {
    host: 'setBounds';
    /** Name of the target node. */
    target?: string;
    /** New x position. */
    x?: BlueScriptExpression | number;
    /** New y position. */
    y?: BlueScriptExpression | number;
    /** New width. */
    width?: BlueScriptExpression | number;
    /** New height. */
    height?: BlueScriptExpression | number;
};

/**
 * Runs actions after a delay, once or repeating.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#settimeout}
 */
export type BlueScriptSetTimeoutAction = {
    host: 'setTimeout';
    /** If true, the timer fires repeatedly. Default false. */
    repeat?: BlueScriptExpression | boolean;
    /** Seconds before execution. `timeout` and `delay` are also accepted. */
    duration?: BlueScriptExpression | number | string;
    timeout?: BlueScriptExpression | number | string;
    delay?: BlueScriptExpression | number | string;
    /** Actions to execute. */
    do: BlueScriptAction | BlueScriptAction[];
};

/**
 * @deprecated Step stacking is no longer supported. Use `replaceStep`.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#showstep}
 */
export type BlueScriptShowStepAction = {
    host: 'showStep';
    /** Name of the step to transition to. */
    cardName: string;
};

/**
 * Stops all timers created by setTimeout.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopalltimers}
 */
export type BlueScriptStopAllTimersAction = {
    host: 'stopAllTimers';
};

/**
 * Stops playback for the active audio element.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopactiveaudio}
 */
export type BlueScriptStopActiveAudioAction = {
    host: 'stopActiveAudio';
};

/**
 * Stops playback for the target video.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#stopvideo}
 */
export type BlueScriptStopVideoAction = {
    host: 'stopVideo';
    /** Name of the video to stop. */
    target?: BlueScriptExpression | string;
};

/**
 * Tracks a custom event to the TrueX server.
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/bluescript-reference.md#trackcustomevent}
 */
export type BlueScriptTrackCustomEventAction = {
    host: 'trackCustomEvent';
    /** Tracking taxonomy category. Default fep_roku_layout. */
    category?: BlueScriptExpression | string;
    /** Name of the tracking event. */
    name: BlueScriptExpression | string;
    /** Optional event value. */
    value?: BlueScriptGenericValue;
};
