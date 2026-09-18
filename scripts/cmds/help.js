const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "2.0",
    author: "Eden",
    countDown: 5,
    role: 0,
    shortDescription: { en: "help menu" },
    longDescription: { en: "View the list of commands or detailed info" },
    category: "System",
    guide: { en: "{pn} / help <command>" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);

    const cyberImages = [
      "https://i.postimg.cc/9QRsHtHs/ZEPHYRION-20260707-211551-0000.gif",
      "https://i.postimg.cc/9QRsHtHs/ZEPHYRION-20260707-211551-0000.gif",
      "https://i.postimg.cc/9QRsHtHs/ZEPHYRION-20260707-211551-0000.gif"
    ];

    const randomBG = cyberImages[Math.floor(Math.random() * cyberImages.length)];

    // MAIN HELP LIST
    if (args.length === 0) {
      const categories = {};
      let msg = "";

      msg += ` ⟪♠️ZEPHYRION HELP MENU⟫ \n\n`;

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        const category = value.config.category || "Uncategorized";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      for (const category in categories) {
        msg += `\n          ⟬ ${category.toUpperCase()} ⟭\n`;
        msg += `⧉━━━━━━━━━━━━⧉\n`;

        const sorted = categories[category].sort();

        // 🔥 TWO-COLUMN STYLE (only update you asked for)
        for (let i = 0; i < sorted.length; i += 2) {
          const left = `◈ ${sorted[i]}`;
          const right = sorted[i + 1] ? `◈ ${sorted[i + 1]}` : "";
          msg += `${left.padEnd(18)} ${right}\n`;
        }
      }

      msg += `
⧉━━━━━━━━━━━━⧉
⚙ Total Commands: ${commands.size}
🎛 Prefix: ${prefix}
📘 Usage: ${prefix}help <cmd>
🚩 Bot Owner: 𝐄𝐝𝐞𝐧 愛
🏴 Owner Inbox: m.me/ibonex.edenXtonu
⧉━━━━━━━━━━━━⧉`;

      try {
        const imgPath = path.join(__dirname, "cyber_help.jpg");
        const imgData = (await axios.get(randomBG, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(imgData, "binary"));
        await message.reply({ body: msg, attachment: fs.createReadStream(imgPath) });
        fs.unlinkSync(imgPath);
      } catch (e) {
        await message.reply(msg);
      }

      return;
    }

    // COMMAND INFO
    const name = args[0].toLowerCase();
    const cmd = commands.get(name) || commands.get(aliases.get(name));

    if (!cmd) return message.reply(`❌ No command named "${name}" found.`);

    const conf = cmd.config;

    const category = conf.category || "Unknown";
    const desc = conf.longDescription?.en || "No description available.";
    const aliasList = conf.aliases?.length ? conf.aliases.join(", ") : "None";
    const roleText =
      conf.role == 0 ? "User" :
      conf.role == 1 ? "Admin" :
      conf.role == 2 ? "Super Admin" : "Unknown";

    const cooldown = conf.countDown || 0;
    const money = conf.money || 0;
    const premium = conf.isPremium ? "Yes" : "No";
    const author = conf.author || "Unknown";

    const usage =
      conf.guide?.en?.replace(/{p}/g, prefix).replace(/{n}/g, conf.name) ||
      "No usage guide available.";

    const infoMsg = `
ZEPHYRION COMMAND INFO🎏

🟣 COMMAND ID → ${conf.name}
🔻 CATEGORY → ${category}
🔻 DESC → ${desc}

♠️ STATUS PANEL
   I–ᐉ Aliases: ${aliasList}
   I–ᐉ Version: ${conf.version || "1.0"}
   I–ᐉ Permission: ${roleText}
   I–ᐉ Cooldown: ${cooldown}s
   I–ᐉ Money Required: $${money}
   I–ᐉ Premium: ${premium}

👤 AUTHOR → ${author}

📘 USAGE 
${usage}

✦••┈┈┈┈┈┈┈┈┈┈┈┈••✦
`;

    return message.reply(infoMsg);
  }
};
