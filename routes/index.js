const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Controllers
const fetchWidgetScript = async () => {
	const widgetURL = `https://widget.reusely.com/v3.js`;
	const response = await fetch(widgetURL);
	const widgetScript = await response.text();

	return widgetScript.replace(
		/https:\/\/api.reusely.com/g,
		"http://localhost:3000/proxy"
	);
};

/* GET home page. */
router.use("/widget", async (req, res) => {
	try {
		const widgetScript = await fetchWidgetScript();
		res.status(200).send(widgetScript);
	} catch (err) {
		res.status(500).send("Internal server errro");
	}
});

module.exports = router;
