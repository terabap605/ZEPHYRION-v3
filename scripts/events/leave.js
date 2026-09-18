const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Function to download and return a readable stream from URL
async function getStreamFromUrl(url, filename) {
	const filePath = path.join(__dirname, filename);
	const response = await axios({
		url,
		method: "GET",
		responseType: "stream"
	});
	const writer = fs.createWriteStream(filePath);
	response.data.pipe(writer);
	await new Promise((resolve, reject) => {
		writer.on("finish", resolve);
		writer.on("error", reject);
	});
	return fs.createReadStream(filePath);
}

module.exports = {
	config: {
		name: "leave",
		version: "2.2",
		author: "Asif",
		category: "event"
	},

	onStart: async ({ threadsData, message, event, api, usersData }) => {
		// শুধুমাত্র কেউ group ছাড়লে ট্রিগার হবে
		if (event.logMessageType !== "log:unsubscribe") return;

		const { threadID, author, logMessageData } = event;
		const { leftParticipantFbId } = logMessageData;

		// যদি বট নিজে চলে যায়, কিছু করবে না
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		// যদি কেউ কিক দেয় (author ≠ leftParticipantFbId), তাহলে মেসেজ পাঠাবে না
		if (author !== leftParticipantFbId) return;

		// থ্রেড ডাটা নিয়ে আসা
		const threadData = await threadsData.get(threadID);

		// যদি leave message সিস্টেম বন্ধ থাকে
		if (!threadData?.settings?.sendLeaveMessage) return;

		// ইউজারের নাম নিয়ে আসা
		const userName = await usersData.getName(leftParticipantFbId);

		// custom leave message
		let leaveMessage =
			threadData.data.leaveMessage ||
			`${userName} bye kid.👋`;

		// Replace {userName} placeholder if exists
		leaveMessage = leaveMessage.replace(/\{userName\}/g, userName);

		// ছবি অ্যাটাচমেন্ট ডাউনলোড
		const attachment = await getStreamFromUrl(
			"https://i.postimg.cc/Y9hLSSrb/Messenger-creation-1783009032347916.webp",
			"leave.webp"
		);

		// মেসেজ পাঠানো
		await message.send({
			body: leaveMessage,
			attachment
		});
	}
};
