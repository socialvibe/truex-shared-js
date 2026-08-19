/**
 * Studio-time creative definition (`creative.attributes` as served on the wire).
 *
 * Cornice serializes this as `JSON.generate(creative.attributes)`.
 *
 * @see {@link https://github.com/socialvibe/bridges/blob/master/lib/bridges/models/creative.rb}
 */

import type { LayoutJson } from './layout_json.js';

/**
 * Creative `asset_args`: either `{ layout: LayoutJson }` or the layout itself.
 */
export type CreativeAssetArgs = { layout: LayoutJson } | LayoutJson;

/**
 * @see choice-card-preview AssetTypes / RTB VastFill
 */
export type CreativeAssetType =
    | 'interactive'
    | 'survey'
    | 'layoutJSON'
    | 'innovid_roku'
    | 'innovid_tvos'
    | 'innovid_html'
    | 'innovid_hulu'
    | 'innovid_bluescript'
    | 'tvml'
    | 'bluescript'
    | 'video'
;

export type CreativePixelType = 'pixel' | 'click';

export type CreativePixelTrigger =
    | 'load'
    | 'video_start'
    | 'video_q1'
    | 'video_q2'
    | 'video_q3'
    | 'video_complete'
    | 'billing'
    | 'qr_code'
    | 'manual'
    | 'click_through'
;

export type CreativePixelRestrictionType =
    | 'start_date'
    | 'end_date'
    | 'campaign_id'
    | 'geolocation'
;

export type CreativePixelRestriction = {
    type: CreativePixelRestrictionType;
    value: string;
};

export type CreativePixelTag = {
    url: string;
    trigger: CreativePixelTrigger;
    type: CreativePixelType;
    label?: string;
    restrictions?: CreativePixelRestriction[];
    billing_verification?: boolean;
    adjuster_id?: string;
    adjuster_name?: string;
    adjuster_is_prisma?: boolean;
    condition?: string;
};

export type CreativeContainerArgs = {
    /** Engagement settings (footer labels, video_n, etc.). */
    settings?: Record<string, string | number | boolean>;
    tags?: CreativePixelTag[];
};

/**
 * Wire shape of Bridges `Creative` attributes.
 */
export type CreativeJson = {
    /** Scope flag; default false. */
    global?: boolean;
    /** Creative id. */
    id: string | number;
    /** Creative name. */
    name: string;
    /** Container version string (e.g. "3.0"). */
    container_version: string;
    /** Pixel width. */
    width: number;
    /** Pixel height. */
    height: number;
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
    /** Default false. */
    ctv?: boolean;
    /** Set of technology names (JSON array). */
    technologies: string[];
    /** Default false. */
    portrait?: boolean;
    /** Default true. */
    landscape?: boolean;
    promo_image_url?: string | null;
    promo_text?: string | null;
    /** Default 'interactive'. */
    asset_type: CreativeAssetType | string;
    asset_url: string;
    asset_args: CreativeAssetArgs;
    container_args: CreativeContainerArgs;
    user_id?: string;
    created_at?: string;
    creative_draft_id?: number;
    creation_tool?: string;
    creation_tool_version?: string;
    unified_ads?: Record<string, string>[];
    idvx?: boolean;
};
