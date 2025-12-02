// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Helper para crear errores con statusCode
 */
const createError = (message, statusCode = 401) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Obtiene token desde headers o cookies
 */
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
};

/**
 * PROTECT — Requiere estar autenticado
 */
exports.protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw createError("Not authorized, no token", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -refreshTokens"
    );

    if (!user || !user.isActive) {
      throw createError("Not authorized", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * AUTENTICACIÓN OPCIONAL — si hay token, attach user; si no, seguir sin user
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "-password -refreshTokens"
      );

      req.user = user?.isActive ? user : null;
    } catch {
      req.user = null;
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * AUTHORIZE — permitir solo ciertos roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError("Not authorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};

/**
 * CHECK OWNERSHIP — validar si el usuario es dueño de un recurso
 */
exports.checkOwnership = (Model, paramName = "id", allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return next(createError("Resource not found", 404));
      }

      // Dueño del recurso
      if (
        resource.owner?.toString() === req.user._id.toString()
      ) {
        req.resource = resource;
        return next();
      }

      // Roles permitidos
      if (allowedRoles.includes(req.user.role)) {
        req.resource = resource;
        return next();
      }

      // Reglas personalizadas
      if (typeof resource.canEdit === "function") {
        if (resource.canEdit(req.user._id)) {
          req.resource = resource;
          return next();
        }
      }

      return next(createError("Not authorized to access this resource", 403));
    } catch (err) {
      console.error("Ownership check error:", err);
      return next(createError("Server error", 500));
    }
  };
};

/**
 * CHECK VIEW PERMISSION — validar si el usuario puede ver un recurso
 */
exports.checkViewPermission = (Model, paramName = "id") => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return next(createError("Resource not found", 404));
      }

      // Público
      if (!req.user) {
        if (
          resource.visibility === "public" ||
          (typeof resource.canView === "function" &&
            resource.canView(null))
        ) {
          req.resource = resource;
          return next();
        }

        return next(createError("Authentication required", 401));
      }

      // Usuario autenticado
      if (typeof resource.canView === "function") {
        if (resource.canView(req.user._id)) {
          req.resource = resource;
          return next();
        }
      }

      if (
        resource.visibility === "public" ||
        resource.owner?.toString() === req.user._id.toString()
      ) {
        req.resource = resource;
        return next();
      }

      return next(
        createError("Not authorized to view this resource", 403)
      );
    } catch (err) {
      console.error("View permission check error:", err);
      return next(createError("Server error", 500));
    }
  };
};
