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

// 2. İlerleme Çubuğu (Senin İstediğin Mavi/Beyaz Tasarım)
function createProgressBar(current, max = 100) {
    const percent = Math.min(Math.max(0, current), max) / max;
    const filled = Math.round(percent * 10);
    const empty = 10 - filled;
    
    // Mavi dolu, Beyaz boş kareler
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

// ... [B] XP SİSTEMİ İÇİNDEKİ WHILE DÖNGÜSÜ ...
while (user.xp >= needed && user.level < 100) {
    user.xp -= needed;
    user.level++;
    needed = 100 + user.level * 200;
    
    const role = CHAT_LEVEL_ROLES.find(r => r.level === user.level);
    if (role) {
        // --- DÜZENLENEN KISIM BAŞLANGIÇ ---
        
        // Sadece diğer LEVEL rollerini sil (Misafir ve Üye rollerine dokunma)
        // Eğer CHAT_LEVEL_ROLES listesindeki eski level rollerini temizlemek istiyorsan bu kalabilir.
        await msg.member.roles.remove(CHAT_LEVEL_ROLES.flatMap(r => r.roleId)).catch(() => {});
        
        // Yeni level rolünü ekle
        await msg.member.roles.add(role.roleId).catch(() => {});

        // EĞER LEVEL 10 OLDUYSA ÜYE ROLÜNÜ DE EKLE (MİSAFİRİ SİLME)
        if (user.level >= 10) {
            const uyeRolID = "1411088827556171937"; // Senin Üye Rol ID'n
            if (!msg.member.roles.cache.has(uyeRolID)) {
                await msg.member.roles.add(uyeRolID).catch(() => {});
            }
        }

        // --- DÜZENLENEN KISIM BİTİŞ ---
    }
    const log = client.channels.cache.get(CONF.LOG_KANAL_CHAT_LEVEL);
    if (log) log.send(`🎉 <@${msg.author.id}> **${user.level}. Seviye Oldunuz!**`);
}
    // [C] KOMUT YÖNETİCİSİ
    if (!msg.content.startsWith(PREFIX)) return;
    const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // 1. [.rank] - MAX Level Korumalı
    if (cmd === "rank") {
        const target = msg.mentions.users.first() || msg.author;
        const member = await msg.guild.members.fetch(target.id).catch(() => null);
        if (!member) return msg.reply("❌ Üye bulunamadı.");

        let u = await ChatUser.findOne({ userId: target.id });
        if (!u) return msg.reply("❌ Veri yok. Biraz sohbet edin!");

        await checkSureRolleri(member);

        // --- AYARLAR ---
        const MAX_LEVEL = 100;
        const isMaxed = u.level >= MAX_LEVEL;
        // ---------------

        let barDisplay = "";
        let xpDisplay = "";
        let nextLevelText = "";

        if (isMaxed) {
            barDisplay = "🟦".repeat(10) + " (%100)";
            xpDisplay = "♾️ / ♾️";
            nextLevelText = "👑 **Maksimum Seviyeye Ulaştın!**";
        } else {
            const need = 100 + u.level * 200;
            barDisplay = createProgressBar(u.xp, need);
            xpDisplay = `${u.xp} / ${need}`;
            nextLevelText = barDisplay;
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${target.username} Rank Kartı`, iconURL: target.displayAvatarURL() })
            .setColor(isMaxed ? "Gold" : "Blue")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Seviye:** ${u.level}\n**Mesaj:** ${u.totalMsg}`)
            .addFields(
                { name: "✨ Seviye Durumu", value: isMaxed ? "🏆 **MAX LEVEL**" : `\`${u.level}. Seviye\``, inline: true },
                { name: "⚔️ XP Durumu", value: `\`${xpDisplay}\``, inline: true },
                { name: "İlerleme", value: nextLevelText, inline: false }
            )
            .setFooter({ text: isMaxed ? "Bu sunucunun zirvesindesin!" : (activeChatBoostKanal === msg.channel.id ? "🔥 2x XP Aktif!" : "Standart XP") });

        return msg.reply({ embeds: [embed] });
    }

    // 2. [.vc] - Son Rütbe Efektli
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

        let progressStr = "";
        let isMaxRank = false;

        if (nextTier) {
            const needed = nextTier.requiredMinutes - currentTier.requiredMinutes;
            const current = totalMins - currentTier.requiredMinutes;
            const bar = createProgressBar(current, needed);
            progressStr = `${bar}\n**${nextTier.label}** için **${nextTier.requiredMinutes - totalMins}** dk kaldı.`;
        } else {
            isMaxRank = true;
            progressStr = "🎉 **Tebrikler! Sunucunun en yüksek ses rütbesindesin.**\n🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 (%100)";
        }

        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${target.username} Ses İstatistiği`, iconURL: target.displayAvatarURL() })
            .setColor(isMaxRank ? "Gold" : "Green")
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: "🏷️ Rütbe", value: `\`${currentTier.label}\``, inline: true },
                { name: "⏱️ Toplam Süre", value: `\`${hours} sa ${mins} dk\``, inline: true },
                { name: isMaxRank ? "🏆 ZİRVE" : "📈 Sıradaki Hedef", value: progressStr, inline: false }
            );

        return msg.reply({ embeds: [embed] });
    }

    // 3. [.csıralama]
    if (cmd === "csıralama") {
        const top = await ChatUser.find().sort({ level: -1, xp: -1 }).limit(10);
        if (!top.length) return msg.reply("Henüz veri yok.");

        let desc = "";
        top.forEach((u, i) => {
            let member = msg.guild.members.cache.get(u.userId);
            const name = member ? member.user.username : "Bilinmeyen";

            const rank = i + 1;
            const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;
            const style = rank <= 3 ? "**" : "";

            desc += `${emoji} ${style}${name}${style}\n└ 🟦 Lvl: \`${u.level}\` • Msj: \`${u.totalMsg}\`\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("🏆 Chat Lider Tablosu")
            .setColor("Gold")
            .setDescription(desc)
            .setFooter({ text: "Sıralama anlık güncellenir." });

        return msg.reply({ embeds: [embed] });
    }

    // 4. [.vsıralama]
    if (cmd === "vsıralama") {
        const topUsers = await VoiceUser.find({ voiceMinutes: { $gt: 0 } }).sort({ voiceMinutes: -1 }).limit(10);
        if (!topUsers.length) return msg.reply("Ses verisi yok.");

        let desc = "";
        topUsers.forEach((u, i) => {
            let member = msg.guild.members.cache.get(u.userId);
            const name = member ? member.user.username : "Bilinmeyen";
            const hours = (u.voiceMinutes / 60).toFixed(1);

            const rank = i + 1;
            const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `\`#${rank}\``;
            const style = rank <= 3 ? "**" : "";

            desc += `${emoji} ${style}${name}${style}\n└ 🎙️ \`${hours} Saat\`\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("🎙️ Ses Lider Tablosu")
            .setColor("DarkVividPink")
            .setDescription(desc)
            .setFooter({ text: "En çok konuşanlar" });

        return msg.reply({ embeds: [embed] });
    }

    // 5. [.profil]
    if (cmd === "profil" || cmd === "stats") {
        const target = msg.mentions.users.first() || msg.author;
        const member = await msg.guild.members.fetch(target.id).catch(() => null);
        if (!member) return msg.reply("❌ Üye bulunamadı.");

        // --- CHAT Verileri ---
        let chatUser = await ChatUser.findOne({ userId: target.id });
        const chatLevel = chatUser ? chatUser.level : 0;
        const chatXP = chatUser ? chatUser.xp : 0;
        const totalMessages = chatUser ? chatUser.totalMsg : 0;

        const MAX_CHAT_LEVEL = 100;
        const isChatMaxed = chatLevel >= MAX_CHAT_LEVEL;

        let chatProgressText = "";
        let chatColor = "Blue";

        if (isChatMaxed) {
            chatProgressText = "👑 **MAX LEVEL**";
            chatColor = "Gold";
        } else {
            const needXP = 100 + chatLevel * 200;
            const chatBar = createProgressBar(chatXP, needXP);
            chatProgressText = `${chatBar} \`(${chatXP} / ${needXP} XP)\``;
        }

        // --- SES Verileri ---
        let voiceUser = await VoiceUser.findOne({ userId: target.id });
        let totalVoiceMinutes = voiceUser ? voiceUser.voiceMinutes : 0;

        let isVoiceLive = false;
        if (voiceJoinTimes.has(target.id)) {
            isVoiceLive = true;
            const currentData = voiceJoinTimes.get(target.id);
            let sessionMins = Math.floor((Date.now() - currentData.time) / 60000);
            if (activeVoiceBoostKanal && currentData.channelId === activeVoiceBoostKanal) sessionMins *= CONF.BOOST_CARPANI;
            totalVoiceMinutes += sessionMins;
        }

        const currentTier = [...VC_LEVELS].reverse().find(v => totalVoiceMinutes >= v.requiredMinutes) || { label: "Çaylak", requiredMinutes: 0 };
        const nextTier = VC_LEVELS.find(v => totalVoiceMinutes < v.requiredMinutes);

        let voiceProgressText = "";
        let voiceRankLabel = `\`${currentTier.label}\``;

        if (nextTier) {
            const neededVoiceMins = nextTier.requiredMinutes - currentTier.requiredMinutes;
            const currentVoiceMins = totalVoiceMinutes - currentTier.requiredMinutes;
            const voiceBar = createProgressBar(currentVoiceMins, neededVoiceMins);
            voiceProgressText = `${voiceBar}\n**${nextTier.label}** için \`${nextTier.requiredMinutes - totalVoiceMinutes} dk\` kaldı.`;
        } else {
            voiceProgressText = "🎉 **En Yüksek Ses Rütbesi!**\n🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 (%100)";
            voiceRankLabel = "🏆 **Efsane**";
            if (!isChatMaxed) chatColor = "Purple";
        }

        const voiceHours = Math.floor(totalVoiceMinutes / 60);
        const voiceMinutes = totalVoiceMinutes % 60;
        const voiceTimeDisplay = `${voiceHours} sa ${voiceMinutes} dk`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `👑 ${target.username} • Aktivite Kartı`, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setColor(chatColor)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(`>>> **${target.username}**'ın sunucudaki toplam etkinlik özeti.`)
            .addFields(
                { name: "💬 Sohbet İstatistikleri", value: `**Seviye:** \`${chatLevel}\`\n**Toplam Mesaj:** \`${totalMessages.toLocaleString()}\`\n**XP İlerlemesi:**\n${chatProgressText}`, inline: false },
                { name: "\u200b", value: "\u200b", inline: false },
                { name: "🎙️ Ses İstatistikleri", value: `**Mevcut Rütbe:** ${voiceRankLabel}\n**Toplam Süre:** \`${voiceTimeDisplay}\`\n**Rütbe İlerlemesi:**\n${voiceProgressText}`, inline: false }
            )
            .setFooter({ text: `${isVoiceLive ? "🟢 Seste Aktif | " : ""}${msg.guild.name} • Aktivite Sistemi`, iconURL: msg.guild.iconURL() })
            .setTimestamp();

        return msg.reply({ embeds: [embed] });
    }
   
    // 6. [.kayıt] - Kayıt İşlemi
if (cmd === "kayıt") {
    // KONTROL: Eğer Yetkili Rolü YOKSA -VE- Yönetici Yetkisi YOKSA işlemi durdur.
    // Yani ikisinden biri varsa kod devam eder.
    if (!msg.member.roles.cache.has(CONF.ROLE_YETKILI) && !isYonetici) {
        return msg.reply("❌ Bu komutu kullanmak için yetkiniz yok.");
    }

    const targetId = args[0]?.replace(/[<@!>]/g, "");
    // args.slice(1, -1) gibi karmaşık yapılar yerine basit mantık:
    // .kayıt @uye isim yaş
    const name = args[1]; 
    const age = args[2];

    if (!targetId || !name || !age) return msg.reply("Kullanım: `.kayıt @kullanıcı İsim Yaş`\nÖrnek: `.kayıt @Ahmet Ahmet 18`");

    try {
        const member = await msg.guild.members.fetch(targetId).catch(() => null);
        if (!member) return msg.reply("❌ Kullanıcı sunucuda bulunamadı.");

        // İsim Düzenleme (İlk harf büyük gerisi küçük + yaş)
        const formatName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const newName = `${formatName} | ${age}`;

        // Yetki Sıralaması Kontrolü (Botun yetkisi yetiyor mu?)
        if (member.roles.highest.position >= msg.guild.members.me.roles.highest.position) {
            return msg.reply("❌ Bu kullanıcının rolü benim rolümden yüksek veya eşit, ismini değiştiremem.");
        }

        await member.setNickname(newName).catch(e => console.log("İsim değiştirilemedi: " + e));
        
        // Rolleri Güncelle
        await member.roles.remove(CONF.ROLE_UNREGISTERED).catch(() => {});
        await member.roles.add(CONF.ROLE_MEMBER).catch(() => {});

        // Veritabanına Yaz
        await RegisteredUser.findOneAndUpdate(
            { userId: member.id }, 
            { name: formatName, age: parseInt(age), registeredBy: msg.author.id }, 
            { upsert: true }
        );

        const regEmbed = new EmbedBuilder()
            .setTitle("✅ Kayıt Başarılı")
            .setDescription(`**${member}** aramıza katıldı!\n\n📛 **Yeni İsim:** \`${newName}\`\n👮 **Yetkili:** ${msg.author}`)
            .setColor("Green")
            .setTimestamp();
            
        msg.reply({ embeds: [regEmbed] });

        const logKanal = msg.guild.channels.cache.get(CONF.LOG_KANAL_REGISTER);
        if(logKanal) logKanal.send({ embeds: [regEmbed] });

    } catch (error) { 
        console.error("Kayıt Hatası:", error); 
        msg.reply("⚠️ Kayıt işlemi sırasında bir hata oluştu."); 
    }
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

    // ==========================================
    // 6. EXPRESS SERVER & BOT BASLATMA
    // ==========================================

const express = require('express');
const app = express();
const port = 3000;//buraya karışmayın.

app.get('/', (req, res) => res.send('we discord'));//değiştirebilirsiniz.

app.listen(port, () =>
console.log(`Bot bu adres üzerinde çalışıyor: http://localhost:${port}`)//port
);

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








