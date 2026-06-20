import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";

const RelationshipStore = findByPropsLazy("getRelationships", "getPendingCount", "isUnfilteredPendingIncoming", "getMutableRelationships");
const UserStore = findByPropsLazy("getUser", "getCurrentUser", "findByTag");

const PENDING_INCOMING = 3;

const settings = definePluginSettings({
    amount: {
        type: OptionType.NUMBER,
        description: "How many fake incoming friend requests to show",
        default: 1,
        restartNeeded: false,
        onChange: () => {
            cachedAmount = -1;
            cachedNames = [];
            RelationshipStore.emitChange?.();
        },
    },
});

const NAME_POOL = [
    "qwx", "vzp", "xnr", "jkl", "mqf", "pzt", "rvy", "bwq",
    "fcx", "hjy", "ksz", "lmv", "npd", "cgb", "dfg", "zxc",
    "vbn", "qwe", "asd", "tyu", "ghj", "rty", "fgh", "vcx",
    "xzq", "pmn", "okm", "ijn", "uhb", "ygv", "tfc", "rdx",
    "esz", "waq", "lkj", "poi", "mnb", "uyt", "tre", "ewq",
    "dsa", "czx", "fds", "gfd", "hgf", "jhg", "kjh",
    "vcq", "xqw", "zqw", "qaz", "wsx", "edc", "rfv", "tgb", "yhn",
    "ujm", "olp", "pzm", "qsk", "vnt", "wrm", "ylx",
    "zcb", "aqt", "bvw", "cxy", "dpz", "efl", "gro", "hsm",
    "iwt", "jyu", "kva", "lcw", "mdx", "ney", "ofz", "pga",
    "qhb", "ric", "sjd", "tke", "ulf", "vmg", "wnh", "xoi",
    "ypj", "zqk", "arl", "bsm", "vexq", "zorp", "klyn", "xylo",
    "fwix", "jast", "brel", "qwop", "nyxi", "cvox", "traz", "noir",
    "crms", "bass", "luau", "scor", "rotz", "tili", "vxtr", "brnr",
    "xeno", "yvng", "zeth", "aevy", "brix", "clox", "drak", "eonx",
    "falk", "gryz", "haze", "ixis", "jynx", "kora", "lyra", "mako",
    "nova", "onyx", "pyre", "qwin", "ryze", "syth", "tyde", "uris",
    "vail", "wyrm", "xyla", "ymir", "zeon", "axil", "byrn", "cery",
    "dask", "elix", "fane", "glif", "hyve", "igni", "jolt", "kyro",
    "luma", "myra", "nexi", "oris", "paxi", "qell", "roxy", "sylv",
    "taze", "umbx", "voro", "wisp", "xero", "yara", "zane", "apex",
    "byte", "core", "dawn", "echo", "flux", "grip", "halo", "iron",
    "jade", "kiln", "loop", "mute", "neon", "oath", "pact", "quip",
    "rift", "sync", "trip", "unit", "vibe", "warp", "yeti",
    "zest", "aura", "bolt", "cold", "dark", "edge", "fire", "glow",
    "heat", "idle", "jump", "kick", "link", "mind", "node", "open",
    "push", "quit", "rush", "spin", "task", "user", "view", "wave",
    "xing", "yelp", "zero", "aero", "boro", "cito", "doro", "euro",
    "faro", "gyro", "hero", "intro", "kuro", "lyro", "moro",
    "noro", "outo", "pyro", "taro",
    "abel", "brio", "cleo", "dino",
    "elmo", "fido", "gino", "hugo", "jojo", "kiko", "lilo",
    "milo", "nino", "otto", "polo", "rilo", "silo", "tito",
    "vito", "wald", "yoda", "zazu",
    "atek", "btek", "ctek", "dtek", "etek", "ftek", "gtek", "htek",
    "itek", "jtek", "ktek", "ltek", "mtek", "ntek", "otek", "ptek",
    "qtek", "rtek", "stek", "utek", "vtek", "wtek", "xtek",
    "ytek", "ztek", "alon", "blon", "clon", "dlon", "flon",
    "glon", "hlon", "ilon", "jlon", "klon", "mlon", "nlon",
    "olon", "plon", "qlon", "rlon", "slon", "tlon", "ulon", "vlon",
    "wlon", "xlon", "ylon", "zlon", "axer", "bxer", "cxer", "dxer",
    "exer", "fxer", "gxer", "hxer", "ixer", "jxer", "kxer", "lxer",
    "mxer", "nxer", "oxer", "pxer", "qxer", "rxer", "sxer", "txer",
    "uxer", "vxer", "wxer", "yxer", "zxer",
    "aether", "solace", "zephyr", "crimson", "oblivi", "astrum", "zenith", "nebula",
    "cypher", "phantom", "vertex", "aurora", "chalice", "dracon", "enigma", "falcon",
    "goliath", "helios", "indigo", "jaguar", "kraken", "legend", "matrix", "nimbus",
    "oracle", "pulsar", "quasar", "raptor", "sphinx", "titan", "utopia", "vortex",
    "wraith", "xanadu", "yonder", "zapper", "abacus", "beacon", "cosmos", "dagger",
    "eclipse", "frenzy", "galaxy", "havoc", "iguana", "jester", "karma", "legacy",
    "mirage", "nomad", "origin", "paladin", "qwerty", "ronin", "shadow", "terror",
    "umbra", "valkyr", "wyvern", "xerox", "zeppelin", "arcade", "buzzer",
    "canyon", "desert", "engine", "forest", "geyser", "hornet", "island", "jungle",
    "knight", "lagoon", "meteor", "nature", "ocean", "planet", "quartz", "river",
    "sunset", "tundra", "valley", "winter", "xenon", "yogurt", "zodiac", "autumn",
    "breeze", "cinder", "dollar", "ember", "fabric", "glint", "harbor", "icicle",
    "jewel", "kettle", "lumber", "marble", "nectar", "ocelot", "pebble", "quiver",
    "riddle", "silver", "timber", "urchin", "velvet", "willow", "xyloid", "yarrow",
    "amulet", "beryl", "cobalt", "dahlia", "ether", "fables", "garnet",
    "haste", "ironia", "jasper", "krypt", "laurel", "mystic", "nacre", "opal",
    "pyrite", "qilin", "rhodium", "spinel", "topaz", "unakite", "vellum", "wiccan",
    "xylene", "yttria", "zircon", "aspect", "beyond", "chaos", "divine", "entity",
    "fluid", "grimoire", "hallow", "ignite", "jinxed", "kinesis", "latent", "mythos",
    "nullify", "opaque", "purity", "qliphoth", "relic", "spirit", "trance", "unbind",
    "vessel", "wisdom", "xystus", "yields", "anthem", "ballad", "chorus",
    "melody", "rhythm", "sonnet", "stanza", "treble", "unison", "volume",
    "accrue", "barter", "crypto", "demand", "equity", "fiscal", "growth", "hedge",
    "invest", "ledger", "market", "option", "profit", "quota", "return", "stock",
    "teller", "update", "value", "wealth", "yearly", "archer",
    "bandit", "cleric", "druid", "expert", "fighter", "gunner", "healer", "inmate",
    "jockey", "killer", "leader", "master", "novice", "outlaw", "pirate", "quaker",
    "ranger", "sniper", "tamer", "umpire", "victor", "walker", "yeoman",
    "zealot", "allied", "broken", "cursed", "driven", "errant", "fallen", "golden",
    "hidden", "ironic", "jilted", "karmic", "lonely", "masked", "native", "ornate",
    "pivotal", "quaint", "rustic", "silent", "tragic", "unruly", "vacant", "wicked",
    "alphic", "bionic", "cosmic", "exotic",
    "frantic", "gothic", "hectic", "iconic", "lunric",
    "voidstrap", "noirstrap", "dev_null", "sys_admin", "root_dir", "bash_rc", "cron_job",
    "daemon_thread", "ext4_fs", "grep_v", "hash_map", "inet_addr", "json_obj", "kube_pod", "local_host",
    "mutex_lock", "null_ptr", "opcode_hex", "ping_req", "query_sql", "rsa_key", "ssh_port", "tcp_syn",
    "udp_pack", "vim_user", "wget_url", "xml_parse", "yaml_cfg", "zero_day", "array_idx", "byte_code",
    "cache_miss", "debug_log", "enum_val", "float_pt", "heap_mem", "int_cast", "java_bin",
    "kwarg_def", "loop_var", "macro_def", "nand_gate", "oop_class", "parse_ast", "queue_pop", "regex_match",
    "stack_push", "tree_node", "utf8_char", "void_func", "while_loop", "xor_bit", "yacc_lex", "zlib_comp",
    "algo_sort", "bool_flag", "char_str", "dict_key", "eval_expr", "func_call", "git_commit", "html_tag",
    "init_var", "jwt_token", "k_means", "lambda_fn", "merge_sort", "npm_install", "oauth_flow", "pip_freeze",
    "quick_sort", "rest_api", "ssl_cert", "test_case", "url_encode", "vpn_tunnel", "web_socket",
    "yarn_build", "zip_file", "async_io", "bind_port", "cors_err", "dom_tree", "event_loop", "fork_proc",
    "gui_view", "hook_fn", "ipc_pipe", "jit_comp", "kill_sig", "link_lib", "mock_obj", "nil_val",
    "orm_model", "p2p_net", "qps_rate", "rpc_call", "spa_app", "tls_hand", "uuid_gen", "vdom_diff",
    "wasm_mod", "xml_http", "y_axis", "z_index", "awk_cmd", "bg_job", "cd_dir", "df_disk",
    "env_var", "fg_proc", "gzip_tar", "htop_sys", "ip_addr", "jq_json", "kill_all", "ls_la",
    "mv_file", "nc_port", "os_env", "ps_aux", "qemu_vm", "rm_rf", "sed_expr", "tar_gz",
    "uname_r", "vi_edit", "wc_line", "xargs_cmd", "yum_inst", "zsh_rc", "arp_table", "bgp_route",
    "cidr_blk", "dns_lookup", "ec2_inst", "ftp_serv", "gcp_proj", "http_req", "icmp_echo", "json_req",
    "k8s_clst", "lxc_cont", "mac_addr", "nat_gate", "osi_model", "pop3_mail", "qos_rule", "rdp_conn",
    "smtp_serv", "tcp_dump", "udp_cast", "vlan_tag", "wifi_ssid", "xor_cipher", "yaml_file", "zfs_pool",
    "adc_conv", "bjt_trans", "cpu_core", "dac_conv", "eeprom_mem", "fpga_chip", "gpu_ram", "hdd_disk",
    "i2c_bus", "jtag_port", "kbd_input", "lcd_disp", "mcu_chip", "nand_flash", "oled_scr", "pcb_board",
    "qfn_pack", "ram_chip", "spi_bus", "tft_disp", "uart_tx", "vga_port", "wlan_mac", "x86_arch",
    "yuv_color", "zif_sock", "ascii_hex", "bin_tree", "csv_data",
];

let cachedAmount = -1;
let cachedNames: string[] = [];

function fakeId(index: number): string {
    return `9999999999999${String(index).padStart(5, "0")}`;
}

function generateUsernames(count: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
        const base = NAME_POOL[i % NAME_POOL.length];
        const cycle = Math.floor(i / NAME_POOL.length);
        out.push(cycle === 0 ? base : `${base}${cycle + 1}`);
    }
    return out;
}

function getFakeList(): string[] {
    const amount = Math.max(0, Math.floor(Number(settings.store.amount)) || 0);
    if (amount !== cachedAmount) {
        cachedNames = generateUsernames(amount);
        cachedAmount = amount;
    }
    return cachedNames;
}

function avatarUrlFor(username: string): string {
    return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(username)}&size=128`;
}

function buildFakeUser(id: string, username: string) {
    const avatarUrl = avatarUrlFor(username);
    return {
        id,
        username,
        globalName: username,
        displayName: username,
        discriminator: "0",
        avatar: null,
        bot: false,
        flags: 0,
        publicFlags: 0,
        getAvatarURL(_guildId?: string, _size?: number, _canAnimate?: boolean) {
            return avatarUrl;
        },
        getAvatarSource(_guildId?: string, _canAnimate?: boolean) {
            return { uri: avatarUrl };
        },
        hasAvatarForGuild: () => false,
        hasFlag: () => false,
        isStaff: () => false,
        isSystemUser: () => false,
        isNonUserBot: () => false,
        tag: username,
        toString() { return `<@${id}>`; },
    };
}

const fakeIds = new Set<string>();

let origGetPendingCount: any;
let origGetRelationships: any;
let origGetRelationshipType: any;
let origIsUnfilteredPendingIncoming: any;
let origGetUser: any;
let origGetMutableRelationships: any;

export default definePlugin({
    name: "FakeFriendRequests",
    description: "Shows fake incoming friend requests in Friends > Pending > Received. Purely cosmetic.",
    authors: [{ name: "you", id: 0n }],
    settings,

    start() {
        const list = getFakeList();
        fakeIds.clear();
        list.forEach((_, i) => fakeIds.add(fakeId(i)));

        origGetPendingCount             = RelationshipStore.getPendingCount;
        origGetRelationships            = RelationshipStore.getRelationships;
        origGetRelationshipType         = RelationshipStore.getRelationshipType;
        origIsUnfilteredPendingIncoming = RelationshipStore.isUnfilteredPendingIncoming;
        origGetMutableRelationships     = RelationshipStore.getMutableRelationships;
        origGetUser                     = UserStore.getUser;

        RelationshipStore.getPendingCount = function (...args: any[]) {
            return (origGetPendingCount.apply(this, args) ?? 0) + getFakeList().length;
        };

        RelationshipStore.getRelationships = function (...args: any[]) {
            const real = origGetRelationships.apply(this, args) ?? {};
            const result = { ...real };
            getFakeList().forEach((_, i) => { result[fakeId(i)] = PENDING_INCOMING; });
            return result;
        };

        RelationshipStore.getMutableRelationships = function (...args: any[]) {
            const real = origGetMutableRelationships.apply(this, args) ?? {};
            const result = { ...real };
            getFakeList().forEach((_, i) => { result[fakeId(i)] = PENDING_INCOMING; });
            return result;
        };

        RelationshipStore.getRelationshipType = function (id: string) {
            if (fakeIds.has(id)) return PENDING_INCOMING;
            return origGetRelationshipType.call(this, id);
        };

        RelationshipStore.isUnfilteredPendingIncoming = function (id: string) {
            if (fakeIds.has(id)) return true;
            return origIsUnfilteredPendingIncoming?.call(this, id) ?? false;
        };

        UserStore.getUser = function (id: string) {
            if (fakeIds.has(id)) {
                const idx = parseInt(id.slice(-5), 10);
                const name = getFakeList()[idx] ?? "unknown";
                return buildFakeUser(id, name);
            }
            return origGetUser.call(this, id);
        };

        RelationshipStore.emitChange?.();
    },

    stop() {
        if (origGetPendingCount)             RelationshipStore.getPendingCount             = origGetPendingCount;
        if (origGetRelationships)            RelationshipStore.getRelationships            = origGetRelationships;
        if (origGetRelationshipType)         RelationshipStore.getRelationshipType         = origGetRelationshipType;
        if (origIsUnfilteredPendingIncoming) RelationshipStore.isUnfilteredPendingIncoming = origIsUnfilteredPendingIncoming;
        if (origGetMutableRelationships)     RelationshipStore.getMutableRelationships     = origGetMutableRelationships;
        if (origGetUser)                     UserStore.getUser                             = origGetUser;

        fakeIds.clear();
        cachedAmount = -1;
        cachedNames = [];
        RelationshipStore.emitChange?.();
    },
});