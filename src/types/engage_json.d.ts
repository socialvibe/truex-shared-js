/**
 * Creative-service / cornice `engage.json` response (runtime creative configuration).
 *
 * @see {@link https://github.com/socialvibe/cornice/blob/master/app/views/engagements/_ad_vars.json.erb}
 * @see {@link https://github.com/socialvibe/cornice/blob/master/app/decorators/engagement_request_decorator.rb}
 */

import type { CreativeJson } from './creative_json.js';

/** Placement subset from `Placement#public_attributes`. */
export type EngagePlacementJson = {
    id: string | number;
    name: string;
    partner_id: string | number;
    module_url: string;
    module_args: string;
    chrome_width_padding: number;
    chrome_height_padding: number;
    currency_label: string;
    currency_label_plural: string;
    identifier_hash: string;
};

/** Campaign subset: `campaign.attributes.to_json(only: [:id, :io_unit_type])`. */
export type EngageCampaignJson = {
    id: string | number;
    io_unit_type: string;
};

export type EngageLocationJson = {
    country_code?: string;
    country_name?: string;
    latitude?: number;
    longitude?: number;
    region?: string;
    region_name?: string;
    city?: string;
    postal_code?: string;
    dma_code?: number;
};

export type EngageJson = {
    build_type: string;
    service_url: string;
    rtb_url: string;
    request_url: string;
    media_bucket_name: string;
    impression_timestamp: string;
    impression_signature: string;
    bid_info: string;
    currency_amount: string | number;
    referring_source: string;
    variant: string;
    initials: string;
    brand_lift_survey: unknown;
    survey_config_url: string;
    network_user_id: string;
    placement_hash: string;
    creative_id: number | string | null;
    session_id: string;
    stream_id: string;
    stream_position: string;
    cap_type: string | null;
    internal_referring_source: string;
    root_ad_request_id: string;
    ad_request_id: string;
    creative_json: CreativeJson;
    placement_json: EngagePlacementJson;
    campaign_json: EngageCampaignJson;
    location_json: EngageLocationJson;
    pending_true_targeting_requirements_json: unknown;
    extra_parameters_json: Record<string, unknown>;
    vote_summary_json: unknown;
    recent_comments_json: unknown;
    error_message: string;
    simulated: boolean;
    bidder_embed_code: string;
    bidder_vast_url: string;
    cachebuster_version: string;
};
