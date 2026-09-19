const cronAuth = (req, res, next) => {
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
};

export default cronAuth;
