/**
 * Runtime VAST ad-parameters JSON (ad server response).
 *
 * This is `VastConfigJson` from choice-card-preview TypeBox, not the studio
 * `VastConfig` / `VastCardConfig` Bridges rows.
 *
 * @see {@link https://github.com/socialvibe/rtb/blob/develop/app/views/ad_parameters.rb}
 * @see {@link https://github.com/socialvibe/rtb/blob/develop/app/views/vast_fill.rb}
 * @see {@link https://github.com/socialvibe/rtb/blob/develop/app/views/filled.rb}
 */

import type { ChoiceCardConfiguration } from './choice_card_configuration.js';
import type { CreativeAssetArgs, CreativeAssetType } from './creative_json.js';

export type VastConfigTagType = 'choice_card' | 'skip' | 'no_choice_card';

export type PartnerDimension =
    | 'dimension_1'
    | 'dimension_2'
    | 'dimension_3'
    | 'dimension_4'
    | 'dimension_5';

/** Publisher-supplied request dimensions (keys dimension_1…dimension_5). */
export type PartnerDimensions = Partial<Record<PartnerDimension, string>>;

/**
 * One filled engagement in a VAST response (`ads[]` / `xtended_view_fill` items).
 */
export type EngagementAd = {
    /**
     * Branded assets for this fill (`{ type, url }` entries). Used for
     * fill-specific choice / client-side skip art.
     */
    choice_card_images: unknown[];
    /**
     * True Targeting questions still needed before engagement
     * (often unused by modern clients).
     */
    pending_true_targeting_requirements: unknown;
    /** Asset type of the fill creative. */
    asset_type: CreativeAssetType;
    /** Asset URL of the fill creative. */
    asset_url: string;
    /**
     * Extra creative args for certain asset types (tvml, layoutJSON, bluescript).
     */
    asset_args?: CreativeAssetArgs;
    /** Whether the campaign is IDVX. */
    idvx: boolean;
    /**
     * Measurement / tracking host name (domain only). Prefer top-level
     * `service_url` when both exist.
     */
    service_url: string;
    /** Query string for engagement tracking. */
    service_params: string;
    /**
     * URL to load stacked BFI / survey questions; empty string when not applicable.
     */
    survey_config_url: string;
    /** Fill creative ID. */
    id: number | string;
    /** Fill campaign name. */
    name: string;
    /** Fill campaign ID. */
    campaign_id: number | string;
    /** Default engagement / CTA icon URL for the placement. */
    image_url?: string;
    /** Markup or text for the opt-in CTA; null if none. */
    display_text?: string | null;
    /** Engagement URL to open when the viewer opts into the ad. */
    window_url: string;
    /** Pixel width of the engagement window. */
    window_width: number;
    /** Pixel height of the engagement window. */
    window_height: number;
    /** Virtual currency amount offered as incentive to engage. */
    currency_amount: number;
    /** Publisher payout amount for this fill (stringified). */
    revenue_amount: string;
    /** A/B / multivariate testing variation map for the fill. */
    variations: Record<string, string | number>;
    /** Engagement session ID. */
    session_id: string;
    /** Ad request ID for this fill. */
    request_id: string;
    /** Publisher partner ID. */
    partner_id: number | string;
    /** Optional brand-lift / Qualtrics survey metadata. */
    brand_lift_survey?: unknown;
};

/**
 * Runtime VAST ad-parameters payload.
 */
export type VastConfigJson = {
    /** Which card UI the client should show. */
    tag_type: VastConfigTagType;
    /** Client correlation ID for choice-card tracking before a full engagement session exists. */
    vast_session_id: string;
    /** Ad request ID for this VAST response. */
    request_id: string;
    /** Viewer identifiers exposed to the card client. */
    user: {
        /** Advertising ID / IFA for the viewer. */
        id: string;
    };
    /** Placement subset needed by the card client. */
    placement: {
        id: string;
        identifier_hash: string;
        partner_id: string;
    };
    /** Request partner dimensions (dimension_1…dimension_5). */
    partner_dimensions: PartnerDimensions;
    /**
     * Filled engagements for this request (0 or 1 in normal VAST flows).
     * Empty on server-side skip cards.
     */
    ads: EngagementAd[];
    /**
     * @deprecated The same as `card_creative_url` (legacy mobile clients).
     */
    ad_free_creative_url: string;
    /** URL of the choice-card / card shell creative to load. */
    card_creative_url: string;
    /**
     * Global args for the card creative (feature flags, layout hints).
     * Parsed JSON object — values are not limited to strings.
     */
    card_creative_args: Record<string, unknown>;
    /**
     * Selected card configuration objects for this request.
     * May include a/b variants; client or ad server picks one.
     */
    card_configurations: ChoiceCardConfiguration[];
    /**
     * Branded assets for server-side skip cards (`{ type, url }`).
     * Not the same as per-fill `ads[].choice_card_images`.
     */
    choice_card_images: unknown[];
    /**
     * Measurement / tracking host name (domain only). Preferred over
     * `ads[].service_url` for new clients.
     */
    service_url: string;
    /** Optional Xtended View fill ads as engagement objects. */
    xtended_view_fill: EngagementAd[];
    /** Whether the request was considered fillable / qualified inventory. */
    fillable: boolean;
    /** Present on skip-card responses. */
    service_params?: string;
};
