const success = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const error = (res, message, status = 400, code = null) =>
  res.status(status).json({ success: false, error: message, ...(code && { code }) });

const paginated = (res, data, total, page, limit) =>
  res.status(200).json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });

module.exports = { success, error, paginated };
