const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");

// Routes
const authRoutes = require("./auth");

const wait = (timer) =>
	new Promise((resolve) =>
		setTimeout(() => {
			resolve();
		}, timer)
	);

// Redis-mock
const redisMock = require("../utils/redis-mock");

const storePayment = async ({ data, clientPub, signature }) => {
	let response = {
		isError: false,
		message: "Payment success",
	};

	const isInvalidSession = !redisMock.has(clientPub);
	if (isInvalidSession) {
		response.isError = true;
		response.message = "Bad request, invalid session";
		return response;
	}

	const session = redisMock.get(clientPub);

	const generatedHmac = await crypto
		.createHmac("sha256", Buffer.from(session.shared, "base64"))
		.update(JSON.stringify(data))
		.digest("base64");

	if (signature !== generatedHmac) {
		response.isError = true;
		response.message = "Bad request, invalid signature";
		return response;
	}

	await wait(2000);
	return response;
};

/* GET home page. */
router.use("/v1/auth", authRoutes);
router.post("/v1/payment", async (req, res) => {
	const clientPublicKey = req.headers["x-client-key"];
	const hmacSignature = req.headers["x-signature"];
	const dataPayload = req.body;

	try {
		const result = await storePayment({
			data: dataPayload,
			clientPub: clientPublicKey,
			signature: hmacSignature,
		});

		res.status(!result.isError ? 200 : 400).send({
			message: result.message,
			data: null,
		});
	} catch (err) {
		res.status(500).send({
			message: `Internal server error, ${err.message}`,
			data: null,
		});
	}
});

module.exports = router;
