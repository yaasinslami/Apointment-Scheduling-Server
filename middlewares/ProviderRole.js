const verifyProviderRole = (req, res, next) => {
    if (req.user.role !== 'provider') {
        return res.status(403).json({ status: 'fail', message: 'Access denied. Only service providers can perform this operation' });
        return res.status(403).json({ status: 'fail', message: 'Access denied. Only service providers can perform this operation' });
    }
    next();
};

module.exports = verifyProviderRole;
