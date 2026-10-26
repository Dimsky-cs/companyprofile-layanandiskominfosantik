exports.isAdminAuth = (req, res, next) => {
  if (req.session && (req.session.admin || req.session.adminUser)) {
    return next();
  }
  if (
    (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
    (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) ||
    req.xhr
  ) {
    return res.status(401).json({
      success: false,
      message: "Sesi login admin telah berakhir. Silakan login kembali.",
    });
  }
  return res.redirect(
    "/admin-diskominfo/login?error=" +
      encodeURIComponent(
        "Silakan login terlebih dahulu untuk mengakses panel admin.",
      ),
  );
};
