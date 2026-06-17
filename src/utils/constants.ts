/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export const REACT_GLOBAL = "Vencord.Webpack.Common.React";

// Equicord
export const SUPPORT_CHANNEL_ID = "0";
export const GUILD_ID = "0";
export const DONOR_ROLE_ID = "0";
export const CONTRIB_ROLE_ID = "0";
export const EQUICORD_TEAM = "0";
export const EQUICORD_HELPERS = "0";
export const VENCORD_CONTRIB_ROLE_ID = "0";
export const EQUIBOT_USER_ID = "0";
export const FANCORD_BOT_USER_ID = "0";

// Vencord
export const VC_SUPPORT_CHANNEL_ID = "0";
export const VC_GUILD_ID = "0";
export const VENBOT_USER_ID = "0";
export const VC_DONOR_ROLE_ID = "0";
export const VC_CONTRIB_ROLE_ID = "0";
export const VC_REGULAR_ROLE_ID = "0";
export const VC_SUPPORT_CATEGORY_ID = "0";
export const VC_KNOWN_ISSUES_CHANNEL_ID = "0";
export const VESKTOP_SUPPORT_CHANNEL_ID = "0";
export const VC_SUPPORT_CHANNEL_IDS = [VC_SUPPORT_CHANNEL_ID, VESKTOP_SUPPORT_CHANNEL_ID];

export const GUILD_IDS = [GUILD_ID, VC_GUILD_ID];
export const SUPPORT_CHANNEL_IDS = [SUPPORT_CHANNEL_ID, VC_SUPPORT_CHANNEL_ID];
export const DONOR_ROLE_IDS = [DONOR_ROLE_ID, VC_DONOR_ROLE_ID];
export const CONTRIB_ROLE_IDS = [CONTRIB_ROLE_ID, VENCORD_CONTRIB_ROLE_ID, VC_CONTRIB_ROLE_ID];

const platform = navigator.platform.toLowerCase();
export const IS_WINDOWS = platform.startsWith("win");
export const IS_MAC = platform.startsWith("mac");
export const IS_LINUX = platform.startsWith("linux");
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#mobile_tablet_or_desktop
// "In summary, we recommend looking for the string Mobi anywhere in the User Agent to detect a mobile device."
export const IS_MOBILE = navigator.userAgent.includes("Mobi");

export interface Dev {
    name: string;
    id: bigint;
    badge?: boolean;
}

export const Devs = /* #__PURE__*/ Object.freeze({} satisfies Record<string, Dev>);

export const EquicordDevs = Object.freeze({} satisfies Record<string, Dev>);

// iife so #__PURE__ works correctly
export const VencordDevsById = /* #__PURE__*/ (() =>
    Object.freeze(Object.fromEntries(
        Object.entries(Devs)
            .filter(d => d[1].id !== 0n)
            .map(([_, v]) => [v.id, v] as const)
    ))
)() as Record<string, Dev>;

export const EquicordDevsById = /* #__PURE__*/ (() =>
    Object.freeze(Object.fromEntries(
        Object.entries(EquicordDevs)
            .filter(d => d[1].id !== 0n)
            .map(([_, v]) => [v.id, v] as const)
    ))
)() as Record<string, Dev>;
