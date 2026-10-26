// Use after authenticate() to allow only the listed account roles on a route.
export default function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Your account role does not allow this action.' });
    next();
  };
}
