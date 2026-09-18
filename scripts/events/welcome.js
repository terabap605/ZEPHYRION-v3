const axios = require("axios");

/*
====================================================
WELCOME VIDEO LINKS
====================================================
Put your direct Posting.ccr / CDN video URLs here.
A random video will be used for every welcome event.
====================================================
*/

const WELCOME_VIDEOS = [
  "https://i.postimg.cc/Gh5MXwYb/welcome.gif",
  "https://i.postimg.cc/Gh5MXwYb/welcome.gif",
  "https://i.postimg.cc/Gh5MXwYb/welcome.gif",
  "https://i.postimg.cc/Gh5MXwYb/welcome.gif"
];

/*
====================================================
FONT
====================================================
Converts:
WELCOME
into:
𝚆𝙴𝙻𝙲𝙾𝙼𝙴
====================================================
*/

function zephyrFont(text) {
  if (!text) return "";

  let result = "";

  for (const char of String(text)) {
    const cp = char.codePointAt(0);

    // A-Z
    if (cp >= 0x41 && cp <= 0x5A) {
      result += String.fromCodePoint(
        0x1D670 + (cp - 0x41)
      );
      continue;
    }

    // a-z
    if (cp >= 0x61 && cp <= 0x7A) {
      result += String.fromCodePoint(
        0x1D68A + (cp - 0x61)
      );
      continue;
    }

    // 0-9
    if (cp >= 0x30 && cp <= 0x39) {
      result += String.fromCodePoint(
        0x1D7F6 + (cp - 0x30)
      );
      continue;
    }

    result += char;
  }

  return result;
}

function ordinal(number) {
  const n = Number(number);

  if (n % 100 >= 11 && n % 100 <= 13)
    return `${n}th`;

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function randomize(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

/*
====================================================
VIDEO STREAM
====================================================
*/

async function getVideoStream(url) {
  if (!url || url.startsWith("YOUR_"))
    return null;

  // GoatBot utility
  try {
    if (
      global.utils &&
      typeof global.utils.getStreamFromURL === "function"
    ) {
      const stream =
        await global.utils.getStreamFromURL(url);

      if (stream)
        return stream;
    }
  } catch (error) {
    console.error(
      "[Welcome] GoatBot video stream error:",
      error.message
    );
  }

  // Axios fallback
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: status =>
        status >= 200 && status < 400
    });

    return response.data;
  } catch (error) {
    console.error(
      "[Welcome] Video request failed:",
      error.message
    );

    return null;
  }
}

async function getRandomWelcomeVideo() {
  const validLinks = WELCOME_VIDEOS.filter(
    url =>
      typeof url === "string" &&
      url.trim() &&
      !url.startsWith("YOUR_")
  );

  if (!validLinks.length)
    return null;

  /*
  Try random links until one works.
  This prevents one broken Posting.ccr link
  from breaking the welcome system.
  */
  for (const url of randomize(validLinks)) {
    const stream = await getVideoStream(url);

    if (stream)
      return stream;
  }

  return null;
}

module.exports = {
  config: {
    name: "welcome",
    version: "13.0",
    author: "EryXenX",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage:
        "𝚆𝙴𝙻𝙲𝙾𝙼𝙴"
    }
  },

  onStart: async ({
    threadsData,
    usersData,
    message,
    event,
    api
  }) => {
    // Only run when members are added
    if (event.logMessageType !== "log:subscribe")
      return;

    const threadID = event.threadID;

    const addedParticipants =
      event.logMessageData?.addedParticipants || [];

    if (!addedParticipants.length)
      return;

    /*
    ====================================================
    THREAD SETTINGS
    ====================================================
    */

    let threadData;

    try {
      threadData =
        await threadsData.get(threadID);
    } catch (error) {
      console.error(
        "[Welcome] Thread data error:",
        error.message
      );
      return;
    }

    if (!threadData)
      return;

    // Respect GoatBot's welcome setting
    if (
      threadData.settings &&
      threadData.settings.sendWelcomeMessage === false
    ) {
      return;
    }

    /*
    ====================================================
    DO NOT WELCOME THE BOT AS A MEMBER
    ====================================================
    */

    const botID = String(
      api.getCurrentUserID()
    );

    const members = addedParticipants.filter(
      participant =>
        String(participant.userFbId) !== botID
    );

    if (!members.length)
      return;

    /*
    ====================================================
    GROUP INFO
    ====================================================
    */

    const totalMembers =
      Array.isArray(event.participantIDs)
        ? event.participantIDs.length
        : members.length;

    const groupName =
      threadData.threadName ||
      "OUR GROUP";

    let inviterName = "Someone";

    try {
      if (event.author) {
        inviterName =
          await usersData.getName(event.author);
      }
    } catch (_) {}

    /*
    ====================================================
    MEMBER NUMBER
    ====================================================
    */

    const firstMemberNumber = Math.max(
      1,
      totalMembers - members.length + 1
    );

    const mentions = [];
    const memberLines = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      const userID = String(
        member.userFbId
      );

      const userName =
        member.fullName ||
        member.name ||
        "New Member";

      const memberNumber =
        firstMemberNumber + i;

      /*
      Keep the actual username normal
      so Messenger mention stays correct.
      */
      mentions.push({
        tag: userName,
        id: userID
      });

      memberLines.push(
        `• ${userName}\n  ${zephyrFont(
          `YOU ARE OUR ${ordinal(memberNumber)} MEMBER IN THIS GROUP.`
        )}`
      );
    }

    /*
    ====================================================
    WELCOME MESSAGE
    ====================================================
    */

    let body = "";

    if (members.length === 1) {
      const user = members[0];

      const userName =
        user.fullName ||
        user.name ||
        "New Member";

      const memberNumber =
        firstMemberNumber;

      body =
        `${zephyrFont("WELCOME")} 🌸\n\n` +

        `👤 ${userName}\n` +

        `${zephyrFont(
          `YOU ARE OUR ${ordinal(memberNumber)} MEMBER IN THIS GROUP.`
        )}\n\n` +

        `${zephyrFont(
          "WE ARE HAPPY TO HAVE YOU HERE."
        )} 🖤\n` +

        `${zephyrFont(
          "EVERY NEW MEMBER BRINGS NEW ENERGY, NEW MEMORIES AND A NEW STORY."
        )} ✨\n\n` +

        `${zephyrFont(
          "BE KIND, RESPECT EVERYONE AND HELP KEEP THIS GROUP A PEACEFUL PLACE."
        )} 🤝\n\n` +

        `${zephyrFont(
          "PLEASE READ THE GROUP RULES AND FOLLOW THEM."
        )} 📜\n\n` +

        `${zephyrFont(
          "STAY POSITIVE • STAY RESPECTFUL • STAY ACTIVE"
        )}\n\n` +

        `${zephyrFont(
          "KEEP GROWING, KEEP SMILING AND MAKE GOOD MEMORIES HERE."
        )} 🚀\n\n` +

        `${zephyrFont(
          `ADDED BY ${inviterName}`
        )}\n` +

        `${zephyrFont(
          `GROUP ${groupName}`
        )}\n\n` +

        `${zephyrFont(
          "ENJOY YOUR STAY ✨"
        )}`;
    } else {
      body =
        `${zephyrFont("WELCOME")} 🌸\n\n` +

        `${zephyrFont(
          "A WARM WELCOME TO OUR NEW MEMBERS"
        )} 🖤\n\n` +

        `${memberLines.join("\n\n")}\n\n` +

        `${zephyrFont(
          "YOU ARE ALL NOW A PART OF OUR GROUP FAMILY."
        )} ✨\n\n` +

        `${zephyrFont(
          "RESPECT EVERYONE, FOLLOW THE RULES AND HELP KEEP THE GROUP FRIENDLY."
        )} 🤝\n\n` +

        `${zephyrFont(
          "STAY POSITIVE • STAY RESPECTFUL • STAY ACTIVE"
        )}\n\n` +

        `${zephyrFont(
          "NEW PEOPLE MEAN NEW MEMORIES. MAKE THEM WORTH REMEMBERING."
        )} 🚀\n\n` +

        `${zephyrFont(
          `ADDED BY ${inviterName}`
        )}\n` +

        `${zephyrFont(
          `GROUP ${groupName}`
        )}\n\n` +

        `${zephyrFont(
          "ENJOY YOUR STAY ✨"
        )}`;
    }

    /*
    ====================================================
    GET RANDOM VIDEO
    ====================================================
    */

    let videoStream = null;

    try {
      videoStream =
        await getRandomWelcomeVideo();
    } catch (error) {
      console.error(
        "[Welcome] Random video error:",
        error.message
      );
    }

    /*
    ====================================================
    SEND ONE MESSAGE
    ====================================================
    */

    const form = {
      body,
      mentions
    };

    if (videoStream) {
      form.attachment = videoStream;
    }

    try {
      await message.send(form);

      console.log(
        `[Welcome] Welcomed ${members.length} member(s) in ${threadID}`
      );
    } catch (error) {
      console.error(
        "[Welcome] Send error:",
        error.message
      );

      /*
      If video sending fails, send the welcome text
      instead of completely failing the event.
      */
      try {
        await message.send({
          body,
          mentions
        });
      } catch (fallbackError) {
        console.error(
          "[Welcome] Fallback send error:",
          fallbackError.message
        );
      }
    }
  }
};
