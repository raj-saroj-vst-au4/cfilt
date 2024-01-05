const Redis = require("ioredis");
const { languages } = require("../constants");

const handleCheckExists = async (from) => {
  try {
    const redis = new Redis(process.env.REDIS_URL);
    const exists = await redis.hexists("wsconv", from);
    if (exists) {
      return exists;
    }
  } catch (e) {
    console.log("Unable to find whatsapp data in redis");
    return null;
  }
};

const handleCheckQuota = async (from) => {
  const exists = await handleCheckExists(from);
  console.log(exists);
  if (exists) {
    const redis = new Redis(process.env.REDIS_URL);
    try {
      const data = await redis.hget("wsconv", from);
      if (data) {
        const parsedData = JSON.parse(data);
        return parsedData.freeQuota || 0;
      }
      return 0;
    } catch (e) {
      console.log(e);
      return 0;
    }
  }
};

const handleSourceLang = (code) => {
  const language = languages.find((lang) => lang.code === code);
  return language ? language.name : null;
};

const handleSave2Redis = async (from, sourcelang, targetlang, quota) => {
  const redis = new Redis(process.env.REDIS_URL);
  const exists = await handleCheckExists(from);
  if (!exists) {
    const redisData = {
      srclang: sourcelang,
      trglang: targetlang,
      freeQuota: quota, // Assuming the free quota is initially set to 10
    };
    try {
      await redis.hset("wsconv", from, JSON.stringify(redisData));
      console.log("saved data to redis");
      setExpiration(from);
    } catch (e) {
      console.log(e);
    }
  }
};

const handleUpdateOnRedis = async (from, sourcelang, targetlang) => {
  const redis = new Redis(process.env.REDIS_URL);
  try {
    const data = await redis.hget("wsconv", from);
    if (data) {
      const parsedData = JSON.parse(data);
      if (sourcelang !== null) {
        parsedData.srclang = sourcelang;
      }
      if (targetlang !== null) {
        parsedData.trglang = targetlang;
      }
      await redis.hset("wsconv", from, JSON.stringify(parsedData));
      console.log("Updated data on redis");

      return handleSourceLang(parsedData.srclang);
    }
  } catch (e) {
    console.log(e);
  }
};

const setExpiration = async (id) => {
  const redis = new Redis(process.env.REDIS_URL);
  try {
    await redis.expire(`wsconv:${id}`, 7200); // Set expiration for the key to 5 hours (in seconds)
    console.log("Expiration set for wsconv key");
  } catch (e) {
    console.log(e);
  }
};

const handleDecrementQuota = async (from) => {
  const redis = new Redis(process.env.REDIS_URL);
  try {
    const data = await redis.hget("wsconv", from);
    console.log("decrementing from ", data);
    if (data) {
      let parsedData = JSON.parse(data);
      parsedData.freeQuota = parsedData.freeQuota - 1;
      return await redis.hset("wsconv", from, JSON.stringify(parsedData));
    }
  } catch (e) {
    return console.log("error decrementing user quota", e);
  }
};

module.exports = {
  handleCheckExists,
  handleSave2Redis,
  handleCheckQuota,
  handleUpdateOnRedis,
  setExpiration,
  handleDecrementQuota,
};
