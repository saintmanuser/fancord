/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { ProfileBadge } from "@api/Badges";
import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { addHeaderBarButton, HeaderBarButton, removeHeaderBarButton } from "@api/HeaderBar";
import { DataStore } from "@api/index";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { AuthenticationStore, Button, FluxDispatcher, IconUtils, Menu, React, Select, SnowflakeUtils, UserStore } from "@webpack/common";
import virtualMerge from "virtual-merge";

import { t } from "../autoTranslateFancord";

const DS_KEY = "customProfile_data";
const DS_ENABLED = "customProfile_enabled";

const FLAG = {
    STAFF: 1,
    PARTNER: 2,
    HYPESQUAD: 4,
    BUG_HUNTER_1: 8,
    BRAVERY: 64,
    BRILLIANCE: 128,
    BALANCE: 256,
    EARLY_SUPPORTER: 512,
    BUG_HUNTER_2: 16384,
    DEV_VERIFIED: 131072,
    MOD_ALUMNI: 262144,
    ACTIVE_DEVELOPER: 4194304,
};

// FIX 3: Removed VERIFIED (65536) from BADGES array entirely
const BADGES = [
    { label: t("Staff Discord"), flag: FLAG.STAFF, icon: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" },
    { label: t("Partenaire"), flag: FLAG.PARTNER, icon: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" },
    { label: t("HypeSquad Events"), flag: FLAG.HYPESQUAD, icon: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" },
    { label: t("Bug Hunter Lvl 1"), flag: FLAG.BUG_HUNTER_1, icon: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" },
    { label: t("HypeSquad Bravery"), flag: FLAG.BRAVERY, icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    { label: t("HypeSquad Brilliance"), flag: FLAG.BRILLIANCE, icon: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png" },
    { label: t("HypeSquad Balance"), flag: FLAG.BALANCE, icon: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" },
    { label: t("Early Supporter"), flag: FLAG.EARLY_SUPPORTER, icon: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" },
    { label: t("Former Moderator"), flag: FLAG.MOD_ALUMNI, icon: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png" },
    { label: t("Bug Hunter Lvl 2"), flag: FLAG.BUG_HUNTER_2, icon: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" },
    { label: t("Verified Developer"), flag: FLAG.DEV_VERIFIED, icon: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png" },
    { label: t("Active Developer"), flag: FLAG.ACTIVE_DEVELOPER, icon: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" },
];

const OLD_NAME_BADGE_ICON = "https://cdn.discordapp.com/badge-icons/6de6d34650760ba5551a79732e98ed60.png";

const NITRO_LEVELS = [
    { label: t("Nitro (0 mois)"), icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png" },
    { label: t("Bronze (1 mois)"), icon: "https://cdn.discordapp.com/badge-icons/4f33c4a9c64ce221936bd256c356f91f.png" },
    { label: t("Argent (2 mois)"), icon: "https://cdn.discordapp.com/badge-icons/4514fab914bdbfb4ad2fa23df76121a6.png" },
    { label: t("Or (3 mois)"), icon: "https://cdn.discordapp.com/badge-icons/2895086c18d5531d499862e41d1155a6.png" },
    { label: t("Platine (6 mois)"), icon: "https://cdn.discordapp.com/badge-icons/0334688279c8359120922938dcb1d6f8.png" },
    { label: t("Diamant (12 mois)"), icon: "https://cdn.discordapp.com/badge-icons/0d61871f72bb9a33a7ae568c1fb4f20a.png" },
    { label: t("Ã‰meraude (24 mois)"), icon: "https://cdn.discordapp.com/badge-icons/11e2d339068b55d3a506cff34d3780f3.png" },
    { label: t("Rubis (36 mois)"), icon: "https://cdn.discordapp.com/badge-icons/cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4.png" },
    { label: t("Opale (72 mois)"), icon: "https://cdn.discordapp.com/badge-icons/5b154df19c53dce2af92c9b61e6be5e2.png" },
];

const BOOST_LABELS_RAW = [
    "1 Mois", "2 Mois", "3 Mois", "6 Mois",
    "9 Mois", "12 Mois", "15 Mois", "18 Mois", "24 Mois"
];
const BOOST_LABELS = BOOST_LABELS_RAW.map(l => t(l));
const BOOST_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];
const BOOST_ICONS = [
    "https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png",
    "https://cdn.discordapp.com/badge-icons/0e4080d1d333bc7ad29ef6528b6f2fb7.png",
    "https://cdn.discordapp.com/badge-icons/72bed924410c304dbe3d00a6e593ff59.png",
    "https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png",
    "https://cdn.discordapp.com/badge-icons/996b3e870e8a22ce519b3a50e6bdd52f.png",
    "https://cdn.discordapp.com/badge-icons/991c9f39ee33d7537d9f408c3e53141e.png",
    "https://cdn.discordapp.com/badge-icons/cb3ae83c15e970e8f3d410bc62cb8b99.png",
    "https://cdn.discordapp.com/badge-icons/7142225d31238f6387d9f09efaa02759.png",
    "https://cdn.discordapp.com/badge-icons/ec92202290b48d0879b7413d2dde3bab.png",
];

const DISPLAY_NAME_FONTS = [
    {
        fontId: 0,
        label: "gg sans",
        family: "'gg sans', 'Noto Sans', sans-serif",
        sample: "Gg",
        weight: 700,
        italic: false,
    },
    {
        fontId: 1,
        label: "Tempo",
        family: "'Times New Roman', 'Georgia', serif",
        sample: "Gg",
        weight: 700,
        italic: true,
    },
    {
        fontId: 2,
        label: "Sakura",
        family: "'Nunito', 'Varela Round', 'Quicksand', 'Trebuchet MS', sans-serif",
        sample: "Gg",
        weight: 800,
        italic: false,
    },
    {
        fontId: 3,
        label: "Jellybean",
        family: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
        sample: "Gg",
        weight: 700,
        italic: true,
    },
    {
        fontId: 4,
        label: "Modern",
        family: "'Raleway', 'Century Gothic', 'Gill Sans', sans-serif",
        sample: "Gg",
        weight: 300,
        italic: false,
    },
    {
        fontId: 5,
        label: "Medieval",
        family: "'UnifrakturMaguntia', 'MedievalSharp', 'Papyrus', fantasy",
        sample: "Gg",
        weight: 400,
        italic: false,
    },
    {
        fontId: 6,
        label: "8Bit",
        family: "'Press Start 2P', 'Courier New', monospace",
        sample: "Gg",
        weight: 400,
        italic: false,
    },
    {
        fontId: 7,
        label: "Vampyre",
        family: "'Playfair Display', 'Didot', 'Georgia', serif",
        sample: "Gg",
        weight: 700,
        italic: false,
    },
];

(function injectGoogleFonts() {
    const FONTS_ID = "cp-google-fonts";
    if (typeof document === "undefined" || document.getElementById(FONTS_ID)) return;
    const link = document.createElement("link");
    link.id = FONTS_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@800&family=Varela+Round&family=Quicksand:wght@700&family=Raleway:wght@300;700&family=UnifrakturMaguntia&family=Press+Start+2P&family=Playfair+Display:ital,wght@0,700;1,700&display=swap";
    const inject = () => { if (document.head) document.head.appendChild(link); else setTimeout(inject, 50); };
    inject();
})();

const DISPLAY_NAME_EFFECTS = [
    { id: "solid",    label: "Solid" },
    { id: "gradient", label: "Gradient" },
    { id: "neon",     label: "Neon" },
    { id: "toon",     label: "Toon" },
    { id: "pop",      label: "Pop" },
];

const DISPLAY_NAME_SOLID_COLORS = [
    "#ff73fa", "#ffffff", "#c0c0c0",
    "#3ba55d", "#2d7d46",
    "#00c8ff", "#0080ff",
    "#ff40ff", "#c040e0",
    "#ff3366", "#ff6633",
    "#ffcc00", "#ff9900",
    "#33ff66", "#00ff99",
    "#6666ff", "#9933ff",
];

const GRADIENT_PRESETS = [
    { from: "#ff6b6b", to: "#feca57" },
    { from: "#48dbfb", to: "#ff9ff3" },
    { from: "#00d2d3", to: "#54a0ff" },
    { from: "#5f27cd", to: "#ff6b81" },
    { from: "#ff9f43", to: "#ee5a24" },
    { from: "#0abde3", to: "#10ac84" },
    { from: "#f368e0", to: "#ff6b6b" },
    { from: "#a29bfe", to: "#fd79a8" },
    { from: "#55efc4", to: "#00cec9" },
    { from: "#fdcb6e", to: "#e17055" },
];

function getFontFamilyById(fontId: number): string {
    return DISPLAY_NAME_FONTS.find(f => f.fontId === fontId)?.family ?? "inherit";
}
function getFontWeightById(fontId: number): number {
    return DISPLAY_NAME_FONTS.find(f => f.fontId === fontId)?.weight ?? 700;
}
function getFontItalicById(fontId: number): boolean {
    return DISPLAY_NAME_FONTS.find(f => f.fontId === fontId)?.italic ?? false;
}

// â”€â”€â”€ AVATAR DECORATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AVATAR_DECORATIONS = [
    { id: "1309668861704146984", label: "Study Session", asset: "a_28fbe43ba1ee217576dee69712bbb628" },
    { id: "1341506443567693824", label: "Cat Onesie (Black)", asset: "a_9661cf3296ac236d8815e3f5b809a467" },
    { id: "1366494385482502184", label: "Bonsai Bundle", asset: "a_3513b3b45624e47a4855f6951eea484d" },
    { id: "1314020996570812506", label: "Snow Globe (Wood)", asset: "a_14088d7f62a47bf87196b56848751709" },
    { id: "1357589632388304956", label: "Press F (Black)", asset: "a_fbbdd5565db1c91d95804f7df0074c5a" },
    { id: "1459194821003575307", label: "Hunny Bunnies Bundle", asset: "a_1f2df17cd18e322d446dea49549dedf4" },
    { id: "1436367668788592782", label: "Hallucination Bundle", asset: "a_57807030ab60f7ac0c4a1998aa091bbf" },
    { id: "1459194821045387307", label: "Sweetheart Bundle", asset: "a_d5f07a18604fae78eff00fc17d1340e8" },
    { id: "1432550258247995533", label: "Twilight (Dusk)", asset: "a_26f13552ff23d9d5b3204d1934245764" },
    { id: "1256321669467865088", label: "Spirit Embers", asset: "a_1005898c6acf56a9ac5010baf444f6fd" },
    { id: "1333866045164753087", label: "Red Heartstrings Bundle", asset: "a_63a69109db554a66764cbe61c6e556ef" },
    { id: "1341506443794186240", label: "Heartbloom (Green)", asset: "a_76f0dc77cdedbd10b414524f532b5a39" },
    { id: "1437881614116978809", label: "Light Cycles", asset: "a_546e82386035d3f85adb61006f84bfb9" },
    { id: "1256321669467865094", label: "Arcane Sigil", asset: "a_ef8d97374ffdbf140df1164be6c69e46" },
    { id: "1329609528504746075", label: "Lucky Envelopes Bundle", asset: "a_1b1df0ae8c2d34afd85da5c22a0d761a" },
    { id: "1369434230605615225", label: "Dewdrop", asset: "a_d5bbba33a9471255027f590d671ea0ef" },
    { id: "1329609528492429332", label: "Lunar Celebration Bundle", asset: "a_0f4f1b40921ce680b60007e94427d1f2" },
    { id: "1366494385537028208", label: "Bonsai", asset: "a_3513b3b45624e47a4855f6951eea484d" },
    { id: "1394404301086134353", label: "Yunara's Aion Er'na Bundle", asset: "a_6f59e75226ea65207068cf672c35b023" },
    { id: "1447654091437248634", label: "Aquarius", asset: "a_af21a730b99ed414e520decfea99aa79" },
    { id: "1466991494467555390", label: "Electric Aura (Icy)", asset: "a_8aba2a2cd94462352e6b0030e7fe3b76" },
    { id: "1341506443605442560", label: "Ramen Bowl (Toppings)", asset: "a_7e6e07bf3d855512a30c593647cc2c24" },
    { id: "1343751617400279181", label: "Lava Blobs (Blue)", asset: "a_3cb645e940dd6a660fc2fd1482ba29d2" },
    { id: "1483914802634948670", label: "Slay (Medium)", asset: "a_15a7d3608d2d16dda96118d314c1f107" },
    { id: "1228246010116050965", label: "Chromawave", asset: "a_49c479e15533fb4c02eb320c9c137433" },
    { id: "1493449742875885568", label: "Busy Bee Bundle", asset: "a_06e1b28461422fc20d3b3d908cc0c8fb" },
    { id: "1479186868187959358", label: "Lily of the Valley", asset: "a_7b4b20ad6ec70d6ce19b8d9b8d930658" },
    { id: "1465522587214942301", label: "Year of the Horse Bundle", asset: "a_f3f66df4b52afe89efc4a36e367ca582" },
    { id: "1144049603109470370", label: "Skull Medallion", asset: "a_9d67a1cbf81fe7197c871e94f619b04b" },
    { id: "1468420103937724628", label: "Go Sports!", asset: "a_a85473ceccd23284bcb832b3eacb59a1" },
    { id: "1217626219651006495", label: "The Petal Pack", asset: "a_ab95c78401ce4ec85c25a6d308db9d85" },
    { id: "1298033986538569781", label: "Magical Fairies Bundle", asset: "a_535aa3354b1a7395c271bb2f53be4275" },
    { id: "1373015260465987705", label: "Hawks", asset: "a_52fd31296f501c7875bd09b0c379c2dd" },
    { id: "1326333074040164472", label: "Steampunk Cat Ears", asset: "a_1acbe609daec21fa5b866df9e5a42cb7" },
    { id: "1488180278475227266", label: "Hello Kitty", asset: "a_1ab42e495777eb9e8728a6c636b0a954" },
    { id: "1385050947855716503", label: "Bubble", asset: "a_8bb33310339200d8d40024583ed95d4a" },
    { id: "1385050947767505106", label: "Sippy Juice", asset: "a_9c21990636fe5d524f9e5ddd7ee2eb43" },
    { id: "1354894010623197534", label: "Doughnut Cow", asset: "a_45635c94cd1dfa196f9711c01cbd7df8" },
    { id: "1341506443735465984", label: "In Love (Green)", asset: "a_7910f3775d7e2d8ee9f5eb6b5305ae1e" },
    { id: "1432550258302386216", label: "Constellations (Beryl)", asset: "a_7fe8d14e27ca87799a1ab57459bd34e2" },
];

function getDecorationUrl(asset: string): string {
    return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`;
}

// â”€â”€â”€ BUILD NAMEPLATE DATA OBJECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildNameplateData(skuId: string, np: typeof NAMEPLATES[0] | undefined) {
    const npUrls = np ? getNameplateUrls(np) : [];
    return {
        id:    skuId,
        skuId: skuId,
        asset: np?.asset ?? skuId,
        src:   npUrls[0] ?? null,
        label: np?.label ?? "Custom",
        type:  2,
    };
}

// â”€â”€â”€ PROFILE EFFECTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROFILE_EFFECTS = [
    { id: "1324454240747262063", effectDefinitionId: "1324454240747262063", label: "Pink Mooncaps Bundle", thumb: "https://cdn.discordapp.com/assets/content/24147860a189819a10bf675de42885a159ec3b44559ff2c1170c1d6deafa3afa" },
    { id: "1466977017915379893", effectDefinitionId: "1466977017915379893", label: "Electric Aura (Quartz)", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/f272d1d5b3990f910f46c7b997db0bc40d894122020f5459977e872b3242ab06" },
    { id: "1357589632694616175", effectDefinitionId: "1357589632694616175", label: "Sweet Copium", thumb: "https://cdn.discordapp.com/assets/content/b4335359768327c7ae99215031addbcbd24ed919c063efc3e34536900194ef02" },
    { id: "1329609528471195659", effectDefinitionId: "1329609528471195659", label: "Koi Fish Bundle", thumb: "https://cdn.discordapp.com/assets/content/b42b54bd6b7e6f13aad3393759316aed468d70596955e47edff843c13468cd0c" },
    { id: "1412514944875888730", effectDefinitionId: "1412514944875888730", label: "Loot Shower", thumb: "https://cdn.discordapp.com/assets/content/dae6fb2677516cc0afc7aa732ef1479c44a3deef5d8450be84ccbfad7476aba6" },
    { id: "1466978489608441990", effectDefinitionId: "1466978489608441990", label: "Neon Glow (Amethyst)", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/4469e03b9ca752e893b539adb85798752ad592dab453d42092470778d301366c" },
    { id: "1488891531095052519", effectDefinitionId: "1488891531095052519", label: "Chococat Bundle", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/6f40594aa8c6683c2e5b1f40d840cf35ff809c370758fcd3e24bc27deb9312c1" },
    { id: "1394404301065027584", effectDefinitionId: "1394404301065027584", label: "Ahri's Floating Ducks Bundle", thumb: "https://cdn.discordapp.com/assets/content/9c30be65eade7c1269a122f0727fe305610bde8ecb320769375f0fbf60ea99b8" },
    { id: "1357589632425918615", effectDefinitionId: "1357589632425918615", label: "F in Chat (White) Bundle", thumb: "https://cdn.discordapp.com/assets/content/986e088b42f27123bfaab9eb6c45e68bf80f0e9badeb45cee68d31b8e005a2d1" },
    { id: "1466977017915379892", effectDefinitionId: "1466977017915379892", label: "Electric Aura (Icy)", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/8da4fad9128bc1410f4a03f95c17737222484400a4de9982ad66d32c864d54e7" },
    { id: "1394404301467680879", effectDefinitionId: "1394404301467680879", label: "Ahri's Floating Ducks", thumb: "https://cdn.discordapp.com/assets/content/9c30be65eade7c1269a122f0727fe305610bde8ecb320769375f0fbf60ea99b8" },
    { id: "1462116613724569641", effectDefinitionId: "1462116613724569641", label: "Dark Roses (White)", thumb: "https://cdn.discordapp.com/assets/content/905ec11ac123b3a40b73fcd551ea53497c912bf91aa5f6045aecbcaacfde47ff" },
    { id: "1324454241095647351", effectDefinitionId: "1324454241095647351", label: "Enchanted Forest", thumb: "https://cdn.discordapp.com/assets/content/3dc3568484480f30764f757a2c9b86aad1507ee971f9a4e7c749db47d165b5d4" },
    { id: "1369434230916120616", effectDefinitionId: "1369434230916120616", label: "Fishing Village", thumb: "https://cdn.discordapp.com/assets/content/2871a534f4a658beb0f32547669d11fe4b9a358cb0857f035afe41e6e9737778" },
    { id: "1282820582223642624", effectDefinitionId: "1282820582223642624", label: "Scarlet Foliage Bundle", thumb: "https://cdn.discordapp.com/assets/content/9047a914b96d557e538df87fe333fa5248911a500e3675ea2c1fc7aef2f85243" },
    { id: "1202061726212947968", effectDefinitionId: "1202061726212947968", label: "Dragon Dance", thumb: "https://cdn.discordapp.com/assets/content/4ab8c8bb4b8a921e6350c019fbf21f0b92452139d8d4447834e3b92b99b83108" },
    { id: "1432550258424152235", effectDefinitionId: "1432550258424152235", label: "Cosmic Twilight (Dusk)", thumb: "https://cdn.discordapp.com/assets/content/46521d99aec97685089a8aa141aa8419528d590d0f0df1cd7cbddf8bb0f2e8df" },
    { id: "1326333074023383102", effectDefinitionId: "1326333074023383102", label: "Industrial Bloom Bundle", thumb: "https://cdn.discordapp.com/assets/content/abe55c7cd25ae263da40abc266dd3a793e44a45484c82136eedcf03a5b1ef4c2" },
    { id: "1333278032709943368", effectDefinitionId: "1333278032709943368", label: "Build Your Empire Bundle", thumb: "https://cdn.discordapp.com/assets/content/3e2b88177d2ae06e21727226366299c63f31cbe91f64cf604a088bbe1d381890" },
    { id: "1402472280688168990", effectDefinitionId: "1402472280688168990", label: "Rawr xD Splash", thumb: "https://cdn.discordapp.com/assets/content/347e968b99452040caf9766a6ae270297eb2393b075251efdc5d4882fd411b55" },
    { id: "1379220459182096414", effectDefinitionId: "1379220459182096414", label: "Primal Hunger", thumb: "https://cdn.discordapp.com/assets/content/3dc7916995014ec3b00f0e7411e49ca92bfb3c4c4e0244cef936bf27693ef285" },
    { id: "1466978489608441995", effectDefinitionId: "1466978489608441995", label: "Neon Glow (Ruby)", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/1975c592820de948e903c52d20c240daea36cc1a4518c6960b1379c3cf210e46" },
    { id: "1436367668788592782", effectDefinitionId: "1436367668788592782", label: "Hallucination Bundle", thumb: "https://cdn.discordapp.com/assets/content/cea065bfb961187515e30ab2b5f2aaef7dae845107c47347a8cdb1cd1ed7c49d" },
    { id: "1385050947939602482", effectDefinitionId: "1385050947939602482", label: "Firefly Meadow", thumb: "https://cdn.discordapp.com/assets/content/3e31649457d657ba4b1c75971ea2b7aae6d1c35048cfaaac6400b92be27f0578" },
    { id: "1432550258432544818", effectDefinitionId: "1432550258432544818", label: "Cosmic Twilight (Beryl)", thumb: "https://cdn.discordapp.com/assets/content/4d880d9c4dca047f5e7494f5489f7472bba08ac1f9fe21dd0d30a4bf9cb68c58" },
    { id: "1271564593746939904", effectDefinitionId: "1271564593746939904", label: "Straw and Steel Bundle", thumb: "https://cdn.discordapp.com/assets/content/f74068fee9a7e955b668e77f58c5166fe79822319b372156831a757bbe03852f" },
    { id: "1324454240768364554", effectDefinitionId: "1324454240768364554", label: "Blue Mooncaps Bundle", thumb: "https://cdn.discordapp.com/assets/content/9a2fa2e1e115f41683d9a648b24898fb2b6c3ddbb0e6705eb62cfe90295862c8" },
    { id: "1373015260344225833", effectDefinitionId: "1373015260344225833", label: "Tomura Shigaraki Bundle", thumb: "https://cdn.discordapp.com/assets/content/bcee47eb13cb3bd57f55acffd6a273231c9f461bdc1d9045d1dced628d836089" },
    { id: "1400163655617745037", effectDefinitionId: "1400163655617745037", label: "Mini Piccolo", thumb: "https://cdn.discordapp.com/assets/content/9f9cdc4c9df274987128748595957fccc72570fc7b64abded5cb0b2a9399ad07" },
    { id: "1341506443945181184", effectDefinitionId: "1341506443945181184", label: "Shatter (Blue)", thumb: "https://cdn.discordapp.com/assets/content/6a4e343fdb8e93cbf7196999a262e8bb8c0aebfd70eddd19820d0682ccaf99d7" },
    { id: "1481391634234085559", effectDefinitionId: "1481391634234085559", label: "Venom", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/d9edd2f8ed759e348497d49c5210fd7286ad2a58687b921bb0db68bbaf3b8ea8" },
    { id: "1394404301086134353", effectDefinitionId: "1394404301086134353", label: "Yunara's Aion Er'na Bundle", thumb: "https://cdn.discordapp.com/assets/content/c1faa6809070a72da9efa45d78ac58f18c6ca9ef114854938636a6f91b87b3b8" },
    { id: "1495807809747423302", effectDefinitionId: "1495807809747423302", label: "Star Struck", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/4492dd173c1627436bfc766b624b4aad3e07bccf23e1eb044a1114d4214f7d78" },
    { id: "1243619479645065287", effectDefinitionId: "1243619479645065287", label: "Heartthrob Bundle", thumb: "https://cdn.discordapp.com/assets/content/80f980817969963154b6b981d19fbb5eb3cbd1b06a5eacab1eb8cc0125aa480f" },
    { id: "1314020996990242816", effectDefinitionId: "1314020996990242816", label: "Deck the Halls (Ember)", thumb: "https://cdn.discordapp.com/assets/content/58c1790158f49dc36e606ff0fb7e529a47bf87577127e8d5279eeb910a004b18" },
    { id: "1373015260306604122", effectDefinitionId: "1373015260306604122", label: "Izuku Midoriya Bundle", thumb: "https://cdn.discordapp.com/assets/content/6ada09f6ecb8aa5e69004df9c53bc359447b2f1ef1d3f118e05c11c980e4fe09" },
    { id: "1468089594644791380", effectDefinitionId: "1468089594644791380", label: "Drifting Glow Bundle", thumb: "https://cdn.discordapp.com/media/v1/collectibles-shop/4493d8c327c3810c8d7e7f22a776b197e35e7f78d0539e435875bb15745240c8" },
    { id: "1402472280705204246", effectDefinitionId: "1402472280705204246", label: "Kawaii Clouds (Blue)", thumb: "https://cdn.discordapp.com/assets/content/eddf222293ff2b7649e1239108b92d54c54d40e20019b46f6dc92d27b737d7ec" },
    { id: "1341506444071010304", effectDefinitionId: "1341506444071010304", label: "Magical Girl Bundle", thumb: "https://cdn.discordapp.com/assets/content/540883afcbff841cd1f0fbddc8aa70ff4c3e4dea7229cc8189278736e7a5f1f0" },
    { id: "1400163655047188612", effectDefinitionId: "1400163655047188612", label: "Mini Goku Bundle", thumb: "https://cdn.discordapp.com/assets/content/5cbe7777f2629c89ec9b11b604aeaab76f499afb89b7ab153232c019413350cd" },
];

const NAMEPLATES = [
    // Flags
    { skuId: "1511102779819687956", label: "United States", thumbnail: "nameplates/united_states/1511102779819687956/static.png", emoji: "🇺🇸" },
    { skuId: "1511107752762544188", label: "England", thumbnail: "nameplates/england/1511107752762544188/static.png", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { skuId: "1511110083675688960", label: "Scotland", thumbnail: "nameplates/scotland/1511110083675688960/static.png", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { skuId: "1511108725333823568", label: "Germany", thumbnail: "nameplates/germany/1511108725333823568/static.png", emoji: "🇩🇪" },
    // Anime
    { skuId: "1428438925021548544", label: "Yuji Itadori", thumbnail: "nameplates/yuji_itadori/1428438925021548544/static.png", emoji: "🥊" },
    { skuId: "1428438925046714408", label: "Gojo", thumbnail: "nameplates/gojo/1428438925046714408/static.png", emoji: "👁️" },
    { skuId: "1400163655462555658", label: "Goku", thumbnail: "nameplates/goku/1400163655462555658/static.png", emoji: "⚡" },
    // Movies / TV
    { skuId: "1503450171587956917", label: "Mando & Grogu", thumbnail: "nameplates/mando_and_grogu/1503450171587956917/static.png", emoji: "🪖" },
    { skuId: "1481390337778913401", label: "Venom", thumbnail: "nameplates/venom/1481390337778913401/static.png", emoji: "🕷️" },
    { skuId: "1436367668990050304", label: "2035", thumbnail: "nameplates/2035/1436367668990050304/static.png", emoji: "🤖" },
    { skuId: "1377377712162738196", label: "Swords of Legends", thumbnail: "nameplates/swords_of_legends/1377377712162738196/static.png", emoji: "⚔️" },
    // Kawaii
    { skuId: "1488244924066566185", label: "Hello Kitty", thumbnail: "nameplates/hello_kitty/1488244924066566185/static.png", emoji: "🎀" },
    { skuId: "1488245817364975626", label: "Kuromi x My Melody", thumbnail: "nameplates/kuromi_x_my_melody/1488245817364975626/static.png", emoji: "🖤" },
    { skuId: "1488245478213816320", label: "Cinnamoroll", thumbnail: "nameplates/cinnamoroll/1488245478213816320/static.png", emoji: "☁️" },
    { skuId: "1377377712129179840", label: "Cosy Cat", thumbnail: "nameplates/cosy_cat/1377377712129179840/static.png", emoji: "🐱" },
    // Aesthetic
    { skuId: "1495806574269038713", label: "Star Struck", thumbnail: "nameplates/star_struck/1495806574269038713/static.png", emoji: "⭐" },
    { skuId: "1495806356999897240", label: "Cloud Nine", thumbnail: "nameplates/cloud_nine/1495806356999897240/static.png", emoji: "☁️" },
    { skuId: "1349849614257225760", label: "Vengeance", thumbnail: "nameplates/vengeance/1349849614257225760/static.png", emoji: "⚔️" },
    { skuId: "1382845914225442886", label: "Bonsai", thumbnail: "nameplates/bonsai/1382845914225442886/static.png", emoji: "🌸" },
    { skuId: "1498447882569908435", label: "Cherry Surprise", thumbnail: "nameplates/cherry_surprise/1498447882569908435/static.png", emoji: "🍒" },
    // Zodiac / Love
    { skuId: "1447654091026206894", label: "Leo", thumbnail: "nameplates/zodiac/leo/static.png", emoji: "♌" },
    { skuId: "1459194821372805192", label: "Love Meter", thumbnail: "nameplates/love_meter/1459194821372805192/static.png", emoji: "💕" },
    { skuId: "1459194821456691393", label: "Lone Wolf", thumbnail: "nameplates/lone_wolf/1459194821456691393/static.png", emoji: "🐺" },
];

// â”€â”€â”€ FIX 4: NAMEPLATE URL HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The correct Discord collectibles CDN pattern uses the full asset path + "static.png"
// We try multiple CDN hosts and both static/animated variants with correct path structure.
function getNameplateUrls(np) {
    const cdn = "https://cdn.discordapp.com/collectibles-assets/v1/";
    const media = "https://media.discordapp.net/collectibles-assets/v1/";
    return [
        `${cdn}${np.thumbnail}`,
        `${cdn}${np.thumbnail.replace("static.png", "animated.gif")}`,
        `${media}${np.thumbnail}`,
        `${media}${np.thumbnail.replace("static.png", "animated.gif")}`,
    ];
}

// â”€â”€â”€ FIX 4: NameplateBtn shows actual thumbnail image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tries every URL in sequence via onError chaining. Falls back to label text only
// if every single URL fails. Height increased to 56px so images are clearly visible.
// Use Discord's internal HTTP utils to fetch nameplate images with auth
const _npBlobCache: Record<string, string> = {};

async function fetchNameplateWithAuth(url: string): Promise<string | null> {
    if (_npBlobCache[url]) return _npBlobCache[url];
    try {
        // Try Discord's internal HTTP module which includes auth headers automatically
        const HTTPUtils = (window as any).DiscordNative?.http ?? (Vencord as any).Webpack?.findByProps?.("getAPIBaseURL");
        const token = (Vencord as any).Webpack?.findByProps?.("getToken")?.getToken?.();

        const headers: Record<string, string> = { "Accept": "image/png,image/*,*/*" };
        if (token) headers["Authorization"] = token;

        const res = await fetch(url, { headers, credentials: "include" });
        if (!res.ok) return null;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        _npBlobCache[url] = objectUrl;
        return objectUrl;
    } catch { return null; }
}

function NameplateBtn({ np, active, onClick }: { np: typeof NAMEPLATES[0]; active: boolean; onClick: () => void; }) {
    const urls = React.useMemo(() => getNameplateUrls(np), [np.skuId]);
    const [imgSrc, setImgSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setImgSrc(null);
        (async () => {
            for (const url of urls) {
                const src = await fetchNameplateWithAuth(url);
                if (cancelled) return;
                if (src) { setImgSrc(src); return; }
            }
        })();
        return () => { cancelled = true; };
    }, [np.skuId]);

    const emoji = (np as any).emoji ?? "";

    return (
        <button
            onClick={onClick}
            title={np.label}
            style={{
                padding: "0 10px",
                width: "100%",
                height: 56,
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: imgSrc ? "center" : "flex-start",
                gap: 8,
                position: "relative",
                border: active ? "2px solid #5865f2" : "2px solid var(--background-modifier-accent)",
                boxShadow: active ? "0 0 0 2px #5865f2" : "none",
                background: active ? "rgba(88,101,242,0.18)" : "var(--background-secondary)",
                flexShrink: 0,
                cursor: "pointer",
                transition: "border-color 0.1s, box-shadow 0.1s, background 0.1s",
            }}
        >
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={np.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", position: "absolute", inset: 0 }}
                />
            ) : (
                <>
                    {emoji && <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>}
                    <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--header-primary)",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                        lineHeight: 1.3,
                    }}>
                        {np.label}
                    </span>
                </>
            )}
        </button>
    );
}

interface CustomProfileData {
    username?: string;
    globalName?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: number;
    accentColor2?: number;
    pronouns?: string;
    badgeFlags?: number;
    createdAt?: string;
    nitro?: boolean;
    nitroLevel?: number;
    boostMonths?: number;
    email?: string;
    phone?: string;
    customBadgeIds?: string[];
    oldName?: string;
    decorationAsset?: string;
    nameplateSkuId?: string;
    profileEffectId?: string;
    copiedUserId?: string;
    displayNameFont?: number;
    displayNameEffect?: string;
    displayNameColor?: string;
    displayNameColor2?: string;
}

const LS_KEY_DATA = "FancordCP_data";
const LS_KEY_ENABLED = "FancordCP_enabled";
const DS_ALL_DATA = "customProfile_allData";
const DS_ALL_ENABLED = "customProfile_allEnabled";
const LS_ALL_DATA = "FancordCP_allData";
const LS_ALL_ENABLED = "FancordCP_allEnabled";

let storedData: CustomProfileData = {};
let isEnabled = false;
let domObserver: MutationObserver | null = null;

let cachedOriginalUser: any = null;
let cachedFakeUser: any = null;
let cachedDataHash: number = 0;
let _trueOriginalUser: any = null;
let _dataVersion: number = 0;
let allAccountsData: Record<string, CustomProfileData> = {};
let allAccountsEnabled: Record<string, boolean> = {};

// â”€â”€â”€ FONT DOM INJECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FONT_STYLE_ID = "cp-display-name-font";

function isUsernameOrDiscriminator(el: HTMLElement): boolean {
    const cls = el.className || "";
    return (
        /discriminator/i.test(cls) ||
        /subtitle/i.test(cls) ||
        /panelSubtitle/i.test(cls) ||
        /usernameTag/i.test(cls) ||
        /nameTag.*username/i.test(cls)
    );
}

function isDisplayNameOnly(el: HTMLElement): boolean {
    if (el.querySelector('[class*="discriminator"], [class*="subtitle"], [class*="panelSubtitle"]')) return false;
    const text = el.textContent?.trim() ?? "";
    if (/#\d{4}/.test(text)) return false;
    if (text.startsWith("@")) return false;
    return true;
}

// â”€â”€â”€ FIX 1: buildEffectCss â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// NEON: Use filter:drop-shadow so glow wraps letter shapes (not bounding box).
//       drop-shadow stacks multiple times to build up the glow.
//       Color is applied directly to text via color + -webkit-text-fill-color.
//       NO background, NO text-shadow (which boxes around the whole element).
//
// FIX 2: TOON: Set color THEN -webkit-text-stroke so the stroke paints over
//       the baseline color correctly. The old code set stroke first which
//       caused WebKit to replace the fill with black.
function buildEffectCss(effect: string, color: string, color2: string): string {
    const baseColor = color || "#00c8ff";
    const secondColor = color2 || color || "#ff40ff";

    switch (effect) {
        case "neon":
            // FIX 1: drop-shadow wraps individual letter outlines, not the bounding box.
            // Stack 4 drop-shadow calls to build up brightness. No background/text-shadow.
            return [
                `color: ${baseColor} !important`,
                `-webkit-text-fill-color: ${baseColor} !important`,
                `background: none !important`,
                `-webkit-background-clip: unset !important`,
                `background-clip: unset !important`,
                `text-shadow: none !important`,
                `filter:`,
            ].join(" ") + ";";

        case "gradient":
            return [
                `background: linear-gradient(90deg, ${baseColor}, ${secondColor}) !important`,
                `-webkit-background-clip: text !important`,
                `background-clip: text !important`,
                `-webkit-text-fill-color: transparent !important`,
                `color: transparent !important`,
                `text-shadow: none !important`,
                `filter: none !important`,
            ].join("; ") + ";";

        case "toon":
            // FIX 2: color must be set BEFORE -webkit-text-stroke, otherwise WebKit
            // interprets the stroke as overriding the fill and renders black.
            return [
                `color: ${baseColor} !important`,
                `-webkit-text-fill-color: ${baseColor} !important`,
                `font-weight: 900 !important`,
                `background: none !important`,
                `-webkit-background-clip: unset !important`,
                `background-clip: unset !important`,
                `text-shadow: none !important`,
                `filter: none !important`,
                `-webkit-text-stroke: 2px #000000 !important`,
                `paint-order: stroke fill !important`,
            ].join("; ") + ";";

        case "pop":
            return [
                `color: ${baseColor} !important`,
                `-webkit-text-fill-color: ${baseColor} !important`,
                `font-weight: 800 !important`,
                `background: none !important`,
                `-webkit-background-clip: unset !important`,
                `background-clip: unset !important`,
                `filter: none !important`,
                `text-shadow:`,
                `  1px 1px 0 #ffffff,`,
                `  2px 2px 0 rgba(255,255,255,.7),`,
                `  4px 4px 0 rgba(0,0,0,.25) !important`,
                `transform: translateY(-1px) !important`,
            ].join("; ") + ";";

        default: // solid
            if (color) {
                return [
                    `color: ${color} !important`,
                    `-webkit-text-fill-color: ${color} !important`,
                    `background: none !important`,
                    `-webkit-background-clip: unset !important`,
                    `background-clip: unset !important`,
                    `text-shadow: none !important`,
                    `filter: none !important`,
                ].join("; ") + ";";
            }
            return [
                `color: inherit !important`,
                `-webkit-text-fill-color: inherit !important`,
                `background: none !important`,
                `-webkit-background-clip: unset !important`,
                `background-clip: unset !important`,
                `text-shadow: none !important`,
                `filter: none !important`,
            ].join("; ") + ";";
    }
}

function applyInlineFontStyles(clear: boolean) {
    const elements = document.querySelectorAll("[data-cp-me]");
    if (clear || !isEnabled || !storedData.displayNameFont) {
        elements.forEach(el => {
            const h = el as HTMLElement;
            h.style.removeProperty("font-family");
            h.style.removeProperty("font-weight");
            h.style.removeProperty("font-style");
            h.style.removeProperty("color");
            h.style.removeProperty("-webkit-text-fill-color");
            h.style.removeProperty("text-shadow");
            h.style.removeProperty("background");
            h.style.removeProperty("-webkit-background-clip");
            h.style.removeProperty("background-clip");
            h.style.removeProperty("-webkit-text-stroke");
            h.style.removeProperty("filter");
            h.style.removeProperty("paint-order");
        });
        return;
    }

    const fontFamily = getFontFamilyById(storedData.displayNameFont);
    const fontWeight = getFontWeightById(storedData.displayNameFont);
    const fontItalic = getFontItalicById(storedData.displayNameFont);
    const color = storedData.displayNameColor ?? "";
    const color2 = storedData.displayNameColor2 ?? "";
    const effect = storedData.displayNameEffect ?? "solid";
    const baseColor = color || "#00c8ff";
    const secondColor = color2 || color || "#ff40ff";

    elements.forEach(el => {
        const h = el as HTMLElement;

        if (isUsernameOrDiscriminator(h)) {
            h.removeAttribute("data-cp-me");
            return;
        }
        if (!isDisplayNameOnly(h)) {
            h.removeAttribute("data-cp-me");
            return;
        }

        // Clear ALL effect props first
        h.style.removeProperty("background");
        h.style.removeProperty("-webkit-background-clip");
        h.style.removeProperty("background-clip");
        h.style.removeProperty("-webkit-text-stroke");
        h.style.removeProperty("text-shadow");
        h.style.removeProperty("color");
        h.style.removeProperty("-webkit-text-fill-color");
        h.style.removeProperty("filter");
        h.style.removeProperty("paint-order");

        h.style.setProperty("font-family", fontFamily, "important");
        h.style.setProperty("font-weight", String(fontWeight), "important");
        h.style.setProperty("font-style", fontItalic ? "italic" : "normal", "important");

        switch (effect) {
            case "neon":
                h.style.setProperty("color", baseColor, "important");
                h.style.setProperty("-webkit-text-fill-color", baseColor, "important");
                h.style.setProperty("text-shadow", `0 0 1px ${baseColor}, 0 0 5px ${baseColor}`, "important");
                h.style.setProperty("filter", "none", "important");
                break;

            case "gradient":
                h.style.setProperty("background", `linear-gradient(90deg, ${baseColor}, ${secondColor})`, "important");
                h.style.setProperty("-webkit-background-clip", "text", "important");
                h.style.setProperty("background-clip", "text", "important");
                h.style.setProperty("-webkit-text-fill-color", "transparent", "important");
                h.style.setProperty("color", "transparent", "important");
                break;
            case "toon":
                // FIX 2: Set fill color FIRST, then stroke. paint-order ensures stroke renders behind fill.
                h.style.setProperty("color", baseColor, "important");
                h.style.setProperty("-webkit-text-fill-color", baseColor, "important");
                h.style.setProperty("-webkit-text-stroke", "2px #000000", "important");
                h.style.setProperty("paint-order", "stroke fill", "important");
                break;
            case "pop":
                h.style.setProperty("color", baseColor, "important");
                h.style.setProperty("-webkit-text-fill-color", baseColor, "important");
                h.style.setProperty("text-shadow",
                    "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 0 #000", "important");
                break;
            default: // solid
                if (color) {
                    h.style.setProperty("color", color, "important");
                    h.style.setProperty("-webkit-text-fill-color", color, "important");
                }
                break;
        }
    });
}

function injectFontStyle() {
    const existing = document.getElementById(FONT_STYLE_ID);
    if (!isEnabled || !storedData.displayNameFont) {
        existing?.remove();
        applyInlineFontStyles(true);
        return;
    }

    const fontFamily = getFontFamilyById(storedData.displayNameFont);
    const fontWeight = getFontWeightById(storedData.displayNameFont);
    const fontItalic = getFontItalicById(storedData.displayNameFont);
    const color = storedData.displayNameColor ?? "";
    const color2 = storedData.displayNameColor2 ?? "";
    const effect = storedData.displayNameEffect ?? "solid";

    const effectCss = buildEffectCss(effect, color, color2);
    const sharedProps = `font-family: ${fontFamily} !important; font-weight: ${fontWeight} !important; font-style: ${fontItalic ? "italic" : "normal"} !important; ${effectCss}`;

    const css = `
        [data-cp-me] { ${sharedProps} }

        [class*="nameTag"] [class*="globalName"],
        [class*="nameTag"] [class*="displayName"],
        [class*="nameTag"] h2[class*="username"]:not([class*="discriminator"]):not([class*="subtitle"]):not([class*="panelSubtitle"]),

        [class*="accountProfileCard"] [class*="globalName"],
        [class*="accountProfileCard"] [class*="displayName"],

        [class*="accountProfile"] [class*="globalName"],
        [class*="accountProfile"] [class*="displayName"],

        [class*="userPopout"] [class*="globalName"],
        [class*="userPopout"] [class*="displayName"],

        [class*="userProfile"] [class*="globalName"],
        [class*="userProfile"] [class*="displayName"],

        [class*="profileBio"] [class*="globalName"],
        [class*="profileHeader"] [class*="globalName"],
        [class*="profileHeader"] [class*="displayName"],

        [class*="userProfileModal"] [class*="globalName"],
        [class*="userProfileModal"] [class*="displayName"],

        [class*="profileCard"] [class*="globalName"],
        [class*="profileCard"] [class*="displayName"],

        [data-cp-me][class*="globalName"],
        [data-cp-me][class*="displayName"],
        [data-cp-me][class*="headerText"],
        [data-cp-me][class*="roleColor"] { ${sharedProps} }
    `;

    if (existing) {
        existing.textContent = css;
    } else {
        const style = document.createElement("style");
        style.id = FONT_STYLE_ID;
        style.textContent = css;
        const inject = () => {
            if (document.head) document.head.appendChild(style);
            else setTimeout(inject, 50);
        };
        inject();
    }

    applyInlineFontStyles(false);
}

function removeFontStyle() {
    document.getElementById(FONT_STYLE_ID)?.remove();
    applyInlineFontStyles(true);
    document.querySelectorAll("[data-cp-me]").forEach(el => el.removeAttribute("data-cp-me"));
}

function stampOwnNameElements() {
    if (!isEnabled || !storedData.displayNameFont) return;

    const myDisplayNames = new Set<string>();
    if (storedData.globalName) myDisplayNames.add(storedData.globalName);
    try {
        const u = UserStore.getCurrentUser();
        if (u?.globalName) myDisplayNames.add(u.globalName);
        if (myDisplayNames.size === 0 && storedData.username) myDisplayNames.add(storedData.username);
        if (myDisplayNames.size === 0 && u?.username) myDisplayNames.add(u.username);
    } catch { }

    if (myDisplayNames.size === 0) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        const text = (node as Text).nodeValue?.trim();
        if (!text) continue;

        let matched = false;
        for (const name of myDisplayNames) {
            if (text === name) { matched = true; break; }
        }
        if (!matched) continue;

        const parent = node.parentElement;
        if (!parent) continue;

        if (isUsernameOrDiscriminator(parent)) continue;
        if (!isDisplayNameOnly(parent)) continue;

        if (!parent.hasAttribute("data-cp-me")) {
            parent.setAttribute("data-cp-me", "1");
        }

        const gp = parent.parentElement;
        if (gp && !isUsernameOrDiscriminator(gp) && isDisplayNameOnly(gp)) {
            const gpText = gp.textContent?.trim() ?? "";
            let gpMatch = false;
            for (const name of myDisplayNames) {
                if (gpText === name) { gpMatch = true; break; }
            }
            if (gpMatch && !gp.hasAttribute("data-cp-me")) {
                gp.setAttribute("data-cp-me", "1");
            }
        }
    }

    applyInlineFontStyles(false);
}

function saveDataSync(data: CustomProfileData, enabled: boolean) {
    try {
        localStorage.setItem(LS_KEY_DATA, JSON.stringify(data));
        localStorage.setItem(LS_KEY_ENABLED, enabled ? "1" : "0");
    } catch { }
}

function saveAllDataSync() {
    try {
        localStorage.setItem(LS_ALL_DATA, JSON.stringify(allAccountsData));
        localStorage.setItem(LS_ALL_ENABLED, JSON.stringify(allAccountsEnabled));
    } catch { }
}

function syncCurrentUserData() {
    const myId = _cachedMyId || AuthenticationStore?.getId?.();
    if (myId) {
        _cachedMyId = myId;
        storedData = allAccountsData[myId] || {};
        isEnabled = allAccountsEnabled[myId] || false;
    }
}

function loadDataSync() {
    try {
        const rawAll = localStorage.getItem(LS_ALL_DATA);
        if (rawAll) {
            try { allAccountsData = JSON.parse(rawAll); } catch { allAccountsData = {}; }
            const rawEnabled = localStorage.getItem(LS_ALL_ENABLED);
            try { allAccountsEnabled = rawEnabled ? JSON.parse(rawEnabled) : {}; } catch { allAccountsEnabled = {}; }
            syncCurrentUserData();
            if (!storedData || Object.keys(storedData).length === 0) {
                const rawOld = localStorage.getItem(LS_KEY_DATA);
                const enOld = localStorage.getItem(LS_KEY_ENABLED);
                if (rawOld) {
                    try { storedData = JSON.parse(rawOld); } catch { storedData = {}; }
                    isEnabled = enOld === "1";
                }
            }
            return;
        }
        const raw = localStorage.getItem(LS_KEY_DATA);
        const en = localStorage.getItem(LS_KEY_ENABLED);
        if (raw) { try { storedData = JSON.parse(raw); } catch { storedData = {}; } }
        else storedData = {};
        isEnabled = en === "1";
    } catch {
        storedData = {};
        isEnabled = false;
    }
}

function onAccountSwitch() {
    updateCachedRealData();
    syncCurrentUserData();
    cachedFakeUser = null;
    cachedOriginalUser = null;
    _trueOriginalUser = null;
    _dataVersion++;
    _realUsername = "";
    _realGlobalName = "";
    if (isEnabled) {
        startDomObserver();
        injectFontStyle();
    } else {
        stopDomObserver();
        removeFontStyle();
    }
    forceAccountPanelRerender();
}

loadDataSync();

const HIDE_STYLE_ID = "cp-hide-during-load";
function injectHideStyle() {
    if (!isEnabled) return;
    if (document.getElementById(HIDE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = HIDE_STYLE_ID;
    style.textContent = `
        [class*='nameTag'] [class*='username'],
        [class*='nameTag'] [class*='discriminator'],
        [class*='nameTag'] [class*='panelSubtitle']
        { color: transparent !important; }
        [class*='accountProfilePopout'] [class*='avatarWrap'] img,
        [class*='accountProfilePopout'] [class*='avatarWrap'] svg
        { opacity: 0 !important; }
    `;
    const inject = () => {
        if (!document.head) { requestAnimationFrame(inject); return; }
        document.head.appendChild(style);
    };
    inject();
}
function removeHideStyle() {
    document.getElementById(HIDE_STYLE_ID)?.remove();
}
if (isEnabled) injectHideStyle();

let _avatarPatchApplied = false;
function applyAvatarPatchEarly() {
    if (_avatarPatchApplied || !isEnabled || !storedData.avatar) return;
    try {
        const IU = (window as any).Vencord?.Webpack?.findByProps?.("getUserAvatarURL");
        if (!IU?.getUserAvatarURL) return;
        const orig = IU.getUserAvatarURL;
        IU.getUserAvatarURL = function (user: any, ...args: any[]) {
            if (isEnabled && storedData.avatar) {
                const uid = user?.id ?? user?.userId;
                if (uid && isMe(uid)) return storedData.avatar;
            }
            return orig(user, ...args);
        };
        _avatarPatchApplied = true;
    } catch { }
}

async function loadData() {
    try {
        const allData = await DataStore.get(DS_ALL_DATA) as Record<string, CustomProfileData> | null;
        const allEnabled = await DataStore.get(DS_ALL_ENABLED) as Record<string, boolean> | null;
        if (allData && typeof allData === "object" && Object.keys(allData).length > 0) {
            allAccountsData = allData;
            allAccountsEnabled = allEnabled || {};
            syncCurrentUserData();
            saveAllDataSync();
            saveDataSync(storedData, isEnabled);
            return;
        }
        const d = await DataStore.get(DS_KEY) as CustomProfileData | null;
        const e = await DataStore.get(DS_ENABLED) as boolean | null;
        if (d !== null) storedData = d;
        if (e !== null) isEnabled = e === true;
        const myId = AuthenticationStore?.getId?.();
        if (myId && storedData && Object.keys(storedData).length > 0) {
            allAccountsData[myId] = storedData;
            allAccountsEnabled[myId] = isEnabled;
            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
            saveAllDataSync();
        }
        saveDataSync(storedData, isEnabled);
    } catch (err) { }
}

async function copyUserProfile(userId: string) {
    try {
        const user = UserStore.getUser(userId) as any;
        if (!user) return;

        const { findByProps } = await import("@webpack") as any;
        const UserProfileStore = findByProps("getUserProfile", "getGuildMemberProfile") as any;
        const IU = IconUtils as any;
        const profile = UserProfileStore?.getUserProfile?.(userId) ?? {};

        const newData: CustomProfileData = {
            username: user.username || "",
            globalName: user.globalName || "",
            pronouns: "",
            bio: "",
            accentColor: undefined,
            accentColor2: undefined,
            banner: "",
            avatar: "",
            badgeFlags: 0,
            customBadgeIds: [],
            nitro: false,
            nitroLevel: -1,
            boostMonths: -1,
            decorationAsset: undefined,
            nameplateSkuId: undefined,
            profileEffectId: undefined,
            createdAt: undefined,
            copiedUserId: userId
        };

        if (user.bio !== undefined) newData.bio = user.bio || "";
        if (profile.bio !== undefined) newData.bio = profile.bio || "";

        try {
            const avatarUrl = IU?.getUserAvatarURL?.(user, false, 512)
                ?? (user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=512` : null);
            if (avatarUrl) newData.avatar = avatarUrl;
        } catch { }

        const hasNitro = (profile.premiumType ?? 0) > 0;
        newData.nitro = hasNitro;

        if (hasNitro) {
            const premiumSince = profile.premiumSince ?? user.premiumSince ?? null;
            if (premiumSince) {
                const months = Math.floor((Date.now() - new Date(premiumSince).getTime()) / (1000 * 60 * 60 * 24 * 30));
                if (months >= 72) newData.nitroLevel = 7;
                else if (months >= 36) newData.nitroLevel = 6;
                else if (months >= 24) newData.nitroLevel = 5;
                else if (months >= 12) newData.nitroLevel = 4;
                else if (months >= 6) newData.nitroLevel = 3;
                else if (months >= 3) newData.nitroLevel = 2;
                else if (months >= 2) newData.nitroLevel = 1;
                else newData.nitroLevel = 0;
            } else {
                newData.nitroLevel = 0;
            }
        }

        const boostSince = profile.premiumGuildSince ?? null;
        if (boostSince) {
            const bMonths = Math.floor((Date.now() - new Date(boostSince).getTime()) / (1000 * 60 * 60 * 24 * 30));
            if (bMonths >= 24) newData.boostMonths = 8;
            else if (bMonths >= 18) newData.boostMonths = 7;
            else if (bMonths >= 15) newData.boostMonths = 6;
            else if (bMonths >= 12) newData.boostMonths = 5;
            else if (bMonths >= 9) newData.boostMonths = 4;
            else if (bMonths >= 6) newData.boostMonths = 3;
            else if (bMonths >= 3) newData.boostMonths = 2;
            else if (bMonths >= 2) newData.boostMonths = 1;
            else newData.boostMonths = 0;
        }

        const bannerId = profile.banner ?? user.banner ?? null;
        if (bannerId) newData.banner = `https://cdn.discordapp.com/banners/${userId}/${bannerId}.${bannerId.startsWith("a_") ? "gif" : "png"}?size=512`;

        if (profile.accentColor !== undefined) newData.accentColor = profile.accentColor;
        else if (user.accentColor !== undefined) newData.accentColor = user.accentColor;

        try {
            const ms = Number(BigInt(userId) >> 22n) + 1420070400000;
            newData.createdAt = new Date(ms).toISOString().slice(0, 10);
        } catch { }

        try {
            const flags = user.publicFlags ?? 0;
            let badgeFlags = 0;
            for (const { flag } of BADGES) { if (flags & flag) badgeFlags |= flag; }
            newData.badgeFlags = badgeFlags;
            if (user.avatarDecorationData?.asset) newData.decorationAsset = user.avatarDecorationData.asset;
        } catch { }

        newData.copiedUserId = userId;
        storedData = newData;
        isEnabled = true;
        saveDataSync(newData, true);
        DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
        DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });

        forceAccountPanelRerender();
    } catch (err) {
        console.error("[CustomProfile] copyUserProfile error:", err);
    }
}

const userContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: any) => {
    if (!children || !Array.isArray(children) || !user || !user.id) return;
    try {
        const me = UserStore.getCurrentUser();
        if (!me || user.id === me.id) return;
        const isCopied = isEnabled && storedData.copiedUserId === user.id;

        children.push(
            <Menu.MenuGroup>
                {isCopied ? (
                    <Menu.MenuItem
                        id="remove-copy-profile"
                        label={t("Remove copy profile")}
                        color="danger"
                        action={() => {
                            try {
                                const myId = AuthenticationStore?.getId?.();
                                if (myId) {
                                    delete allAccountsData[myId];
                                    delete allAccountsEnabled[myId];
                                }
                                storedData = {};
                                isEnabled = false;
                                cachedFakeUser = null;
                                cachedOriginalUser = null;
                                _trueOriginalUser = null;
                                _dataVersion++;
                                saveDataSync({}, false);
                                saveAllDataSync();
                                DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
                                DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
                                forceAccountPanelRerender();
                            } catch (e) {
                                console.error("[CustomProfile] Error removing copy:", e);
                            }
                        }}
                    />
                ) : (
                    <Menu.MenuItem
                        id="copy-user-profile"
                        label={t("Copy this profile")}
                        action={() => copyUserProfile(user.id)}
                    />
                )}
            </Menu.MenuGroup>
        );
    } catch (err) {
        console.error("[CustomProfile] Context menu patch error:", err);
    }
};

function getRealNames(): { username: string | null; globalName: string | null; } {
    try {
        const u = UserStore.getCurrentUser();
        return { username: u?.username ?? null, globalName: u?.globalName ?? null };
    } catch { return { username: null, globalName: null }; }
}

function getRealDateVariants(): string[] {
    try {
        const u = UserStore.getCurrentUser();
        if (!u?.id) return [];
        const ms = Number(BigInt(u.id) >> 22n) + 1420070400000;
        const d = new Date(ms);
        const variants = new Set<string>();
        const locales = ["en-US", "en-GB", "fr-FR", "de-DE", "it-IT", navigator.language];
        const fmtSpecs: Intl.DateTimeFormatOptions[] = [
            { day: "numeric", month: "short", year: "numeric" },
            { day: "numeric", month: "long", year: "numeric" },
            { month: "short", day: "numeric", year: "numeric" },
            { month: "long", day: "numeric", year: "numeric" },
            { day: "2-digit", month: "2-digit", year: "numeric" },
        ];
        for (const loc of locales) {
            for (const fmt of fmtSpecs) {
                try {
                    const s = new Intl.DateTimeFormat(loc, fmt).format(d);
                    variants.add(s); variants.add(s.replace(/\s/g, " ")); variants.add(s.replace(/\s/g, "\u00a0"));
                } catch { }
            }
        }
        const day = d.getDate(); const year = d.getFullYear();
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const mS = monthsShort[d.getMonth()]; const mL = monthsLong[d.getMonth()];
        const patterns = [`${day} ${mS} ${year}`, `${day} ${mL} ${year}`, `${mS} ${day}, ${year}`, `${mL} ${day}, ${year}`, d.toISOString().slice(0, 10)];
        for (const p of patterns) { variants.add(p); variants.add(p.replace(/ /g, "\u00a0")); variants.add(p.replace(/\u00a0/g, " ")); }
        variants.add(year.toString());
        return [...variants].filter(v => v.length >= 4);
    } catch { return []; }
}

function getFakeDateVariants(isoDate: string): string[] {
    try {
        const d = new Date(isoDate + "T12:00:00Z");
        const variants = new Set<string>();
        const fmtSpecs: Intl.DateTimeFormatOptions[] = [
            { day: "numeric", month: "short", year: "numeric" },
            { day: "numeric", month: "long", year: "numeric" },
            { month: "short", day: "numeric", year: "numeric" },
            { month: "long", day: "numeric", year: "numeric" },
        ];
        for (const fmt of fmtSpecs) {
            try { variants.add(new Intl.DateTimeFormat(navigator.language, fmt).format(d)); } catch { }
        }
        return [...variants];
    } catch { return []; }
}

let _cachedMyId: string | null = null;
let _realUsername = "";
let _realGlobalName = "";

function updateCachedRealData() {
    try { const myId = AuthenticationStore?.getId?.(); if (myId) _cachedMyId = myId; } catch { }
}

let _domQueued = false;
let _domMutations: MutationRecord[] = [];

function scanTextNode(node: Text) {
    if (!isEnabled || !node.nodeValue) return;
    const val = (node as any).__cp_orig || node.nodeValue;
    let result = val;
    try {
        if (_trueOriginalUser) {
            _realUsername = _trueOriginalUser.username || _realUsername;
            _realGlobalName = _trueOriginalUser.globalName || _realGlobalName;
        }
    } catch { }
    let replaced = false;
    if (storedData.createdAt) {
        const realDates = getRealDateVariants();
        const fakeDates = getFakeDateVariants(storedData.createdAt);
        if (realDates.length > 0 && fakeDates.length > 0) {
            for (const realDate of realDates) {
                if (realDate.length >= 4 && (val.includes(realDate) || val.toLowerCase().includes(realDate.toLowerCase()))) {
                    result = result.split(realDate).join(fakeDates[0]);
                    replaced = true;
                }
            }
        }
    }
    if (_realUsername && storedData.username && result.includes(_realUsername)) { result = result.split(_realUsername).join(storedData.username); replaced = true; }
    if (_realGlobalName && storedData.globalName && result.includes(_realGlobalName)) { result = result.split(_realGlobalName).join(storedData.globalName); replaced = true; }
    if (replaced && result !== node.nodeValue) {
        if ((node as any).__cp_orig === undefined) (node as any).__cp_orig = val;
        node.nodeValue = result;
    }
}

function scanNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) { scanTextNode(node as Text); return; }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) scanTextNode(n as Text);
}

function processDomBatch() {
    _domQueued = false;
    if (!isEnabled) { _domMutations = []; return; }
    const batch = _domMutations; _domMutations = [];
    for (const m of batch) {
        if (m.type === "characterData") scanTextNode(m.target as Text);
        else for (const n of m.addedNodes) scanNode(n);
    }
    if (storedData.displayNameFont) stampOwnNameElements();
}

function startDomObserver() {
    stopDomObserver();
    if (!isEnabled) return;
    scanNode(document.body);
    if (storedData.displayNameFont) stampOwnNameElements();
    domObserver = new MutationObserver(mutations => {
        if (!isEnabled || !mutations.length) return;
        _domMutations.push(...mutations);
        if (!_domQueued) { _domQueued = true; setTimeout(() => requestAnimationFrame(processDomBatch), 10); }
    });
    domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopDomObserver() {
    domObserver?.disconnect();
    domObserver = null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
        if ((n as any).__cp_orig !== undefined) { n.nodeValue = (n as any).__cp_orig; delete (n as any).__cp_orig; }
    }
    document.querySelectorAll("[data-cp-me]").forEach(el => el.removeAttribute("data-cp-me"));
}

function isMe(userId: string | null | undefined): boolean {
    if (!userId) return false;
    if (_cachedMyId) return _cachedMyId === userId;
    try { const myId = AuthenticationStore?.getId?.(); if (myId) { _cachedMyId = myId; return myId === userId; } } catch { }
    return false;
}

function EditIcon({ size = 18 }: { size?: number; }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>;
}
function FolderIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" /></svg>;
}
function CloseIcon() {
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function TrashIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.1l-.9 12.1A3 3 0 0 1 17 23H7a3 3 0 0 1-3-2.9L3.1 8H2a1 1 0 0 1 0-2h4V4Zm2 0v2h6V4H9ZM5.1 8l.9 11.9a1 1 0 0 0 1 .1h6a1 1 0 0 0 1-.1L14.9 8H5.1Z" /></svg>;
}
function SaveIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></svg>;
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties; }) {
    return <div className="cp-section-label" style={style}>{children}</div>;
}

function Field({ label, value, placeholder, onChange, type = "text" }: {
    label: string; value: string; placeholder?: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <input className="cp-input" type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
    const fileRef = React.useRef<HTMLInputElement>(null);
    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { if (ev.target?.result) onChange(ev.target.result as string); };
        reader.readAsDataURL(file);
    }
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <div className="cp-image-row">
                <input className="cp-input cp-url-input" placeholder={t("Image URL...")} value={value.startsWith("data:") ? "" : value} onChange={e => onChange(e.target.value)} />
                <button className="cp-file-btn" onClick={() => fileRef.current?.click()} title={t("Choose a file")}><FolderIcon /></button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                {value && <>
                    <img src={value} alt="" className="cp-preview-avatar" />
                    <button className="cp-clear-btn" onClick={() => onChange("")} title={t("Delete")}><CloseIcon /></button>
                </>}
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange, sublabel }: { label: string; checked: boolean; onChange: (v: boolean) => void; sublabel?: string; }) {
    return (
        <div className="cp-toggle-row" onClick={() => onChange(!checked)}>
            <div className="cp-toggle-text">
                <span className="cp-toggle-label">{label}</span>
                {sublabel && <span className="cp-toggle-sub">{sublabel}</span>}
            </div>
            <div className={`cp-toggle ${checked ? "cp-toggle--on" : ""}`}><div className="cp-toggle-thumb" /></div>
        </div>
    );
}

function BadgeBtn({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void; }) {
    return (
        <button onClick={onClick} className={`cp-badge ${active ? "cp-badge--on" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {icon && <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />}
            <span>{label}</span>
        </button>
    );
}

function BadgePicker({ selected, onChange, nitroType, onNitroType, boostLevel, onBoostLevel, customIds, onCustomIds, oldName, onOldName }: {
    selected: number; onChange: (v: number) => void;
    nitroType: number; onNitroType: (v: number) => void;
    boostLevel: number; onBoostLevel: (v: number) => void;
    customIds: string[]; onCustomIds: (v: string[]) => void;
    oldName: string; onOldName: (v: string) => void;
}) {
    const hasOldName = customIds.includes("oldname");
    return (
        <div className="cp-field">
            <SectionLabel>{t("Badges")}</SectionLabel>
            <div className="cp-badges">
                {BADGES.map(b => (
                    <BadgeBtn key={b.flag} label={b.label} icon={b.icon}
                        active={!!(selected & b.flag)} onClick={() => onChange(selected ^ b.flag)} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{t("Evolving Nitro Badge")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("None")} active={nitroType === -1} onClick={() => onNitroType(-1)} />
                {NITRO_LEVELS.map((n, i) => (
                    <BadgeBtn key={i} label={n.label} icon={n.icon} active={nitroType === i} onClick={() => onNitroType(i)} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{t("Special Badges")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("Completed a quest")}
                    icon="https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png"
                    active={customIds.includes("quest")}
                    onClick={() => onCustomIds(customIds.includes("quest") ? customIds.filter(x => x !== "quest") : [...customIds, "quest"])} />
                <BadgeBtn label={t("Orbs â€” Apprentice")}
                    icon="https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png"
                    active={customIds.includes("orbs")}
                    onClick={() => onCustomIds(customIds.includes("orbs") ? customIds.filter(x => x !== "orbs") : [...customIds, "orbs"])} />
                <BadgeBtn label={t("Old username")} icon={OLD_NAME_BADGE_ICON} active={hasOldName}
                    onClick={() => onCustomIds(hasOldName ? customIds.filter(x => x !== "oldname") : [...customIds, "oldname"])} />
            </div>
            {hasOldName && (
                <div className="cp-field" style={{ marginTop: 6 }}>
                    <SectionLabel style={{ marginTop: 0 }}>{t("Old username displayed in tooltip")}</SectionLabel>
                    <input className="cp-input" value={oldName} placeholder="OldUser#0000"
                        onChange={e => onOldName(e.target.value)} />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        {t('Ex : Triggerr#5954 â€” will appear as "Old username: Triggerr#5954" when hovering the badge.')}
                    </div>
                </div>
            )}
            <SectionLabel style={{ marginTop: 8 }}>{t("Boost Badge (Server Booster)")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={t("None")} active={boostLevel === -1} onClick={() => onBoostLevel(-1)} />
                {BOOST_LABELS.map((lbl, i) => (
                    <BadgeBtn key={i} label={lbl} icon={BOOST_ICONS[i]} active={boostLevel === i} onClick={() => onBoostLevel(i)} />
                ))}
            </div>
        </div>
    );
}

// â”€â”€â”€ FONT PICKER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FontPicker({ fontId, effect, color, color2, onFontId, onEffect, onColor, onColor2, displayName }: {
    fontId: number;
    effect: string;
    color: string;
    color2: string;
    onFontId: (v: number) => void;
    onEffect: (v: string) => void;
    onColor: (v: string) => void;
    onColor2: (v: string) => void;
    displayName: string;
}) {
    const [localFontId, setLocalFontId] = React.useState(fontId);
    const [localEffect, setLocalEffect] = React.useState(effect || "solid");
    const [localColor, setLocalColor] = React.useState(color || "");
    const [localColor2, setLocalColor2] = React.useState(color2 || "");

    React.useEffect(() => { setLocalFontId(fontId); }, [fontId]);
    React.useEffect(() => { setLocalEffect(effect || "solid"); }, [effect]);
    React.useEffect(() => { setLocalColor(color || ""); }, [color]);
    React.useEffect(() => { setLocalColor2(color2 || ""); }, [color2]);

    function handleFontId(v: number) {
        setLocalFontId(v);
        onFontId(v);
        storedData.displayNameFont = v;
        injectFontStyle();
        requestAnimationFrame(() => stampOwnNameElements());
    }
    function handleEffect(v: string) {
        setLocalEffect(v);
        onEffect(v);
        storedData.displayNameEffect = v;
        injectFontStyle();
        requestAnimationFrame(() => stampOwnNameElements());
    }
    function handleColor(v: string) {
        setLocalColor(v);
        onColor(v);
        storedData.displayNameColor = v || undefined;
        injectFontStyle();
        requestAnimationFrame(() => stampOwnNameElements());
    }
    function handleColor2(v: string) {
        setLocalColor2(v);
        onColor2(v);
        storedData.displayNameColor2 = v || undefined;
        injectFontStyle();
        requestAnimationFrame(() => stampOwnNameElements());
    }

    const previewFont = DISPLAY_NAME_FONTS.find(f => f.fontId === localFontId) ?? DISPLAY_NAME_FONTS[0];
    const baseColor = localColor || "#00c8ff";
    const secondColor = localColor2 || localColor || "#ff40ff";

    const previewText = React.useMemo(() => {
        if (displayName && displayName.trim()) return displayName.trim();
        if (storedData.globalName?.trim()) return storedData.globalName.trim();
        if (storedData.username?.trim()) return storedData.username.trim();
        try {
            const u = UserStore.getCurrentUser();
            if (u?.globalName?.trim()) return u.globalName.trim();
            if (u?.username?.trim()) return u.username.trim();
        } catch { }
        return "Display Name";
    }, [displayName]);

    // â”€â”€â”€ Build preview style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const previewStyle: React.CSSProperties = {
        fontFamily: previewFont.family,
        fontWeight: previewFont.weight,
        fontStyle: previewFont.italic ? "italic" : "normal",
        fontSize: localFontId === 6 ? 13 : 22,
        lineHeight: 1.3,
        transition: "all 0.15s",
        display: "inline-block",
    };

    switch (localEffect) {
        case "neon":
            // FIX 1: Use drop-shadow in preview too, matching DOM injection exactly
            previewStyle.color = baseColor;
            (previewStyle as any).WebkitTextFillColor = baseColor;
            (previewStyle as any).filter = `drop-shadow(0 0 2px ${baseColor}) drop-shadow(0 0 6px ${baseColor}) drop-shadow(0 0 12px ${baseColor}) drop-shadow(0 0 20px ${baseColor})`;
            break;
        case "gradient":
            previewStyle.background = `linear-gradient(90deg, ${baseColor}, ${secondColor})`;
            previewStyle.WebkitBackgroundClip = "text";
            (previewStyle as any).WebkitTextFillColor = "transparent";
            previewStyle.backgroundClip = "text";
            previewStyle.color = "transparent";
            break;
        case "toon":
            // FIX 2: color set before stroke in inline styles too
            previewStyle.color = baseColor;
            (previewStyle as any).WebkitTextFillColor = baseColor;
            (previewStyle as any).WebkitTextStroke = "2px #000000";
            (previewStyle as any).paintOrder = "stroke fill";
            break;
        case "pop":
            previewStyle.color = baseColor;
            (previewStyle as any).WebkitTextFillColor = baseColor;
            previewStyle.textShadow = "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 0 #000";
            break;
        default: // solid
            previewStyle.color = localColor || "var(--header-primary)";
            break;
    }

    const isGradient = localEffect === "gradient";

    return (
        <div className="cp-field">
            <SectionLabel>{t("Display Name Style (Nitro)")}</SectionLabel>

            <div style={{ marginBottom: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("Choose Font")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
                {DISPLAY_NAME_FONTS.map(font => (
                    <button
                        key={font.fontId}
                        onClick={() => handleFontId(font.fontId)}
                        title={font.label}
                        className={`cp-badge ${localFontId === font.fontId ? "cp-badge--on" : ""}`}
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "10px 4px 6px", height: 68,
                            borderRadius: 8, gap: 4,
                        }}
                    >
                        <span style={{
                            fontFamily: font.family,
                            fontSize: font.fontId === 6 ? 12 : 22,
                            lineHeight: 1.2,
                            fontWeight: font.weight,
                            fontStyle: font.italic ? "italic" : "normal",
                            color: "var(--header-primary)",
                        }}>
                            {font.sample}
                        </span>
                        <span style={{ fontSize: 9, opacity: 0.65, letterSpacing: 0.2, textTransform: "uppercase" }}>
                            {font.label}
                        </span>
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("Choose Effect")}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {DISPLAY_NAME_EFFECTS.map(ef => (
                    <button
                        key={ef.id}
                        onClick={() => handleEffect(ef.id)}
                        className={`cp-badge ${localEffect === ef.id ? "cp-badge--on" : ""}`}
                        style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
                    >
                        {ef.label}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isGradient ? t("Gradient Colours") : t("Choose Colour")}
            </div>

            {isGradient ? (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>{t("Colour 1")}</div>
                            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                                <input
                                    type="color"
                                    value={localColor || "#00c8ff"}
                                    onChange={e => handleColor(e.target.value)}
                                    style={{ width: 36, height: 36, borderRadius: 6, border: "2px solid var(--background-modifier-accent)", padding: 2, cursor: "pointer", background: "none" }}
                                />
                                <button
                                    onClick={() => handleColor("")}
                                    className={`cp-badge ${!localColor ? "cp-badge--on" : ""}`}
                                    style={{ width: 32, height: 32, borderRadius: 6, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    title={t("Default")}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", height: 36, marginTop: 20, color: "var(--text-muted)", fontSize: 18 }}>â†’</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>{t("Colour 2")}</div>
                            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                                <input
                                    type="color"
                                    value={localColor2 || "#ff40ff"}
                                    onChange={e => handleColor2(e.target.value)}
                                    style={{ width: 36, height: 36, borderRadius: 6, border: "2px solid var(--background-modifier-accent)", padding: 2, cursor: "pointer", background: "none" }}
                                />
                                <button
                                    onClick={() => handleColor2("")}
                                    className={`cp-badge ${!localColor2 ? "cp-badge--on" : ""}`}
                                    style={{ width: 32, height: 32, borderRadius: 6, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    title={t("Default")}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>{t("Presets")}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {GRADIENT_PRESETS.map((gp, i) => (
                            <button
                                key={i}
                                onClick={() => { handleColor(gp.from); handleColor2(gp.to); }}
                                style={{
                                    width: 36, height: 36, borderRadius: 6, padding: 0, cursor: "pointer", flexShrink: 0,
                                    background: `linear-gradient(135deg, ${gp.from}, ${gp.to})`,
                                    border: (localColor === gp.from && localColor2 === gp.to) ? "2px solid #5865f2" : "2px solid transparent",
                                    outline: (localColor === gp.from && localColor2 === gp.to) ? "1px solid #5865f2" : "none",
                                }}
                                title={`${gp.from} â†’ ${gp.to}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
                    <button
                        onClick={() => handleColor("")}
                        className={`cp-badge ${!localColor ? "cp-badge--on" : ""}`}
                        style={{ width: 32, height: 32, borderRadius: 6, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={t("Default")}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                    <input
                        type="color"
                        value={localColor || "#ffffff"}
                        onChange={e => handleColor(e.target.value)}
                        style={{ width: 32, height: 32, borderRadius: 6, border: "2px solid var(--background-modifier-accent)", padding: 2, cursor: "pointer", background: "none" }}
                        title={t("Custom colour")}
                    />
                    {DISPLAY_NAME_SOLID_COLORS.map(hex => (
                        <button
                            key={hex}
                            onClick={() => handleColor(hex)}
                            style={{
                                width: 28, height: 28, borderRadius: 6, background: hex,
                                border: localColor === hex ? "2px solid #5865f2" : "2px solid transparent",
                                outline: localColor === hex ? "1px solid #5865f2" : "none",
                                cursor: "pointer", padding: 0, flexShrink: 0,
                            }}
                            title={hex}
                        />
                    ))}
                </div>
            )}

            <div style={{ background: "var(--background-secondary)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{t("Preview:")}</span>
                <span style={previewStyle}>{previewText}</span>
            </div>

            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {t("Font, effect, and colour apply locally. Requires Nitro to show to others.")}
            </div>
        </div>
    );
}

function forceAccountPanelRerender() {
    try {
        const WP = (Vencord as any).Webpack;
        const UserStore = WP?.findByStoreName("UserStore");
        if (UserStore?.emitChange) UserStore.emitChange();

        const UPS = WP?.findByStoreName("UserProfileStore");
        if (UPS?.emitChange) UPS.emitChange();

        const MAS = WP?.findByProps?.("getUsers", "getValidUsers", "getHasLoggedInAccounts");
        if (MAS?.emitChange) MAS.emitChange();

        FluxDispatcher.dispatch({ type: "USER_SETTINGS_PROTO_UPDATE", settings: { type: 1, proto: {} } });

        if (isEnabled) {
            startDomObserver();
            injectFontStyle();
        } else {
            stopDomObserver();
            removeFontStyle();
        }
    } catch { }
}

function CustomProfileModal({ rootProps }: { rootProps: any; }) {
    const myId = AuthenticationStore?.getId?.() || "";
    const [selectedAccountId, setSelectedAccountId] = React.useState(myId);
    const [data, setData] = React.useState<CustomProfileData>(() => ({ ...(allAccountsData[myId] || storedData || {}) }));
    const [saving, setSaving] = React.useState(false);
    const [saveCount, setSaveCount] = React.useState(0);

    const dataRef = React.useRef(data);
    React.useEffect(() => { dataRef.current = data; }, [data]);

    const nitroLevel = data.nitroLevel ?? -1;
    const boostLevel = data.boostMonths ?? -1;
    const customIds = data.customBadgeIds ?? [];
    const oldName = data.oldName ?? "";

    const previewDisplayName = React.useMemo(() => {
        if (data.globalName?.trim()) return data.globalName.trim();
        if (data.username?.trim()) return data.username.trim();
        try {
            const u = UserStore.getCurrentUser();
            if (u?.globalName?.trim()) return u.globalName.trim();
            if (u?.username?.trim()) return u.username.trim();
        } catch { }
        return "";
    }, [data.globalName, data.username]);

    const accounts = React.useMemo(() => {
        try {
            const MAS = (window as any).Vencord?.Webpack?.findByProps?.("getUsers", "getValidUsers");
            if (MAS?.getUsers) {
                const users = MAS.getUsers();
                if (Array.isArray(users) && users.length > 0) return users;
            }
            const internalStore = (window as any).Vencord?.Webpack?.findStore?.("MultiAccountStore");
            if (internalStore?.getUsers) {
                const users = internalStore.getUsers();
                if (Array.isArray(users) && users.length > 0) return users;
            }
        } catch (e) { console.error("[CustomProfile] Failed to fetch accounts:", e); }
        const me = UserStore.getCurrentUser();
        return me ? [me, { ...me, id: "debug-placeholder", username: "Second Account?", globalName: "Simulation" }] : [];
    }, []);

    React.useEffect(() => {
        const newData = allAccountsData[selectedAccountId] || {};
        setData({ ...newData });
    }, [selectedAccountId]);

    function set<K extends keyof CustomProfileData>(key: K, val: CustomProfileData[K]) {
        setData(d => ({ ...d, [key]: val }));
    }

    async function save() {
        try {
            setSaving(true);
            const savedData = { ...dataRef.current };
            allAccountsData[selectedAccountId] = savedData;
            allAccountsEnabled[selectedAccountId] = true;
            if (selectedAccountId === myId) {
                storedData = savedData;
                isEnabled = true;
                cachedFakeUser = null;
                cachedOriginalUser = null;
                _dataVersion++;
                saveDataSync(storedData, true);

                if (storedData.displayNameFont) {
                    injectFontStyle();
                    requestAnimationFrame(() => stampOwnNameElements());
                } else {
                    removeFontStyle();
                }
            }
            saveAllDataSync();
            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
            updateCachedRealData();
            forceAccountPanelRerender();
            setSaveCount(c => c + 1);
        } catch (err) {
            console.error("[CustomProfile] save error:", err);
        } finally {
            setSaving(false);
            rootProps.onClose();
        }
    }

    async function reset() {
        delete allAccountsData[selectedAccountId];
        delete allAccountsEnabled[selectedAccountId];
        if (selectedAccountId === myId) {
            storedData = {};
            isEnabled = false;
            cachedFakeUser = null;
            cachedOriginalUser = null;
            _trueOriginalUser = null;
            _dataVersion++;
            saveDataSync({}, false);
        }
        saveAllDataSync();
        DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
        DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
        DataStore.set(DS_KEY, {}).catch(() => { });
        DataStore.set(DS_ENABLED, false).catch(() => { });
        forceAccountPanelRerender();
        rootProps.onClose();
    }

    const accentHex = data.accentColor != null ? "#" + data.accentColor.toString(16).padStart(6, "0") : "";

    return (
        <ModalRoot {...rootProps} size="medium">
            <ModalHeader separator={false}>
                <div className="cp-header">
                    <EditIcon size={16} />
                    <span className="cp-header-title">{t("Custom Profile")}</span>
                </div>
                <div style={{ marginLeft: "auto", marginRight: 8, minWidth: 200 }}>
                    <Select
                        options={accounts.map((acc: any) => ({ value: acc.id, label: acc.globalName || acc.username }))}
                        isSelected={(v: string) => v === selectedAccountId}
                        select={(v: string) => setSelectedAccountId(v)}
                        serialize={(v: string) => v}
                        renderOptionLabel={(o: any) => (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <img src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === o.value), false, 20)} style={{ borderRadius: "50%", width: 20, height: 20 }} />
                                {o.label}
                            </div>
                        )}
                        renderOptionValue={(selected: any[]) => {
                            const option = selected[0];
                            if (!option) return "Select Account";
                            return (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <img src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === option.value), false, 20)} style={{ borderRadius: "50%", width: 20, height: 20 }} />
                                    {option.label}
                                </div>
                            );
                        }}
                    />
                </div>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>
            <ModalContent className="cp-content">
                <Field label={t("Username")} value={data.username ?? ""} placeholder="my_username_00" onChange={v => set("username", v)} />
                <Field label={t("Display name")} value={data.globalName ?? ""} placeholder="My Name" onChange={v => set("globalName", v)} />
                <ImageUpload label={t("Profile picture")} value={data.avatar ?? ""} onChange={v => set("avatar", v)} />
                <Toggle label={t("Simulate Nitro")} sublabel={t("Enables banner and profile color")} checked={data.nitro ?? false} onChange={v => set("nitro", v)} />
                {data.nitro && <ImageUpload label={t("Banner")} value={data.banner ?? ""} onChange={v => set("banner", v)} />}
                <div className="cp-divider" />
                <Field label={t("Bio")} value={data.bio ?? ""} placeholder={t("My description...")} onChange={v => set("bio", v)} />
                <Field label={t("Pronouns")} value={data.pronouns ?? ""} placeholder={t("he/him")} onChange={v => set("pronouns", v)} />
                <div className="cp-field">
                    <SectionLabel>{t("Profile color (Nitro â€” gradient possible)")}</SectionLabel>
                    <div className="cp-color-row" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>{t("Color 1")}</span>
                        <input type="color" value={accentHex || "#5865f2"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor", n); }} className="cp-color-swatch" />
                        <input value={accentHex} placeholder="#5865f2" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor", n); else if (!e.target.value || e.target.value === "#") set("accentColor", undefined); }} className="cp-input cp-color-input" />
                        {data.accentColor != null && <button className="cp-clear-btn" onClick={() => set("accentColor", undefined)}><CloseIcon /></button>}
                    </div>
                    <div className="cp-color-row">
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 6 }}>{t("Color 2")}</span>
                        {(() => {
                            const hex2 = data.accentColor2 != null ? "#" + data.accentColor2.toString(16).padStart(6, "0") : "";
                            return (<>
                                <input type="color" value={hex2 || "#eb459e"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor2", n); }} className="cp-color-swatch" />
                                <input value={hex2} placeholder="#eb459e (optional)" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor2", n); else if (!e.target.value || e.target.value === "#") set("accentColor2", undefined); }} className="cp-input cp-color-input" />
                                {data.accentColor2 != null && <button className="cp-clear-btn" onClick={() => set("accentColor2", undefined)}><CloseIcon /></button>}
                            </>);
                        })()}
                    </div>
                </div>
                <Field label={t("Account creation date")} value={data.createdAt ?? ""} placeholder="2010-06-29" type="date" onChange={v => set("createdAt", v)} />
                <Field label={t("Email address (local display)")} value={data.email ?? ""} placeholder="exemple@mail.com" onChange={v => set("email", v)} />
                <Field label={t("Phone (local display)")} value={data.phone ?? ""} placeholder="+33 6 00 00 00 00" onChange={v => set("phone", v)} />
                <div className="cp-divider" />
                <BadgePicker
                    selected={data.badgeFlags ?? 0} onChange={v => set("badgeFlags", v)}
                    nitroType={nitroLevel} onNitroType={v => { set("nitroLevel", v as any); if (v >= 1) set("nitro", true); }}
                    boostLevel={boostLevel} onBoostLevel={v => set("boostMonths", v)}
                    customIds={customIds} onCustomIds={v => set("customBadgeIds", v)}
                    oldName={oldName} onOldName={v => set("oldName", v)}
                />
                <div className="cp-divider" />

                <FontPicker
                    key={saveCount}
                    fontId={data.displayNameFont ?? 0}
                    effect={data.displayNameEffect ?? "solid"}
                    color={data.displayNameColor ?? ""}
                    color2={data.displayNameColor2 ?? ""}
                    onFontId={v => set("displayNameFont", v)}
                    onEffect={v => set("displayNameEffect", v)}
                    onColor={v => set("displayNameColor", v)}
                    onColor2={v => set("displayNameColor2", v)}
                    displayName={previewDisplayName}
                />
                <div className="cp-divider" />

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionLabel>{t("Avatar decoration")}</SectionLabel>
                </div>
                <div className="cp-badges" style={{ flexWrap: "wrap", gap: 6 }}>
                    <button onClick={() => set("decorationAsset", undefined)}
                        className={`cp-badge ${!data.decorationAsset ? "cp-badge--on" : ""}`} style={{ minWidth: 60 }}>
                        {t("None")}
                    </button>
                    {AVATAR_DECORATIONS.map(dec => (
                        <button key={dec.id}
                            onClick={() => set("decorationAsset", data.decorationAsset === dec.asset ? undefined : dec.asset)}
                            className={`cp-badge ${data.decorationAsset === dec.asset ? "cp-badge--on" : ""}`}
                            title={dec.label} style={{ padding: 3, lineHeight: 1.1, width: 52, height: 52, borderRadius: 6, position: "relative", overflow: "hidden" }}>
                            <img src={getDecorationUrl(dec.asset)} alt={dec.label}
                                style={{ width: 46, height: 46, objectFit: "contain", display: "block" }}
                                onLoad={e => { const t = (e.target as HTMLImageElement).nextElementSibling as HTMLElement; if (t) t.style.display = "none"; }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, padding: 2, textAlign: "center", overflow: "hidden", lineHeight: 1.1 }}>{dec.label}</span>
                        </button>
                    ))}
                </div>
                <div className="cp-field" style={{ marginTop: 8 }}>
                    <SectionLabel style={{ marginTop: 0 }}>{t("Custom decoration asset ID")}</SectionLabel>
                    <input
                        className="cp-input"
                        placeholder={t("Paste a decoration asset (e.g. a_xxxxxxxx)...")}
                        value={data.decorationAsset && !AVATAR_DECORATIONS.find(d => d.asset === data.decorationAsset) ? data.decorationAsset : ""}
                        onChange={e => set("decorationAsset", e.target.value || undefined)}
                    />
                </div>
                <div className="cp-hint">{t("Visual and local modifications only â€” persistent between restarts.")}</div>
                <div className="cp-divider" />

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionLabel>{t("Profile Effect")}</SectionLabel>
                </div>
                <div className="cp-hints" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                    {t("Animated effect displayed on your profile page.")}
                </div>
                <div className="cp-badges" style={{ flexWrap: "wrap", gap: 6 }}>
                    <button onClick={() => set("profileEffectId", undefined)}
                        className={`cp-badge ${!data.profileEffectId ? "cp-badge--on" : ""}`} style={{ minWidth: 60 }}>
                        {t("None")}
                    </button>
                    {PROFILE_EFFECTS.map(effect => (
                        <button key={effect.id}
                            onClick={() => set("profileEffectId", data.profileEffectId === effect.id ? undefined : effect.id)}
                            className={`cp-badge ${data.profileEffectId === effect.id ? "cp-badge--on" : ""}`}
                            title={effect.label} style={{ padding: 3, lineHeight: 0, width: 52, height: 52, borderRadius: 6 }}>
                            <img src={effect.thumb} alt={effect.label}
                                style={{ width: 46, height: 46, objectFit: "contain", display: "block" }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </button>
                    ))}
                </div>
                <div className="cp-field" style={{ marginTop: 8 }}>
                    <SectionLabel style={{ marginTop: 0 }}>{t("Custom effect asset ID")}</SectionLabel>
                    <input
                        className="cp-input"
                        placeholder={t("Paste a collectibles-shop asset ID...")}
                        value={data.profileEffectId && !PROFILE_EFFECTS.find(e => e.id === data.profileEffectId) ? data.profileEffectId : ""}
                        onChange={e => set("profileEffectId", e.target.value || undefined)}
                    />
                </div>
                <div className="cp-divider" />

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionLabel>{t("Nameplate")}</SectionLabel>
                </div>

                {/* FIX 4: 2-column thumbnail grid. NameplateBtn loads actual images with CDN fallback chain. */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8, marginBottom: 8 }}>
                    <button
                        onClick={() => set("nameplateSkuId", undefined)}
                        style={{
                            gridColumn: "1 / -1",
                            height: 36,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            border: !data.nameplateSkuId ? "2px solid #5865f2" : "2px solid var(--background-modifier-accent)",
                            boxShadow: !data.nameplateSkuId ? "0 0 0 1px #5865f2" : "none",
                            background: !data.nameplateSkuId ? "rgba(88,101,242,0.18)" : "var(--background-tertiary)",
                            color: "var(--header-primary)",
                            cursor: "pointer",
                            transition: "border-color 0.1s, box-shadow 0.1s, background 0.1s",
                        }}
                    >
                        {t("None")}
                    </button>
                    {NAMEPLATES.map(np => (
                        <NameplateBtn
                            key={np.skuId}
                            np={np}
                            active={data.nameplateSkuId === np.skuId}
                            onClick={() => set("nameplateSkuId", data.nameplateSkuId === np.skuId ? undefined : np.skuId)}
                        />
                    ))}
                </div>
                <div className="cp-field" style={{ marginTop: 8 }}>
                    <SectionLabel style={{ marginTop: 0 }}>{t("Custom nameplate SKU ID")}</SectionLabel>
                    <input
                        className="cp-input"
                        placeholder={t("Paste a nameplate SKU ID...")}
                        value={data.nameplateSkuId && !NAMEPLATES.find(n => n.skuId === data.nameplateSkuId) ? data.nameplateSkuId : ""}
                        onChange={e => set("nameplateSkuId", e.target.value || undefined)}
                    />
                </div>
            </ModalContent>
            <ModalFooter className="cp-footer">
                <button className="cp-btn cp-btn-ghost" onClick={rootProps.onClose}>{t("Cancel")}</button>
                <button className="cp-btn cp-btn-danger" onClick={reset}><TrashIcon /><span>{t("Reset")}</span></button>
                <button className="cp-btn cp-btn-primary" onClick={save} disabled={saving}><SaveIcon /><span>{saving ? t("Saving...") : t("Save")}</span></button>
            </ModalFooter>
        </ModalRoot>
    );
}

function CustomProfileButton() {
    return <HeaderBarButton icon={() => <EditIcon size={18} />} tooltip="Custom Profile" onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)} />;
}

export default definePlugin({
    name: "CustomProfile",
    enabledByDefault: true,
    description: t("Visually customize your Discord profile (username, PFP, banner, badges, bio...) â€” persistent, only visible to you."),
    authors: [{ name: "Fancord", id: 0n }],
    dependencies: ["HeaderBarAPI", "ContextMenuAPI"],

    patches: [
        {
            find: ':"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.patchBannerUrl(arguments[0])||$&"
            }
        },
        {
            find: ".WIDGETS_RTC_UPSELL_COACHMARK)",
            replacement: {
                match: /currentUser:(\i)(?=.{0,200}voiceDb)/,
                replace: "currentUser:$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "DISPLAY_NAME",
            noWarn: true,
            replacement: {
                match: /(?<=currentUser:\i,user:)(\i)/,
                replace: "$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "obfuscatedEmail",
            noWarn: true,
            replacement: [
                {
                    match: /obfuscatedEmail:(\i)/,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:(\i)/,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        },
        {
            find: "isHoveringOrFocusing",
            replacement: [
                {
                    noWarn: true,
                    match: /user:([A-Za-z_$][\w$]*),displayProfile:([A-Za-z_$][\w$]*),themeType/,
                    replace: "user:$self.fakeCurrentUser($1),displayProfile:$2,themeType"
                }
            ]
        },
        {
            find: "AccountPanel",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                }
            ]
        },
        {
            find: "UserAccountSettings",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                },
                {
                    match: /email:([^,}]+),/,
                    replace: "email:$self.fakeObfuscatedEmail($1),"
                }
            ]
        },
        {
            find: "getObfuscatedEmail",
            replacement: [
                {
                    match: /obfuscatedEmail:([^,}]+)/g,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:([^,}]+)/g,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        }
    ],

    _copiedUserId: null as string | null,

    isCopiedUser(userId: string | null | undefined): boolean {
        if (!isEnabled || !userId || !this._copiedUserId) return false;
        return userId === this._copiedUserId;
    },

    fakeCurrentUser(user: any) {
        if (!user || (!isEnabled && this._forceNative !== true) || !isMe(user.id)) return user;

        if (cachedOriginalUser === user && cachedFakeUser && cachedDataHash === _dataVersion) {
            return cachedFakeUser;
        }

        const realUser = (user as any).__cp_isClone ? _trueOriginalUser || user : user;
        if (!realUser.__cp_isClone) _trueOriginalUser = realUser;

        const realUsername = realUser.__cp_isClone ? (realUser._realUsername || realUser.username) : realUser.username;
        const realGlobalName = realUser.__cp_isClone ? (realUser._realGlobalName ?? realUser.globalName) : realUser.globalName;
        const realDisplayName = realUser.__cp_isClone ? (realUser._realDisplayName ?? realUser.displayName) : realUser.displayName;

        const clone = Object.create(Object.getPrototypeOf(realUser));
        for (const key of Reflect.ownKeys(realUser)) {
            if (key === "username" || key === "globalName" || key === "displayName" || key === "__cp_isClone") continue;
            const desc = Object.getOwnPropertyDescriptor(realUser, key);
            if (desc) Object.defineProperty(clone, key, desc);
        }
        Object.defineProperty(clone, "__cp_isClone", { value: true, enumerable: false, configurable: true });
        clone._realUsername = realUsername;
        clone._realGlobalName = realGlobalName;
        clone._realDisplayName = realDisplayName;

        if (!isEnabled) {
            clone.username = realUsername;
            clone.globalName = realGlobalName;
            clone.displayName = realDisplayName;
            cachedOriginalUser = user; cachedFakeUser = clone; cachedDataHash = _dataVersion;
            return clone;
        }

        const fakeUser = storedData.username || realUsername;
        const hasCustomGlobal = !!storedData.globalName;
        const fakeGlobal = hasCustomGlobal ? storedData.globalName : realGlobalName;
        const origDisplay = realGlobalName || realDisplayName || realUsername;
        const fakeDisplay = hasCustomGlobal ? (storedData.globalName || origDisplay) : origDisplay;

        Object.defineProperty(clone, "username", { get: () => isEnabled ? fakeUser : realUsername, set: () => { }, configurable: true, enumerable: true });
        Object.defineProperty(clone, "globalName", { get: () => isEnabled ? fakeGlobal : realGlobalName, set: () => { }, configurable: true, enumerable: true });
        Object.defineProperty(clone, "displayName", { get: () => isEnabled ? fakeDisplay : (realDisplayName || realGlobalName || realUsername), set: () => { }, configurable: true, enumerable: true });

        if (storedData.email) clone.email = storedData.email;
        if (storedData.phone) clone.phone = storedData.phone;

        clone.getTag = () => (storedData.username || realUsername) + "#0000";
        clone.getGlobalName = () => isEnabled ? fakeGlobal : realGlobalName;
        clone.toString = () => fakeDisplay;

        if (storedData.createdAt) {
            const fakeCreatedAt = new Date(storedData.createdAt + "T12:00:00Z");
            Object.defineProperty(clone, "createdAt", { get: () => fakeCreatedAt, configurable: true, enumerable: true });
        }

        if (storedData.decorationAsset) {
            const decoData = {
                asset: storedData.decorationAsset,
                skuId: AVATAR_DECORATIONS.find(d => d.asset === storedData.decorationAsset)?.id ?? storedData.decorationAsset
            };
            clone.avatarDecoration = null;
            clone.avatarDecorationData = decoData;
        }

        if (storedData.nameplateSkuId) {
            const np = NAMEPLATES.find(n => n.skuId === storedData.nameplateSkuId);
            if (!clone.collectibles) clone.collectibles = {};
            clone.collectibles = { ...clone.collectibles, nameplate: buildNameplateData(storedData.nameplateSkuId, np) };
        }

        if (storedData.profileEffectId) {
            const effect = PROFILE_EFFECTS.find(e => e.id === storedData.profileEffectId);
            clone.profileEffect = {
                id: storedData.profileEffectId,
                skuId: storedData.profileEffectId,
                effectDefinitionId: effect?.effectDefinitionId ?? storedData.profileEffectId,
            };
        }

        if (storedData.displayNameFont != null && storedData.displayNameFont > 0) {
            clone.displayNameFont = storedData.displayNameFont;
            if (!clone.premiumType) clone.premiumType = 2;
        }
        if (storedData.displayNameColor) {
            clone.usernameColor = storedData.displayNameColor;
            clone.nameColor = storedData.displayNameColor;
            clone.primaryColor = parseInt(storedData.displayNameColor.replace("#", ""), 16);
            if (!clone.premiumType) clone.premiumType = 2;
        }

        const wantedFlags = (isEnabled && storedData.badgeFlags != null) ? storedData.badgeFlags : realUser.publicFlags;
        clone.publicFlags = wantedFlags;
        clone.flags = wantedFlags;

        if (isEnabled && storedData.nitro) {
            clone.premiumType = 2;
            const LEVEL_MONTHS = [1, 2, 3, 6, 12, 24, 36, 72];
            const since = new Date();
            since.setMonth(since.getMonth() - (LEVEL_MONTHS[storedData.nitroLevel!] ?? 1));
            clone.premiumSince = since;
            const bm = storedData.boostMonths ?? -1;
            if (bm >= 0) {
                const BOOST_M = [1, 2, 3, 6, 9, 12, 15, 18, 24];
                const boostSince = new Date();
                boostSince.setMonth(boostSince.getMonth() - (BOOST_M[bm] ?? 1));
                clone.premiumGuildSince = boostSince;
            } else {
                clone.premiumGuildSince = null;
            }
        } else if (isEnabled && storedData.nitro === false) {
            if (!storedData.displayNameFont && !storedData.displayNameColor) {
                clone.premiumType = 0;
                clone.premiumSince = null;
                clone.premiumGuildSince = null;
            }
        }

        if (!realUser.__cp_isClone) {
            clone._realPremiumType = realUser.premiumType;
            clone._realPremiumSince = realUser.premiumSince;
            clone._realPremiumGuildSince = realUser.premiumGuildSince;
        }

        cachedOriginalUser = user; cachedFakeUser = clone; cachedDataHash = _dataVersion;
        return clone;
    },

    _cachedProfile: null as any,
    _cachedProfileInput: null as any,
    _cachedProfileVersion: 0,

    hookUserProfile(profile: any) {
        if (!profile || !isEnabled) return profile;
        if (this._cachedProfileInput === profile && this._cachedProfile && this._cachedProfileVersion === _dataVersion) {
            return this._cachedProfile;
        }
        try {
            const merged: any = {};

            if (storedData.bio) merged.bio = storedData.bio;
            if (storedData.pronouns) merged.pronouns = storedData.pronouns;
            if (storedData.accentColor != null) merged.accentColor = storedData.accentColor;
            if (storedData.banner) merged.banner = storedData.banner;

            if (storedData.decorationAsset) {
                merged.avatarDecoration = null;
                merged.avatarDecorationData = {
                    asset: storedData.decorationAsset,
                    skuId: AVATAR_DECORATIONS.find(d => d.asset === storedData.decorationAsset)?.id ?? storedData.decorationAsset
                };
            }

            if (storedData.nameplateSkuId) {
                const baseCollectibles = profile.collectibles ? { ...profile.collectibles } : {};
                const np = NAMEPLATES.find(n => n.skuId === storedData.nameplateSkuId);
                baseCollectibles.nameplate = buildNameplateData(storedData.nameplateSkuId, np);
                merged.collectibles = baseCollectibles;
            }

            if (storedData.profileEffectId) {
                const effect = PROFILE_EFFECTS.find(e => e.id === storedData.profileEffectId);
                merged.profileEffect = {
                    id: storedData.profileEffectId,
                    skuId: storedData.profileEffectId,
                    effectDefinitionId: effect?.effectDefinitionId ?? storedData.profileEffectId,
                };
            }

            if (storedData.displayNameFont != null && storedData.displayNameFont > 0) {
                merged.displayNameFont = storedData.displayNameFont;
                merged.premiumType = 2;
            }
            if (storedData.displayNameColor) {
                merged.usernameColor = storedData.displayNameColor;
                merged.nameColor = storedData.displayNameColor;
                merged.primaryColor = parseInt(storedData.displayNameColor.replace("#", ""), 16);
                if (!merged.premiumType) merged.premiumType = 2;
            }

            if (isEnabled && (storedData.nitro || storedData.badgeFlags != null)) {
                merged.premiumType = storedData.nitro ? 2 : (merged.premiumType ?? 0);
                if (storedData.nitro) {
                    if (storedData.accentColor != null) {
                        const c2 = storedData.accentColor2 ?? storedData.accentColor;
                        merged.themeColors = [storedData.accentColor, c2];
                    }
                    const nl = storedData.nitroLevel ?? 0;
                    const LEVEL_MONTHS = [1, 2, 3, 6, 12, 24, 36, 72];
                    const since = new Date();
                    since.setMonth(since.getMonth() - (LEVEL_MONTHS[nl] ?? 1));
                    merged.premiumSince = since;
                    const bm = storedData.boostMonths ?? -1;
                    if (bm >= 0) {
                        const BOOST_M = [1, 2, 3, 6, 9, 12, 15, 18, 24];
                        const boostSince = new Date();
                        boostSince.setMonth(boostSince.getMonth() - (BOOST_M[bm] ?? 1));
                        merged.premiumGuildSince = boostSince;
                    } else {
                        merged.premiumGuildSince = null;
                    }
                } else {
                    merged.premiumSince = null;
                    merged.premiumGuildSince = null;
                }
                merged.publicFlags = (storedData.badgeFlags != null) ? storedData.badgeFlags : profile.publicFlags;
                merged.badges = [];
            } else if (isEnabled && storedData.nitro === false) {
                if (!storedData.displayNameFont && !storedData.displayNameColor) {
                    merged.premiumType = profile.premiumType ?? 0;
                    merged.premiumSince = profile.premiumSince ?? null;
                    merged.premiumGuildSince = profile.premiumGuildSince ?? null;
                }
            } else {
                if (profile.premiumType) merged.premiumType = merged.premiumType ?? profile.premiumType;
                if (profile.premiumSince) merged.premiumSince = profile.premiumSince;
                if (profile.premiumGuildSince) merged.premiumGuildSince = profile.premiumGuildSince;
            }

            const result = virtualMerge(profile, merged);
            this._cachedProfileInput = profile;
            this._cachedProfile = result;
            this._cachedProfileVersion = _dataVersion;
            return result;
        } catch {
            return profile;
        }
    },

    fakeObfuscatedEmail(real: string | null) {
        if (!isEnabled || !storedData.email || !real) return real;
        const fake = storedData.email;
        const atIdx = fake.indexOf("@");
        if (atIdx <= 1) return fake;
        return fake[0] + "***" + fake.slice(atIdx - 1);
    },

    fakeObfuscatedPhone(real: string | null) {
        if (!isEnabled || !storedData.phone || !real) return real;
        const fake = storedData.phone;
        if (fake.length < 4) return fake;
        return "***-***-" + fake.slice(-4);
    },

    patchBannerUrl({ displayProfile }: any) {
        if (!isEnabled || !storedData.nitro || !storedData.banner) return null;
        try { return isMe(displayProfile?.userId) ? storedData.banner : null; } catch { return null; }
    },

    toolboxActions: {
        [t("Open Custom Profile")]() { openModal(props => <CustomProfileModal rootProps={props} />); },
    },

    _origGetUserAvatarURL: null as any,
    _origExtractTimestamp: null as any,
    _forceNative: false,

    async start() {
        applyAvatarPatchEarly();
        addHeaderBarButton("custom-profile-btn", () => <CustomProfileButton />, 10);
        addContextMenuPatch("user-context", userContextMenuPatch);
        FluxDispatcher.subscribe("CONNECTION_OPEN", onAccountSwitch);

        try {
            const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser");
            if (US && !US._cp_perfect_hook) {
                const origCurrent = US.getCurrentUser.bind(US);
                let _lastRealUser: any = null;
                let _lastFakeResult: any = null;
                let _lastCacheVersion = -1;

                US.getCurrentUser = () => {
                    const realUser = origCurrent();
                    if (realUser) {
                        if (realUser !== _lastRealUser) {
                            if (realUser.username) _realUsername = realUser.username;
                            if (realUser.globalName) _realGlobalName = realUser.globalName;
                        }
                        if (realUser === _lastRealUser && _lastCacheVersion === _dataVersion && _lastFakeResult) return _lastFakeResult;
                        _lastRealUser = realUser;
                        _lastCacheVersion = _dataVersion;
                        _lastFakeResult = this.fakeCurrentUser(realUser);
                        return _lastFakeResult;
                    }
                    return this.fakeCurrentUser(realUser);
                };

                const origGet = US.getUser.bind(US);
                US.getUser = (id: string) => isMe(id) ? this.fakeCurrentUser(origGet(id)) : origGet(id);
                US._cp_perfect_hook = true;
            }
        } catch { }

        try {
            const UPS = (Vencord as any).Webpack?.findByProps?.("getUserProfile", "getGuildMemberProfile");
            if (UPS && !UPS._cp_profile_hook) {
                const origGetProfile = UPS.getUserProfile.bind(UPS);
                UPS.getUserProfile = (userId: string) => {
                    try {
                        const profile = origGetProfile(userId);
                        if (!isEnabled || !userId || !isMe(userId) || !profile) return profile;
                        return this.hookUserProfile(profile);
                    } catch (e) {
                        console.error("[CustomProfile] Error in getUserProfile hook:", e);
                        return origGetProfile(userId);
                    }
                };
                const origGetGuild = UPS.getGuildMemberProfile.bind(UPS);
                UPS.getGuildMemberProfile = (userId: string, guildId: string) => {
                    try {
                        const profile = origGetGuild(userId, guildId);
                        if (!isEnabled || !userId || !isMe(userId) || !profile) return profile;
                        return this.hookUserProfile(profile);
                    } catch (e) {
                        console.error("[CustomProfile] Error in getGuildMemberProfile hook:", e);
                        return origGetGuild(userId, guildId);
                    }
                };
                UPS._cp_profile_hook = true;
            }
        } catch { }

        try {
            const WP = (Vencord as any).Webpack;
            const MAS = WP?.findByProps?.("getUsers", "getValidUsers", "getHasLoggedInAccounts");
            if (MAS && !MAS._cp_perfect_hook) {
                function patchAccountUser(u: any) {
                    if (!u?.id) return u;
                    const acctData = allAccountsData[u.id];
                    const acctEnabled = allAccountsEnabled[u.id];
                    if (!acctData || !acctEnabled) return u;
                    const patched: any = { ...u };
                    if (acctData.username) patched.username = acctData.username;
                    if (acctData.globalName) patched.globalName = acctData.globalName;
                    return patched;
                }
                if (MAS.getUsers) {
                    const origGetUsers = MAS.getUsers.bind(MAS);
                    MAS.getUsers = () => {
                        const users = origGetUsers();
                        return Array.isArray(users) ? users.map(patchAccountUser) : users;
                    };
                }
                if (MAS.getValidUsers) {
                    const origGetValid = MAS.getValidUsers.bind(MAS);
                    MAS.getValidUsers = () => {
                        const users = origGetValid();
                        return Array.isArray(users) ? users.map(patchAccountUser) : users;
                    };
                }
                MAS._cp_perfect_hook = true;
                try { MAS.emitChange?.(); } catch { }
            }
        } catch { }

        try {
            if (SnowflakeUtils?.extractTimestamp && !this._origExtractTimestamp) {
                this._origExtractTimestamp = SnowflakeUtils.extractTimestamp;
                const origExtract = this._origExtractTimestamp;
                (SnowflakeUtils as any).extractTimestamp = (snowflake: string) => {
                    if (isEnabled && storedData.createdAt && isMe(snowflake)) {
                        return new Date(storedData.createdAt + "T12:00:00Z").getTime();
                    }
                    return origExtract(snowflake);
                };
            }
        } catch { }

        loadData().then(() => {
            updateCachedRealData();
            applyAvatarPatchEarly();
            if (isEnabled) {
                injectFontStyle();
                forceAccountPanelRerender();
                requestAnimationFrame(() => removeHideStyle());
            } else {
                removeHideStyle();
            }
        });

        try {
            const decoMod = (Vencord as any).Webpack?.findByProps?.("getAvatarDecorationURL");
            if (decoMod?.getAvatarDecorationURL) {
                const origDeco = decoMod.getAvatarDecorationURL.bind(decoMod);
                decoMod.getAvatarDecorationURL = (opts: any) => {
                    try {
                        if (isEnabled && storedData.decorationAsset) {
                            const { avatarDecoration, userId } = opts ?? {};
                            const myId = UserStore.getCurrentUser()?.id;
                            const isOurs = (avatarDecoration?.asset === storedData.decorationAsset)
                                || (userId && userId === myId && !!storedData.decorationAsset);
                            if (isOurs) return getDecorationUrl(storedData.decorationAsset);
                        }
                    } catch { }
                    return origDeco(opts);
                };
            }
        } catch { }

        if (IconUtils?.getUserAvatarURL && !_avatarPatchApplied) {
            this._origGetUserAvatarURL = IconUtils.getUserAvatarURL;
            const orig = this._origGetUserAvatarURL;
            (IconUtils as any).getUserAvatarURL = (user: any, ...args: any[]) => {
                if (isEnabled && storedData.avatar) {
                    const uid = user?.id ?? user?.userId;
                    if (uid && isMe(uid)) return storedData.avatar;
                }
                return orig(user, ...args);
            };
            _avatarPatchApplied = true;
        }

        const fontRefreshInterval = setInterval(() => {
            if (!isEnabled || !storedData.displayNameFont) return;
            if (!document.getElementById(FONT_STYLE_ID)) injectFontStyle();
            stampOwnNameElements();
        }, 800);
        (this as any)._fontRefreshInterval = fontRefreshInterval;
    },

    userProfileBadges: [
        {
            getBadges({ userId, badges: nativeBadges }: { userId: string; guildId: string; badges: ProfileBadge[]; }) {
                if (!isEnabled) return nativeBadges || [];
                if (userId !== UserStore.getCurrentUser()?.id) return nativeBadges || [];

                let badges: ProfileBadge[] = [...(nativeBadges || [])];
                const style = { borderRadius: "50%", width: "22px", height: "22px" };

                const nl = storedData.nitroLevel ?? -1;
                const bm = storedData.boostMonths ?? -1;
                const hasNitroFake = nl >= 0 && nl < NITRO_LEVELS.length;
                const hasBoostFake = bm >= 0 && bm < BOOST_ICONS.length;
                const wantedFlags = storedData.badgeFlags ?? 0;

                badges = badges.filter(b => {
                    const desc = (b.description || "").toLowerCase();
                    const icon = (b.iconSrc || "").toLowerCase();
                    if (isEnabled) {
                        if (["nitro", "subscriber", "abonn", "premium", "inscrit"].some(k => desc.includes(k))) return false;
                        if (icon.includes("nitro") || icon.includes("premium")) return false;
                        if (["booster", "boost"].some(k => desc.includes(k))) return false;
                        if (icon.includes("boost") || icon.includes("leveling")) return false;
                    }
                    for (const badge of BADGES) {
                        if (wantedFlags & badge.flag) {
                            const badgeKeywords = badge.label.toLowerCase().split(" ");
                            if (badgeKeywords.some(k => k.length > 3 && desc.includes(k))) return false;
                            const iconParts = badge.icon.split("/");
                            const iconName = iconParts[iconParts.length - 1];
                            if (icon.includes(iconName)) return false;
                        }
                    }
                    return true;
                });

                const badgeList: ProfileBadge[] = [];

                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.STAFF))           badgeList.push({ description: t("Staff Discord"),       iconSrc: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.PARTNER))         badgeList.push({ description: t("Partenaire"),           iconSrc: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png", position: 0, props: { style } });
                if (hasNitroFake)                                                             badgeList.push({ description: "NITRO\nSubscribed since 10/22/21", iconSrc: NITRO_LEVELS[nl].icon, position: 0, props: { style, title: "Nitro" } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.HYPESQUAD))       badgeList.push({ description: t("HypeSquad Events"),     iconSrc: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.BUG_HUNTER_2))    badgeList.push({ description: t("Bug Hunter Lvl 2"),     iconSrc: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.BALANCE))         badgeList.push({ description: t("HypeSquad Balance"),    iconSrc: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.BRAVERY))         badgeList.push({ description: t("HypeSquad Bravery"),    iconSrc: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.BRILLIANCE))      badgeList.push({ description: t("HypeSquad Brilliance"), iconSrc: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.BUG_HUNTER_1))    badgeList.push({ description: t("Bug Hunter Lvl 1"),     iconSrc: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.DEV_VERIFIED))    badgeList.push({ description: t("Verified Developer"),   iconSrc: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.MOD_ALUMNI))      badgeList.push({ description: t("Former Moderator"),     iconSrc: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png", position: 0, props: { style } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.EARLY_SUPPORTER)) badgeList.push({ description: t("Early Supporter"),      iconSrc: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png", position: 0, props: { style } });
                if (hasBoostFake)                                                             badgeList.push({ description: `Server Booster â€” ${BOOST_LABELS[bm]}`, iconSrc: BOOST_ICONS[bm], position: 0, props: { style, title: `Server Booster â€” ${BOOST_LABELS[bm]}` } });
                if (storedData.badgeFlags && (storedData.badgeFlags & FLAG.ACTIVE_DEVELOPER)) badgeList.push({ description: t("Active Developer"),    iconSrc: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png", position: 0, props: { style } });
                // FIX 3: Verified badge removed â€” no longer rendered here
                if (storedData.customBadgeIds?.includes("oldname")) {
                    const oldNameText = storedData.oldName ? `Old username\u00a0: ${storedData.oldName}` : "Old username";
                    badgeList.push({ description: oldNameText, iconSrc: OLD_NAME_BADGE_ICON, position: 0, props: { style, title: oldNameText } });
                }
                if (storedData.customBadgeIds?.includes("quest")) badgeList.push({ description: "Completed a quest", iconSrc: "https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png", position: 0, props: { style } });
                if (storedData.customBadgeIds?.includes("orbs")) badgeList.push({ description: "Orbs â€” Apprentice", iconSrc: "https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png", position: 0, props: { style } });

                badges.push(...badgeList);
                return badges;
            }
        } as ProfileBadge
    ] as ProfileBadge[],

    stop() {
        removeHeaderBarButton("custom-profile-btn");
        removeContextMenuPatch("user-context", userContextMenuPatch);
        FluxDispatcher.unsubscribe("CONNECTION_OPEN", onAccountSwitch);
        stopDomObserver();
        removeFontStyle();
        removeHideStyle();

        if ((this as any)._fontRefreshInterval) {
            clearInterval((this as any)._fontRefreshInterval);
            (this as any)._fontRefreshInterval = null;
        }

        if (this._origExtractTimestamp && SnowflakeUtils) {
            (SnowflakeUtils as any).extractTimestamp = this._origExtractTimestamp;
            this._origExtractTimestamp = null;
        }
        if (this._origGetUserAvatarURL && IconUtils) {
            (IconUtils as any).getUserAvatarURL = this._origGetUserAvatarURL;
            this._origGetUserAvatarURL = null;
        }
        try {
            const myUser = UserStore.getCurrentUser() as any;
            if (myUser) {
                try { delete myUser.avatarDecoration; } catch { }
                try { delete myUser.avatarDecorationData; } catch { }
            }
        } catch { }
    },

    settingsAboutComponent() {
        return <Button onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)}>Open Custom Profile</Button>;
    },
});