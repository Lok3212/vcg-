/* ==================================================================================
   ULTIMATE DISCORD BOT: STATS + LEVEL + GUARD + SİCİL + KAYIT (FULL SÜRÜM)
   Author: Gemini AI
   ================================================================================== */

require("dotenv").config();
const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    MessageFlags 
} = require("discord.js");
const mongoose = require("mongoose");
const fs = require('fs');

/* ================= AYARLAR & SABİTLER ================= */

const PREFIX = ".";

// Stat & Level Ayarları
const CONF = {
    LOG_KANAL_CHAT_LEVEL: "1411088828868853825",
    LOG_KANAL_VOICE_LEVEL: "1411088828868853825",
    LOG_KANAL_WELCOME: "1411088828055294069",
    LOG_KANAL_REGISTER: "1433230219887644792",
    BOT_SES_KANALI: "1411088828055294070",

    ROLE_YETKILI: "1411088827598110859",
    ROLE_UNREGISTERED: "1411088827556171934",
    ROLE_MEMBER: "1411088827556171937",

    CHAT_COOLDOWN: 1500,
    BOOST_CARPANI: 5,
};

// Sicil & Guard Ayarları
const OZEL_SAHIP_ID = "983015347105976390"; 
const NOT_YETKILISI_ID = "1411088827589595258"; 

// ================= LİSTELER (HİÇBİR ŞEY EKSİLTİLMEDİ) =================

const KUFUR_LISTESI = [
    "amk", "amq", "aq", "amınakoyim", "amkoyim", "amınakoyayım", "amına", "amını", "aminakoyim", "mkk", "mk", "mq",
    "siktir", "siktiğim", "siktiğimin", "sikerim", "sikiş", "sokuş", "sokarım", "sikik", "sokuk", "sik", "sktr", "siqtir",
    "orospu", "orospuçocuğu", "oç", "oc", "o.ç", "o.çocuğu", "orospuevladı", "kahpe", "fahişe", "kancık",
    "yavşak", "yawsak", "yavsak", "gavat", "gawad", "pezevenk", "pzw", "pznk", "godoş", "godos",
    "piç", "pic", "puşt", "pust", "ibne", "top", "gay", "lez",
    "yarrak", "yarak", "yarrrak", "yarakos", "taşşak", "dassak", "tassak", "amcık", "amcik", "amcıq", "mcık",
    "göt", "got", "götveren", "götos", "götlek", "gotlek", "meme", "memeucu", "pipi", "vaji", "penis", "erotik",
    "dalyarak", "taşşakkafalı", "am feryadı", "am hoşafı", "sik kafalı", "sik kırığı",
    "şerefsiz", "serefsiz", "it", "köpek", "soysuz", "haysiyetsiz", "karaktersiz",
    "gerizekalı", "gerizekali", "aptal", "salak", "mal", "beyinsiz", "beyniyok", "özürlü", "ozurlu",
    "velet", "zargana", "kolsuz", "aptal", "embesil", "dangalak", "lavuk", "gevşek", "gewsek",
    "atatürk", "atam", "atanı", "atasız", "atana", "atamıza",
    "dinini", "imanını", "allahını", "kitabını", "peygamberini", "allahsız", "kitapsız",
    "ebeni", "ceddini", "sülaleni", "aileni", "anasını", "babasını", "bacısını", "karısını",
    "soyunun", "sopunu", "ırzını", "ahmet ege", "ahmet ege aydemir", "aydemir", "efe serin"
];

const CHAT_LEVEL_ROLES = [
    { level: 5, roleId: ["1434500874889334934"] },
    { level: 10, roleId: ["1434500883743244298", "1452254172391936103"] },
    { level: 20, roleId: ["1434500887174451310"] },
    { level: 25, roleId: ["1434503016186122250", "1452254397848485890"] },
    { level: 30, roleId: ["1434503158889058364"] },
    { level: 50, roleId: ["1434503226903887992", "1452254914192343050"] },
    { level: 65, roleId: ["1434503281001894018"] },
    { level: 85, roleId: ["1434503335234502686"] },
    { level: 100, roleId: ["1434503423797231748"] }
];

const SURE_ROLLER = [
    { months: 1, roleId: "1453823439935635517" },
    { months: 3, roleId: "1453823434902732872" },
    { months: 6, roleId: "1453823290568216740" },
    { months: 8, roleId: "1453823233525551195" },
    { months: 12, roleId: "1453823086431309854" },
    { months: 24, roleId: "1453823043007938642" }
];

const VC_LEVELS = [
    { label: "V.Bronz", requiredMinutes: 60, roleId: "1453826353559376003" },
    { label: "V.Silver", requiredMinutes: 300, roleId: "1453826481456152748" },
    { label: "V.Gold", requiredMinutes: 600, roleId: "1453826601182564486" },
    { label: "V.Platinum", requiredMinutes: 1200, roleId: "1453826655423434794" },
    { label: "V.Diamond", requiredMinutes: 2400, roleId: "1453826753007980710" },
    { label: "V.Master", requiredMinutes: 4800, roleId: "1453826824470532279" },
    { label: "V.Legend", requiredMinutes: 9600, roleId: "1453826867780915382" }
];

// ================= VERİTABANI & DOSYA SİSTEMİ =================

// MongoDB Bağlantısı (Stats & Level İçin)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Bağlantısı Kuruldu."))
  .catch(err => console.error("🔴 MongoDB Bağlantı Hatası:", err));

// MongoDB Şemaları
const chatUserSchema = new mongoose.Schema({ userId: { type: String, unique: true }, joinedAt: Date, xp: { type: Number, default: 0 }, level: { type: Number, default: 0 }, totalMsg: { type: Number, default: 0 } });
const ChatUser = mongoose.model("ChatUser", chatUserSchema);

const voiceUserSchema = new mongoose.Schema({ userId: { type: String, unique: true }, voiceMinutes: { type: Number, default: 0 } });
const VoiceUser = mongoose.model("VoiceUser", voiceUserSchema);

const registerSchema = new mongoose.Schema({ userId: { type: String, unique: true }, name: String, age: Number, registeredAt: { type: Date, default: Date.now }, registeredBy: String });
const RegisteredUser = mongoose.model("RegisteredUser", registerSchema);

// JSON Dosya Yönetimi (Guard Logları & Notlar İçin)
const loadData = (path) => { try { if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, 'utf8')); } catch (e) { } return {}; };
const saveData = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

let ihlalTakip = loadData('guard_logs.json');
let userNotes = loadData('user_notes.json');
const db_settings = new Map(); // Sunucu koruma ayarları (RAM'de tutulur)

// ================= CLIENT & DEĞİŞKENLER =================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.User]
});

const xpCooldowns = new Set();
const voiceJoinTimes = new Map();
let activeChatBoostKanal = null;
let activeVoiceBoostKanal = null;

// ================= YARDIMCI FONKSİYONLAR =================

// 1. Guard Filtreleme
function filtreleGelismiş(text) {
    return text.toLowerCase()
        .replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
        .replace(/(.)\1{2,}/g, '$1')
        .replace(/[^\w\s]|_/g, "");
}

// 2. İlerleme Çubuğu (Gelişmiş)
function createProgressBar(current, max = 100) {
    const percent = Math.min(Math.max(0, current), max) / max;
    const filled = Math.round(percent * 10);
    const empty = 10 - filled;
    // Renkli kareler kullan
    const barEmoji = current >= max * 0.8 ? "🟩" : current >= max * 0.4 ? "🟨" : "🟥"; 
    // Not: Level sisteminde full yeşil de olabilir, risk analizinde kırmızı tehlikedir.
    const bar = "🟦".repeat(filled) + "⬜".repeat(empty); 
    return `${bar} (%${Math.round(percent * 100)})`;
}

// 3. Rozet Hesaplayıcı
function getUserBadges(member, points) {
    let badges = [];
    const accAge = Date.now() - member.user.createdTimestamp;
    const dayDiff = accAge / (1000 * 60 * 60 * 24);
    if (dayDiff < 7) badges.push("👶 **Yeni Hesap**");
    if (dayDiff > 365) badges.push("🎖️ **Kadim Üye**");
    if (points === 0) badges.push("🛡️ **Temiz Sicil**");
    if (points >= 50) badges.push("⚠️ **Riskli**");
    return badges.length > 0 ? badges.join(" | ") : "🏷️ Standart Üye";
}

// 4. Süre Rolü Kontrolü
async function checkSureRolleri(member) {
    if (!member || member.user.bot) return;
    const joinDate = member.joinedAt;
    if (!joinDate) return;
    const now = new Date();
    const diffInMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    const uygunRol = SURE_ROLLER.filter(r => diffInMonths >= r.months).sort((a, b) => b.months - a.months)[0];
    if (uygunRol && !member.roles.cache.has(uygunRol.roleId)) {
        await member.roles.remove(SURE_ROLLER.map(r => r.roleId)).catch(() => {});
        await member.roles.add(uygunRol.roleId).catch(() => {});
    }
}

// 5. Ses Verisi İşleme
async function handleVoiceData(userId, member, isPeriodic = false) {
    const userData = voiceJoinTimes.get(userId);
    if (!userData || !member) return;
    let minutes = Math.floor((Date.now() - userData.time) / 60000);
    if (minutes < 1) return;
    if (activeVoiceBoostKanal && userData.channelId === activeVoiceBoostKanal) minutes *= CONF.BOOST_CARPANI;

    let user = await VoiceUser.findOne({ userId: userId });
    if (!user) user = await VoiceUser.create({ userId: userId });
    user.voiceMinutes += minutes;
    await user.save();

    // Ses Rol Kontrolü
    const currentTier = [...VC_LEVELS].reverse().find(v => user.voiceMinutes >= v.requiredMinutes);
    if (currentTier) {
        if (!member.roles.cache.has(currentTier.roleId)) {
            await member.roles.remove(VC_LEVELS.map(v => v.roleId)).catch(() => {});
            await member.roles.add(currentTier.roleId).catch(() => {});
            const log = client.channels.cache.get(CONF.LOG_KANAL_VOICE_LEVEL);
            if(log) log.send(`🎙️ <@${member.id}>, **${currentTier.label}** Ses Rütbesine Ulaştı!`);
        }
    }
    if (isPeriodic) voiceJoinTimes.set(userId, { time: Date.now(), channelId: userData.channelId });
}

// ================= EVENT HANDLERS =================

// --- 1. READY ---
client.once("clientReady", async () => {
    console.log(`🔥 ${client.user.tag} TÜM SİSTEMLERİYLE AKTİF!`);

    // Ses Kanallarını Tarama
    client.guilds.cache.forEach(guild => {
        guild.voiceStates.cache.forEach(state => {
            if (state.channelId && state.member && !state.member.user.bot) {
                if (!voiceJoinTimes.has(state.id)) voiceJoinTimes.set(state.id, { time: Date.now(), channelId: state.channelId });
            }
        });
    });

    // Periyodik Ses Kontrolü (Her 5 Dk)
    setInterval(async () => {
        for (const [userId, data] of voiceJoinTimes) {
            const guild = client.guilds.cache.first();
            if (!guild) continue;
            const member = guild.members.cache.get(userId);
            if (member && member.voice.channel) await handleVoiceData(userId, member, true).catch(e => {});
            else voiceJoinTimes.delete(userId);
        }
    }, 5 * 60 * 1000);
});

// --- 2. GUILD MEMBER ADD ---
client.on("guildMemberAdd", async member => {
    if (member.user.bot) return;
    await ChatUser.findOneAndUpdate({ userId: member.id }, { joinedAt: member.joinedAt }, { upsert: true });

    try {
        await member.setNickname("Kayıtsız | ??").catch(() => {});
        await member.roles.add(CONF.ROLE_UNREGISTERED).catch(() => {});
        const channel = member.guild.channels.cache.get(CONF.LOG_KANAL_WELCOME);
        if (channel) {
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`🏰 Sunucumuza Hoş Geldin!`)
                .setDescription(`Merhaba ${member}, seninle **${member.guild.memberCount}** kişiyiz!\n\n> Kayıt için isim yaş yazınız.\n> Yetkili: <@&${CONF.ROLE_YETKILI}>`)
                .setColor("#5865F2")
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
            channel.send({ content: `${member} | <@&${CONF.ROLE_YETKILI}>`, embeds: [welcomeEmbed] });
        }
    } catch (e) { console.error(e); }
});

// --- 3. VOICE STATE UPDATE ---
client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.member?.user.bot) return;
    const userId = newState.id;
    // Giriş
    if (!oldState.channelId && newState.channelId) {
        voiceJoinTimes.set(userId, { time: Date.now(), channelId: newState.channelId });
    } 
    // Çıkış
    else if (oldState.channelId && !newState.channelId) {
        if (voiceJoinTimes.has(userId)) { await handleVoiceData(userId, oldState.member, false); voiceJoinTimes.delete(userId); }
    } 
    // Kanal Değişim
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        if (voiceJoinTimes.has(userId)) await handleVoiceData(userId, oldState.member, false);
        voiceJoinTimes.set(userId, { time: Date.now(), channelId: newState.channelId });
    }
});

// --- 4. MESSAGE CREATE (GUARD + XP + KOMUTLAR) ---
client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.guild) return;

    // [A] GUARD KONTROLÜ (Öncelikli)
    const settings = db_settings.get(msg.guild.id) || { kufur: false, link: false, spam: false, yoneticiEngel: false };
    const isYonetici = msg.member.permissions.has(PermissionsBitField.Flags.Administrator) || msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
    const dokunulmazMi = isYonetici && !settings.yoneticiEngel;

    if (!dokunulmazMi) {
        let yasakli = false, sebep = "";

        // Küfür Kontrolü
        if (settings.kufur) {
            const temiz = filtreleGelismiş(msg.content);
            if (KUFUR_LISTESI.some(k => temiz.split(/\s+/).includes(filtreleGelismiş(k)) || (k.length > 3 && temiz.replace(/\s+/g, "").includes(filtreleGelismiş(k))))) {
                yasakli = true; sebep = "Küfür";
            }
        }
        // Link Kontrolü
        if (!yasakli && settings.link && /(https?:\/\/|www\.|discord\.(gg|io|me|li))/gi.test(msg.content)) {
            yasakli = true; sebep = "Reklam";
        }

        if (yasakli) {
            await msg.delete().catch(() => {});
            let uData = ihlalTakip[msg.author.id] || { ihlalSayisi: 0, geçmiş: [] };
            uData.ihlalSayisi++;
            uData.geçmiş.push({ tarih: new Date().toLocaleString("tr-TR"), sebep });
            ihlalTakip[msg.author.id] = uData;
            saveData('guard_logs.json', ihlalTakip);

            // Timeout İşlemi
            let mSure = uData.ihlalSayisi === 3 ? 10000 : uData.ihlalSayisi === 6 ? 60000 : uData.ihlalSayisi >= 10 ? 300000 : 0;
            if (mSure > 0) await msg.member.timeout(mSure, `Guard İhlali - ${sebep}`).catch(() => {});

            msg.channel.send(`🚫 ${msg.author}, mesajın engellendi! (**Sebep:** ${sebep} | **İhlal:** ${uData.ihlalSayisi})`).then(m => setTimeout(() => m.delete(), 5000));
            return; // Guard'a takılan kod buradan sonrasını görmez.
        }
    }

    // [B] XP SİSTEMİ (Guard'dan geçen temiz mesajlar)
    if (!xpCooldowns.has(msg.author.id)) {
        let user = await ChatUser.findOne({ userId: msg.author.id });
        if (!user) user = await ChatUser.create({ userId: msg.author.id });

        user.totalMsg++;
        let xp = Math.floor(Math.random() * 10) + 15;
        if (activeChatBoostKanal === msg.channel.id) xp *= 2;
        user.xp += xp;

        let needed = 100 + user.level * 200;
        while (user.xp >= needed && user.level < 100) {
            user.xp -= needed;
            user.level++;
            needed = 100 + user.level * 200;
            const role = CHAT_LEVEL_ROLES.find(r => r.level === user.level);
            if (role) {
                const allRoles = CHAT_LEVEL_ROLES.flatMap(r => r.roleId);
                await msg.member.roles.remove(allRoles).catch(() => {});
                await msg.member.roles.add(role.roleId).catch(() => {});
            }
            const log = client.channels.cache.get(CONF.LOG_KANAL_CHAT_LEVEL);
            if (log) log.send(`🎉 <@${msg.author.id}> **${user.level}. Seviye Oldunuz!**`);
        }
        await user.save();
        xpCooldowns.add(msg.author.id);
        setTimeout(() => xpCooldowns.delete(msg.author.id), CONF.CHAT_COOLDOWN);
        if (!user.joinedAt && msg.member?.joinedAt) user.joinedAt = msg.member.joinedAt;
    }

    // [C] KOMUT YÖNETİCİSİ
    if (!msg.content.startsWith(PREFIX)) return;
    const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // 1. [.rank] - Gelişmiş Chat Rank
    if (cmd === "rank") {
        const target = msg.mentions.users.first() || msg.author;
        const member = await msg.guild.members.fetch(target.id).catch(() => null);
        if (!member) return msg.reply("❌ Üye bulunamadı.");

        let u = await ChatUser.findOne({ userId: target.id });
        if (!u) return msg.reply("❌ Veri yok. Biraz sohbet edin!");

        await checkSureRolleri(member);
        const need = 100 + u.level * 200;
        const bar = createProgressBar(u.xp, need);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${target.username} Rank Kartı`, iconURL: target.displayAvatarURL() })
            .setColor("Green")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Seviye:** ${u.level}\n**XP:** ${u.xp} / ${need}\n**Mesaj:** ${u.totalMsg}`)
            .addFields({ name: `İlerleme`, value: `${bar}`, inline: false })
            .setFooter({ text: activeChatBoostKanal === msg.channel.id ? "🔥 Bu kanalda 2x XP Aktif!" : "Standart XP" });
        return msg.reply({ embeds: [embed] });
    }

    // 2. [.vc] - Gelişmiş Ses İstatistik
    if (cmd === "vc") {
        const target = msg.mentions.users.first() || msg.author;
        let user = await VoiceUser.findOne({ userId: target.id });
        let totalMins = user ? user.voiceMinutes : 0;

        if (voiceJoinTimes.has(target.id)) {
            const currentData = voiceJoinTimes.get(target.id);
            let sessionMins = Math.floor((Date.now() - currentData.time) / 60000);
            if (activeVoiceBoostKanal && currentData.channelId === activeVoiceBoostKanal) sessionMins *= CONF.BOOST_CARPANI;
            totalMins += sessionMins;
        }

        const currentTier = [...VC_LEVELS].reverse().find(v => totalMins >= v.requiredMinutes) || { label: "Çaylak", requiredMinutes: 0 };
        const nextTier = VC_LEVELS.find(v => totalMins < v.requiredMinutes);

        let progressStr = "👑 Maksimum Rütbe!";
        if (nextTier) {
            const needed = nextTier.requiredMinutes - currentTier.requiredMinutes;
            const current = totalMins - currentTier.requiredMinutes;
            const bar = createProgressBar(current, needed);
            progressStr = `${bar}\n**${nextTier.label}** için **${nextTier.requiredMinutes - totalMins}** dk kaldı.`;
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${target.username} Ses İstatistiği`, iconURL: target.displayAvatarURL() })
            .setColor("Gold")
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: "Rütbe", value: `\`${currentTier.label}\``, inline: true },
                { name: "Toplam Süre", value: `\`${Math.floor(totalMins / 60)} sa ${totalMins % 60} dk\``, inline: true },
                { name: "Sıradaki Hedef", value: progressStr, inline: false }
            );
        return msg.reply({ embeds: [embed] });
    }

    // 3. [.csıralama] - Top 10 Chat
    if (cmd === "csıralama") {
        const top = await ChatUser.find().sort({ level: -1, xp: -1 }).limit(10);
        if (!top.length) return msg.reply("Sıralama yok.");
        const leaderboard = await Promise.all(top.map(async (u, i) => {
            let member = msg.guild.members.cache.get(u.userId) || await msg.guild.members.fetch(u.userId).catch(() => null);
            const name = member ? member.user.username : "Bilinmeyen";
            return `\`${i+1}.\` **${name}** • Lvl ${u.level} • ${u.totalMsg} Msj`;
        }));
        const embed = new EmbedBuilder().setTitle("🏆 Chat Sıralaması").setColor("Blurple").setDescription(leaderboard.join("\n"));
        return msg.reply({ embeds: [embed] });
    }

    // 4. [.vsıralama] - Top 10 Ses
    if (cmd === "vsıralama") {
        const topUsers = await VoiceUser.find({ voiceMinutes: { $gt: 0 } }).sort({ voiceMinutes: -1 }).limit(10);
        if (topUsers.length === 0) return msg.reply("Ses verisi yok.");
        let desc = "";
        for (let i = 0; i < topUsers.length; i++) {
            const u = topUsers[i];
            let member = msg.guild.members.cache.get(u.userId) || await msg.guild.members.fetch(u.userId).catch(() => null);
            const name = member ? member.user.username : "Bilinmeyen";
            desc += `\`${i+1}.\` **${name}** • ${(u.voiceMinutes / 60).toFixed(1)} Saat\n`;
        }
        const embed = new EmbedBuilder().setTitle("🎙️ Top 10 Ses").setDescription(desc).setColor("#FFD700");
        return msg.reply({ embeds: [embed] });
    }

    // 6. [.kayıt] - Kayıt İşlemi
    if (cmd === "kayıt") {
        if (!msg.member.roles.cache.has(CONF.ROLE_YETKILI) && !isYonetici) return;
        const targetId = args[0]?.replace(/[<@!>]/g, "");
        const name = args[1];
        const age = args[2];

        if (!targetId || !name || !age) return msg.reply("Kullanım: `.kayıt @kullanıcı İsim Yaş`");

        try {
            const member = await msg.guild.members.fetch(targetId).catch(() => null);
            if (!member) return msg.reply("Kullanıcı bulunamadı.");

            const newName = `${name.charAt(0).toUpperCase() + name.slice(1)} | ${age}`;
            await member.setNickname(newName);
            await member.roles.remove(CONF.ROLE_UNREGISTERED);
            await member.roles.add(CONF.ROLE_MEMBER);

            await RegisteredUser.findOneAndUpdate({ userId: member.id }, { name, age, registeredBy: msg.author.id }, { upsert: true });

            const regEmbed = new EmbedBuilder()
                .setTitle("✅ Kayıt Başarılı")
                .setDescription(`**${member}** aramıza katıldı!\n**Yeni İsim:** \`${newName}\`\n**Yetkili:** ${msg.author}`)
                .setColor("Green");
            msg.reply({ embeds: [regEmbed] });

            const logKanal = msg.guild.channels.cache.get(CONF.LOG_KANAL_REGISTER);
            if(logKanal) logKanal.send({ embeds: [regEmbed] });
        } catch (error) { console.error("Kayıt Hatası:", error); msg.reply("Kayıt sırasında yetki hatası."); }
    }

    // [.ayar] - Guard Ayarları
    if (cmd === "ayar") {
        if (!isYonetici && !isSahip) return;

        // Veriyi çek (db_settings yoksa boş obje dön)
        const c = db_settings.get(msg.guild.id) || { kufur: false, link: false, spam: false, yoneticiEngel: false };

        const embed = new EmbedBuilder()
            .setTitle("🛡️ Arvex Koruma Paneli")
            .setColor("Blurple")
            .setDescription("Korumaları yönetin. **Yönetici Engel** aktifse, yetkililer de kısıtlamalara dahil olur.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("btn_k").setLabel(`Küfür: ${c.kufur ? "AÇIK" : "KAPALI"}`).setStyle(c.kufur ? ButtonStyle.Success : ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("btn_l").setLabel(`Link: ${c.link ? "AÇIK" : "KAPALI"}`).setStyle(c.link ? ButtonStyle.Success : ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("btn_s").setLabel(`Spam: ${c.spam ? "AÇIK" : "KAPALI"}`).setStyle(c.spam ? ButtonStyle.Success : ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("btn_ye").setLabel(`Yön. Engel: ${c.yoneticiEngel ? "AÇIK" : "KAPALI"}`).setStyle(c.yoneticiEngel ? ButtonStyle.Success : ButtonStyle.Danger)
        );

        msg.reply({ embeds: [embed], components: [row] });
    }

    // 9. [Boost Komutları]
    if (msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (cmd === "boost-ayarla") { activeChatBoostKanal = msg.channel.id; msg.reply("🚀 Chat Boost Aktif!"); }
        if (cmd === "boost-kapat") { activeChatBoostKanal = null; msg.reply("🛑 Chat Boost Kapalı."); }
        if (cmd === "vboost-ayarla") { 
            if(!msg.member.voice.channel) return msg.reply("Sese gir.");
            activeVoiceBoostKanal = msg.member.voice.channel.id; 
            msg.reply(`🎙️ **${msg.member.voice.channel.name}** Ses Boost Aktif!`); 
        }
        if (cmd === "vboost-kapat") { activeVoiceBoostKanal = null; msg.reply("🛑 Ses Boost Kapalı."); }
    }
});

// interactionCreate içinde:
    // Buradaki (interaction) önüne "async" ekledik:
    client.on("interactionCreate", async (interaction) => {
        
if (interaction.isButton() && ["btn_k", "btn_l", "btn_s", "btn_ye"].includes(interaction.customId)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({content: "Yetkiniz yetersiz.", flags: MessageFlags.Ephemeral});

    let c = db_settings.get(interaction.guildId) || { kufur: false, link: false, spam: false, yoneticiEngel: false };

    if (interaction.customId === "btn_k") c.kufur = !c.kufur;
    if (interaction.customId === "btn_l") c.link = !c.link;
    if (interaction.customId === "btn_s") c.spam = !c.spam;
    if (interaction.customId === "btn_ye") c.yoneticiEngel = !c.yoneticiEngel; // Yeni ayar

    db_settings.set(interaction.guildId, c);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("btn_k").setLabel(`Küfür: ${c.kufur?"AÇIK":"KAPALI"}`).setStyle(c.kufur?ButtonStyle.Success:ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("btn_l").setLabel(`Link: ${c.link?"AÇIK":"KAPALI"}`).setStyle(c.link?ButtonStyle.Success:ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("btn_s").setLabel(`Spam: ${c.spam?"AÇIK":"KAPALI"}`).setStyle(c.spam?ButtonStyle.Success:ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("btn_ye").setLabel(`Yön. Engel: ${c.yoneticiEngel?"AÇIK":"KAPALI"}`).setStyle(c.yoneticiEngel?ButtonStyle.Success:ButtonStyle.Danger)
    );

    await interaction.update({ components: [row] });
  }
    });
    // ==========================================
    // 6. EXPRESS SERVER & BOT BASLATMA
    // ==========================================

const express = require('express');
const app = express();
const port = process.env.PORT || 3100;
app.listen(port, '0.0.0.0', () => {
  console.log(`Bot ${port} portunda aktif`);
});

    // --- BOTU LOGIN ET ---
    client.login(process.env.TOKEN).catch(e => {
        console.error("❌ Token Hatası: Bot başlatılamadı!");
        console.error(e);
    });

    // ==========================================
    // 7. ANTI-CRASH (BOTUN ÇÖKMESİNİ ENGELLER)
    // ==========================================

    process.on('unhandledRejection', (reason, p) => {
        console.log('⚠️ [Hata Yakalandı] - Unhandled Rejection:', reason);
    });

    process.on("uncaughtException", (err, origin) => {
        console.log('⚠️ [Hata Yakalandı] - Uncaught Exception:', err);
    });

    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.log('⚠️ [Hata Yakalandı] - Exception Monitor:', err);
    });

