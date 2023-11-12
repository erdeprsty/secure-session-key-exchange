const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");

// Note: on production use redis instead of hardcoded
const redisMock = require("../utils/redis-mock");

const handleSessionExchange = (clientPublicKey = undefined) => {
	if (!clientPublicKey) return false;
	const ecdh = crypto.createECDH("prime256v1");
	ecdh.generateKeys();
	const pubKey = ecdh.getPublicKey("base64");
	const pvtKey = ecdh.getPrivateKey("base64");
	const sharedKey = ecdh.computeSecret(
		Buffer.from(clientPublicKey, "base64"),
		"base64",
		"base64"
	);

	redisMock.set(clientPublicKey, { private: pvtKey, shared: sharedKey });
	return {
		server_key: pubKey,
	};
};

router.get("/session/exchange", async (req, res) => {
	const clientPublicKey = req.headers["x-client-key"];
	if (!clientPublicKey)
		return res.status(400).json({
			message: "Invalid request",
			data: null,
		});
	const data = await handleSessionExchange(clientPublicKey);
	res.status(200).send({
		message: "success",
		data,
	});
});

module.exports = router;
