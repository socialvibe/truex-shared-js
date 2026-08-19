/**
 * Choice-card configuration objects (`card_configurations[]` items).
 *
 * Translated from choice-card-preview TypeBox (`choice-card-config.ts`).
 *
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/choice_card_config_params.md}
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/roku_tar_choice_card_config_params.md}
 * @see {@link https://github.com/socialvibe/truex-ads-docs/blob/master/connected_device_vast_wrapper_query_args.md}
 */

import { LayoutJson } from "./layout_json.js";


/** Coords / sizes from JSON or query-ish configs. */
export type ChoiceCardNumber = number | string;

export type TruexProduct = 'sponsored_stream' | 'sponsored_ad_break';

export type ChoiceCardButton = {
    image_url: string;
    hover_image_url: string;
    /** Button width. */
    width?: ChoiceCardNumber;
    /** Button height. */
    height?: ChoiceCardNumber;
    /** Button x-coordinate. */
    x?: ChoiceCardNumber;
    /** Button y-coordinate. */
    y?: ChoiceCardNumber;
};

export type ChoiceCardImage = {
    /** Image width. */
    width?: ChoiceCardNumber;
    /** Image height. */
    height?: ChoiceCardNumber;
    /** Image x-coordinate. */
    x?: ChoiceCardNumber;
    /** Image y-coordinate. */
    y?: ChoiceCardNumber;
    image_url: string;
};

export type ChoiceCardText = {
    text: string;
    /** Text width. */
    width?: ChoiceCardNumber;
    /** Text height. */
    height?: ChoiceCardNumber;
    /** Text x-coordinate. */
    x?: ChoiceCardNumber;
    /** Text y-coordinate. */
    y?: ChoiceCardNumber;
    color?: string;
    family?: string;
    /** Font size. */
    size?: ChoiceCardNumber;
};

/**
 * TAR HTML — wire `type` is `generic`.
 */
export type GenericChoiceCardConfiguration = {
    /**
     * Tracking label used in all tracking events for the specific card
     * configuration. Useful for a/b testing. Note: not used in Roku tracking.
     */
    name?: string;
    /** Hex value used as the base background color. Example: "#000000". */
    background_color: string;
    /** Object to configure background image. */
    background_image?: ChoiceCardImage;
    /**
     * Object to configure background video. Video will be sized to
     * dimensions of the player and does not loop.
     */
    background_video?: { video_url: string };
    /** Object to configure the brandable image. */
    brandable_image?: ChoiceCardImage;
    /** Object to configure the watch normal ads button. */
    watch_button: ChoiceCardButton;
    /** Object to configure the interact with engagement button. */
    interact_button: ChoiceCardButton;
    /** Object to configure the watch live button. */
    watch_live_button?: ChoiceCardButton;
    /** Object to configure the xtended_view watch button. */
    xtended_view?: ChoiceCardButton;
    /**
     * Number of seconds to delay the showing of all buttons within a card
     * configuration. Decimal values are accepted.
     */
    button_delay?: number;
    /** Voice-over MP3 URL, or an array of MP3 URLs. */
    voiceover: string | string[];
    /** Object to configure the countdown timer. */
    timer_text: ChoiceCardText;
    /** Number of seconds to count down from for the auto advance timer. */
    timer_seconds: number;
    /** Special object that allows the Survey Card to override parameters in the pre-roll position. */
    preroll_override?: {
        watch_button?: {
            image_url?: string;
            hover_image_url?: string;
        };
        interact_button?: {
            image_url?: string;
            hover_image_url?: string;
        };
        voiceover?: string;
        timer_text?: {
            text?: string;
        };
    };
};

/**
 * TAR Roku core fields (also used for survey_override / xtended_view).
 * Obsolete `continue` / `stream_pass` / `bgv_fmp4` are omitted.
 */
export type TarRokuChoiceCardCore = {
    name?: string;
    /** x-coordinate of the interact button. */
    ix: ChoiceCardNumber;
    /** y-coordinate of the interact button. */
    iy: ChoiceCardNumber;
    /** Width of the interact button. */
    iw: ChoiceCardNumber;
    /** Height of the interact button. */
    ih: ChoiceCardNumber;
    /** URL to sprite image for 'interactive ad' button. */
    ib: string;
    /** x-coordinate of the watch button. */
    wx: ChoiceCardNumber;
    /** y-coordinate of the watch button. */
    wy: ChoiceCardNumber;
    /** Width of the watch button. */
    ww: ChoiceCardNumber;
    /** Height of the watch button. */
    wh: ChoiceCardNumber;
    /** URL to sprite image for 'watch video ads' button. */
    wb: string;
    /**
     * Seconds to delay when all buttons should be shown.
     * Only supported for video choice cards.
     */
    bd?: ChoiceCardNumber;
    /**
     * URL for choice card background image. Used when bgv is not present
     * and turns on static choice card mode.
     */
    bg?: string;
    /**
     * URL for choice card background video. When present the choice card
     * becomes a video choice card.
     */
    bgv?: string;
    /** URL for choice card voice over audio file. Only supported for static choice cards. */
    vo?: string;
    /** URL of skip card image or mp4. Can be overridden at runtime by branded cards. */
    sk?: string;
    /**
     * Number of seconds for auto advance timer. Typically 30 for Choice Cards,
     * 5 for Skip Cards.
     */
    aa: ChoiceCardNumber;
    /** preroll or midroll — sponsored stream or sponsored ad break. */
    pos?: 'preroll' | 'midroll';
    /**
     * Product type. If not specified, default to sponsored_stream when pos=preroll
     * and sponsored_ad_break when pos=midroll.
     */
    product?: TruexProduct;
    /** Countdown format string; `[countdown]` is replaced with seconds remaining. */
    ct?: string;
    /** x-coordinate of the countdown timer label. */
    ctx?: ChoiceCardNumber;
    /** y-coordinate of the countdown timer label. */
    cty?: ChoiceCardNumber;
    /** Width of the countdown timer label. 0 (or omitted) auto-sizes to the text. */
    ctw?: ChoiceCardNumber;
    /** Height of the countdown timer label. */
    cth?: ChoiceCardNumber;
    /** Font size for text in the timer label. */
    cts?: ChoiceCardNumber;
    /** Font name for text in the timer label. */
    ctf?: string;
    /** Color for text in the timer label. */
    ctc?: string;
    /** x-coordinate of the visual countdown timer bar. */
    ctvx?: ChoiceCardNumber;
    /** y-coordinate of the visual countdown timer bar. */
    ctvy?: ChoiceCardNumber;
    /** Width of the visual countdown timer bar. */
    ctvw?: ChoiceCardNumber;
    /** Height of the visual countdown timer bar. */
    ctvh?: ChoiceCardNumber;
    /** Color for visual countdown timer bar. */
    ctvc?: string;
    /** Seconds that the native interactive ad header starts at. Typically 30. */
    sec?: ChoiceCardNumber;
};

export type TarRokuChoiceCardConfiguration = TarRokuChoiceCardCore & {
    /** Survey card override (same format as a normal Roku choice card). */
    survey_override?: TarRokuChoiceCardCore;
    /** Xtended View choice card overrides (same format as a normal Roku choice card). */
    xtended_view?: TarRokuChoiceCardCore;
};

/**
 * Innovid CTV — wire `type` is `innovid`.
 */
export type InnovidChoiceCardConfiguration = {
    name?: string,
    /** URL of skip card image or mp4. */
    sk?: string;
    /** Seconds that the native interactive ad header starts at. Typically 30. */
    sec: ChoiceCardNumber;
    /** URL for choice card background image. */
    bg?: string;
    /** URL for choice card background video. */
    bgv?: string;
    /** URL to sprite image for 'interactive ad' button. */
    ib: string;
    /** x-coordinate of interact button. */
    ix?: ChoiceCardNumber;
    /** y-coordinate of interact button. */
    iy?: ChoiceCardNumber;
    /** URL to sprite image for 'watch video ads' button. */
    wb: string;
    /** x-coordinate of watch button. */
    wx?: ChoiceCardNumber;
    /** y-coordinate of watch button. */
    wy?: ChoiceCardNumber;
    /** Seconds to delay when all buttons should be shown. If omitted, no delay. */
    bd?: ChoiceCardNumber;
    /** Countdown timer template; `#` is replaced with the timer value. */
    ct?: string;
    /** x-coordinate of countdown timer. Based on 720p. */
    cx?: ChoiceCardNumber;
    /** y-coordinate of countdown timer. Based on 720p. */
    cy?: ChoiceCardNumber;
    /** Width of countdown timer. Based on 720p. */
    cw?: ChoiceCardNumber;
    /** Height of countdown timer. Based on 720p. */
    ch?: ChoiceCardNumber;
    /** Font size of countdown timer. */
    cfs?: ChoiceCardNumber;
    /** Text color of countdown timer. */
    cfc?: ChoiceCardNumber;
    /** Show name displayed in footer (Hulu). */
    n?: string;
    /** URL to a show thumbnail image in footer (Hulu). */
    f?: string;
    /** preroll or midroll. */
    pos?: 'midroll' | 'preroll';
    /** Auto advance seconds. Typically 30. -1 for no auto advance. */
    aa?: ChoiceCardNumber;
    /** URL for choice card voice over audio file. */
    vo?: string;
    /**
     * Product type. If not specified, default to sponsored_stream when pos=preroll
     * and sponsored_ad_break when pos=midroll.
     */
    product: TruexProduct;
};

/**
 * not in use, but all renderers support this
 */
export type BluescriptChoiceCardConfiguration = {
    asset_type: 'layoutJSON',
    asset_args: LayoutJson,
};

/**
 * Single `card_configurations[]` item.
 */
export type ChoiceCardConfiguration =
    | GenericChoiceCardConfiguration
    | BluescriptChoiceCardConfiguration
    | TarRokuChoiceCardConfiguration
    | InnovidChoiceCardConfiguration
;
